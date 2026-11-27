/**
 * AMAR MASJID — Google Apps Script Backend
 * ==========================================
 * Spreadsheet: AMAR_MASJID_MASTER_DATABASE
 * Sheets: Mosques | Submissions | Locations | AdminUsers | ActivityLogs | Settings | CorrectionRequests
 * Drive folder: AMAR_MASJID_DATABASE
 *   Subfolders: MOSQUE_PHOTOS | MOSQUE_GALLERIES | DATABASE_BACKUPS
 *
 * Deploy: Publish > Deploy as web app > Execute as: Me > Access: Anyone.
 * The frontend calls this with ?action=<name> (GET) or POST JSON {action, ...}.
 *
 * SECURITY
 * - Sheets and Drive folders are NEVER made public.
 * - Public actions (getApprovedMosques / getMosqueDetails / searchMosques /
 *   filterByLocation) NEVER return submitter name, mobile or committee contact.
 * - Admin actions require a session token from adminLogin(); passwords are
 *   stored only as SHA-256 hashes in AdminUsers (never plaintext).
 * - All writes use LockService to serialize concurrent requests.
 * - Every input is validated server-side before any write.
 *
 * SETUP: see backend/SETUP_GUIDE.md
 */

const CONFIG = {
  SPREADSHEET_ID: '1vEv4XcHVk6ARSEejHpIyhwrjgG0pOmm5c_3JOGGze6E',
  DRIVE_FOLDER_ID: '1UYiiCDDLLxnkqTd-vG7x0gfFuMS3J7tk',
  PHOTOS_FOLDER_ID: '18_hSl9gvm5cKZn2Td4AY5DTHy-gGTEzL',
  GALLERIES_FOLDER_ID: '1REqcieB1yfvo8mOmenJddrcIIQoH36OY',
  BACKUPS_FOLDER_ID: '1ITimWfD4dZQGA4COsQpeUY8SXGvvnnCQ',
  SESSION_TTL_MINUTES: 720,
};

const SHEETS = {
  MOSQUES: 'Mosques',
  SUBMISSIONS: 'Submissions',
  LOCATIONS: 'Locations',
  ADMINS: 'AdminUsers',
  LOGS: 'ActivityLogs',
  SETTINGS: 'Settings',
  CORRECTIONS: 'CorrectionRequests',
};

const MOSQUE_HEADERS = [
  'MosqueID', 'NameBn', 'NameEn', 'ImamName', 'ImamVerified', 'Division', 'District',
  'Upazila', 'UnionName', 'Village', 'Address', 'EstablishedYear', 'Description',
  'History', 'MapsUrl', 'CommitteeContact', 'SubmittedBy', 'SubmitterMobile',
  'MainImageFileId', 'GalleryFileIds', 'RepresentativePhoto', 'Verified',
  'Featured', 'Status', 'CreatedAt', 'Views',
];

function doGet(e) {
  return handleRequest(e.parameter || {});
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (err) { /* ignore */ }
  return handleRequest(body);
}

function handleRequest(params) {
  const action = String(params.action || '');
  const actions = {
    submitMosque: submitMosque,
    uploadMosqueImages: uploadMosqueImages,
    getApprovedMosques: getApprovedMosques,
    getMosqueDetails: getMosqueDetails,
    searchMosques: searchMosques,
    filterByLocation: filterByLocation,
    getPendingSubmissions: getPendingSubmissions,
    approveMosque: approveMosque,
    rejectMosque: rejectMosque,
    updateMosque: updateMosque,
    updateImam: updateImam,
    archiveMosque: archiveMosque,
    requestCorrection: requestCorrection,
    getDashboardStats: getDashboardStats,
    adminLogin: adminLogin,
    verifyAdminSession: verifyAdminSession,
    createBackup: createBackup,
  };
  const fn = actions[action];
  if (!fn) return json({ ok: false, error: 'Unknown action: ' + action });
  try {
    return json(fn(params));
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function ss() {
  const id = getSetting('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
  if (!id) throw new Error('SPREADSHEET_ID is not configured. See SETUP_GUIDE.md.');
  return SpreadsheetApp.openById(id);
}

function sheet(name) {
  const s = ss().getSheetByName(name);
  if (!s) throw new Error('Sheet not found: ' + name);
  return s;
}

function getSetting(key) {
  try {
    const rows = sheet(SHEETS.SETTINGS).getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === key) return String(rows[i][1] || '');
    }
  } catch (err) { /* settings sheet may not exist yet */ }
  return '';
}

function rowsAsObjects(name) {
  const values = sheet(name).getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow(name, values) {
  sheet(name).appendRow(values);
}

function sha256Hex(text) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return digest.map((b) => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('');
}

function newToken() {
  return Utilities.getUuid().replace(/-/g, '') + Date.now().toString(36);
}

function requireAdmin(params) {
  const token = String(params.token || '');
  if (!token) throw new Error('Admin session required.');
  const admins = rowsAsObjects(SHEETS.ADMINS);
  const now = Date.now();
  const match = admins.find((a) => String(a.SessionToken || '') === token);
  if (!match) throw new Error('Invalid admin session.');
  const expires = Number(match.SessionExpires || 0);
  if (!expires || expires < now) throw new Error('Admin session expired. Please log in again.');
  return String(match.Username || 'admin');
}

function logActivity(actor, action, target, detail) {
  appendRow(SHEETS.LOGS, [new Date(), actor, action, target, detail]);
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function validateMosqueInput(p) {
  const required = ['nameBn', 'imamName', 'division', 'district', 'upazila', 'village', 'address', 'submittedBy', 'submitterMobile'];
  for (const key of required) {
    if (!p[key] || !String(p[key]).trim()) throw new Error('Missing required field: ' + key);
  }
  if (String(p.nameBn).length > 200) throw new Error('Mosque name is too long.');
  if (String(p.imamName).length > 120) throw new Error('Imam name is too long.');
  if (String(p.submitterMobile).replace(/[^0-9+]/g, '').length < 10) throw new Error('Invalid submitter mobile number.');
  if (p.mapsUrl && !/^https?:\/\//.test(String(p.mapsUrl))) throw new Error('Invalid Google Maps URL.');
  if (p.permission !== true && p.permission !== 'true') throw new Error('Publishing permission is required.');
  if (p.establishedYear && !/^\d{4}$/.test(String(p.establishedYear))) throw new Error('Established year must be a 4-digit year.');
}

function nextMosqueId() {
  const mosques = rowsAsObjects(SHEETS.MOSQUES);
  const subs = rowsAsObjects(SHEETS.SUBMISSIONS);
  let max = 0;
  mosques.concat(subs).forEach((r) => {
    const n = parseInt(String(r.MosqueID || '').replace('AM-', ''), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return 'AM-' + String(max + 1).padStart(6, '0');
}

function publicMosque(row) {
  return {
    id: row.MosqueID,
    nameBn: row.NameBn,
    nameEn: row.NameEn || '',
    imamName: row.ImamName,
    imamVerified: row.ImamVerified === true || row.ImamVerified === 'TRUE',
    division: row.Division,
    district: row.District,
    upazila: row.Upazila,
    unionName: row.UnionName || '',
    village: row.Village,
    address: row.Address,
    establishedYear: row.EstablishedYear || '',
    description: row.Description || '',
    history: row.History || '',
    mapsUrl: row.MapsUrl || '',
    images: publicImageUrls(row),
    representativePhoto: row.RepresentativePhoto === true || row.RepresentativePhoto === 'TRUE',
    verified: row.Verified === true || row.Verified === 'TRUE',
    featured: row.Featured === true || row.Featured === 'TRUE',
    status: row.Status,
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString().slice(0, 10) : '',
  };
}

function publicImageUrls(row) {
  const ids = [];
  if (row.MainImageFileId) ids.push(String(row.MainImageFileId));
  if (row.GalleryFileIds) {
    String(row.GalleryFileIds).split(',').forEach((id) => { if (id.trim()) ids.push(id.trim()); });
  }
  return ids.map((id) => 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1200');
}

function findMosqueRow(id) {
  const values = sheet(SHEETS.MOSQUES).getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function findSubmissionRow(id) {
  const values = sheet(SHEETS.SUBMISSIONS).getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function getApprovedMosques(params) {
  const limit = Math.min(200, Math.max(1, parseInt(params.limit || '100', 10) || 100));
  const offset = Math.max(0, parseInt(params.offset || '0', 10) || 0);
  const rows = rowsAsObjects(SHEETS.MOSQUES).filter((r) => String(r.Status) === 'approved');
  rows.sort((a, b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)));
  return { ok: true, total: rows.length, mosques: rows.slice(offset, offset + limit).map(publicMosque) };
}

function getMosqueDetails(params) {
  const id = String(params.id || params.mosqueId || '');
  if (!id) throw new Error('Mosque id is required.');
  const row = rowsAsObjects(SHEETS.MOSQUES).find((r) => String(r.MosqueID) === id && String(r.Status) === 'approved');
  if (!row) throw new Error('Mosque not found.');
  return { ok: true, mosque: publicMosque(row) };
}

function searchMosques(params) {
  const q = String(params.q || '').trim().toLowerCase();
  const rows = rowsAsObjects(SHEETS.MOSQUES).filter((r) => String(r.Status) === 'approved');
  const hay = (r) => [r.NameBn, r.NameEn, r.ImamName, r.Division, r.District, r.Upazila, r.UnionName, r.Village, r.Address, r.MosqueID].join(' ').toLowerCase();
  const matched = q ? rows.filter((r) => q.split(/\s+/).every((tok) => hay(r).includes(tok))) : rows;
  return { ok: true, total: matched.length, mosques: matched.map(publicMosque) };
}
