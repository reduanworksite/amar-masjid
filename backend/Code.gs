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

function filterByLocation(params) {
  let rows = rowsAsObjects(SHEETS.MOSQUES).filter((r) => String(r.Status) === 'approved');
  ['Division', 'District', 'Upazila', 'UnionName'].forEach((key) => {
    const paramKey = key.charAt(0).toLowerCase() + key.slice(1);
    if (params[paramKey]) rows = rows.filter((r) => String(r[key]) === String(params[paramKey]));
  });
  if (params.sort === 'alpha') rows.sort((a, b) => String(a.NameBn).localeCompare(String(b.NameBn), 'bn'));
  else rows.sort((a, b) => String(b.CreatedAt).localeCompare(String(a.CreatedAt)));
  return { ok: true, total: rows.length, mosques: rows.map(publicMosque) };
}

function submitMosque(params) {
  validateMosqueInput(params);
  return withLock(() => {
    const id = nextMosqueId();
    const now = new Date();
    const existing = rowsAsObjects(SHEETS.MOSQUES).concat(rowsAsObjects(SHEETS.SUBMISSIONS));
    const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
    const dupes = existing.filter((r) =>
      norm(r.NameBn) === norm(params.nameBn) &&
      String(r.District) === String(params.district) &&
      String(r.Upazila) === String(params.upazila) &&
      norm(r.Village) === norm(params.village));
    appendRow(SHEETS.SUBMISSIONS, [
      id, params.nameBn, params.nameEn || '', params.imamName, false,
      params.division, params.district, params.upazila, params.unionName || '',
      params.village, params.address, params.establishedYear || '', params.description || '',
      '', params.mapsUrl || '', params.committeeContact || '',
      params.submittedBy, params.submitterMobile,
      params.mainImageFileId || '', params.galleryFileIds || '',
      false, false, false, 'pending', now, 0,
    ]);
    logActivity('Public', 'New submission', params.nameBn, id + ' — Pending');
    return { ok: true, id: id, status: 'pending', duplicates: dupes.map((d) => ({ id: d.MosqueID, nameBn: d.NameBn })) };
  });
}

function uploadMosqueImages(params) {
  const mosqueId = String(params.mosqueId || '');
  if (!mosqueId) throw new Error('mosqueId is required.');
  const images = params.images || [];
  if (!Array.isArray(images) || images.length === 0) throw new Error('No images provided.');
  if (images.length > 7) throw new Error('Maximum 7 images per mosque.');
  const photosFolderId = getSetting('PHOTOS_FOLDER_ID') || CONFIG.PHOTOS_FOLDER_ID;
  const galleriesFolderId = getSetting('GALLERIES_FOLDER_ID') || CONFIG.GALLERIES_FOLDER_ID;
  if (!photosFolderId) throw new Error('PHOTOS_FOLDER_ID is not configured.');
  return withLock(() => {
    const mainFolder = DriveApp.getFolderById(photosFolderId);
    const galleryFolder = galleriesFolderId ? DriveApp.getFolderById(galleriesFolderId) : mainFolder;
    const fileIds = [];
    images.forEach((img, i) => {
      if (!img.data) throw new Error('Image data missing for image ' + (i + 1));
      const bytes = Utilities.base64Decode(String(img.data).replace(/^data:[^;]+;base64,/, ''));
      const blob = Utilities.newBlob(bytes, img.mimeType || 'image/jpeg', mosqueId + '-' + (i + 1) + '.jpg');
      const folder = i === 0 ? mainFolder : galleryFolder;
      const file = folder.createFile(blob);
      file.setDescription('Amar Masjid — ' + mosqueId);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileIds.push(file.getId());
    });
    return { ok: true, mosqueId: mosqueId, mainImageFileId: fileIds[0], galleryFileIds: fileIds.slice(1).join(',') };
  });
}

function requestCorrection(params) {
  const required = ['mosqueId', 'field', 'correctedValue', 'reporterName'];
  for (const key of required) {
    if (!params[key] || !String(params[key]).trim()) throw new Error('Missing required field: ' + key);
  }
  appendRow(SHEETS.CORRECTIONS, [
    'CR-' + Date.now(), params.mosqueId, params.mosqueName || '',
    params.field, params.currentValue || '', params.correctedValue,
    params.reporterName, params.reporterMobile || '', params.note || '',
    'open', new Date(),
  ]);
  logActivity('Public', 'Correction request', params.mosqueName || params.mosqueId, params.field + ': ' + params.correctedValue);
  return { ok: true, status: 'open' };
}

function getPendingSubmissions(params) {
  requireAdmin(params);
  const rows = rowsAsObjects(SHEETS.SUBMISSIONS).filter((r) => String(r.Status) === 'pending');
  return { ok: true, total: rows.length, submissions: rows };
}

function approveMosque(params) {
  const admin = requireAdmin(params);
  const id = String(params.id || params.mosqueId || '');
  if (!id) throw new Error('Mosque id is required.');
  return withLock(() => {
    const subRow = findSubmissionRow(id);
    if (subRow < 0) throw new Error('Submission not found: ' + id);
    const values = sheet(SHEETS.SUBMISSIONS).getRange(subRow, 1, 1, MOSQUE_HEADERS.length).getValues()[0];
    values[23] = 'approved';
    sheet(SHEETS.MOSQUES).appendRow(values);
    sheet(SHEETS.SUBMISSIONS).getRange(subRow, 24, 1, 1).setValue('approved');
    logActivity(admin, 'Approve mosque', values[1], id + ' — approved and published');
    return { ok: true, id: id, status: 'approved' };
  });
}

function rejectMosque(params) {
  const admin = requireAdmin(params);
  const id = String(params.id || params.mosqueId || '');
  if (!id) throw new Error('Mosque id is required.');
  return withLock(() => {
    const subRow = findSubmissionRow(id);
    if (subRow < 0) throw new Error('Submission not found: ' + id);
    sheet(SHEETS.SUBMISSIONS).getRange(subRow, 24, 1, 1).setValue('rejected');
    logActivity(admin, 'Reject mosque', id, 'Reason: ' + (params.reason || '—'));
    return { ok: true, id: id, status: 'rejected' };
  });
}

function updateMosque(params) {
  const admin = requireAdmin(params);
  const id = String(params.id || params.mosqueId || '');
  if (!id) throw new Error('Mosque id is required.');
  const editable = ['NameBn', 'NameEn', 'Division', 'District', 'Upazila', 'UnionName', 'Village', 'Address', 'EstablishedYear', 'Description', 'History', 'MapsUrl', 'CommitteeContact', 'Verified', 'Featured'];
  return withLock(() => {
    const row = findMosqueRow(id);
    if (row < 0) throw new Error('Mosque not found: ' + id);
    const headers = sheet(SHEETS.MOSQUES).getRange(1, 1, 1, MOSQUE_HEADERS.length).getValues()[0];
    editable.forEach((key) => {
      if (params[key] !== undefined) {
        const col = headers.indexOf(key) + 1;
        if (col > 0) sheet(SHEETS.MOSQUES).getRange(row, col).setValue(params[key]);
      }
    });
    logActivity(admin, 'Update mosque', id, 'Fields updated: ' + editable.filter((k) => params[k] !== undefined).join(', '));
    return { ok: true, id: id };
  });
}

function updateImam(params) {
  const admin = requireAdmin(params);
  const id = String(params.id || params.mosqueId || '');
  const imamName = String(params.imamName || '').trim();
  if (!id || !imamName) throw new Error('Mosque id and imamName are required.');
  return withLock(() => {
    const row = findMosqueRow(id);
    if (row < 0) throw new Error('Mosque not found: ' + id);
    sheet(SHEETS.MOSQUES).getRange(row, 4).setValue(imamName);
    sheet(SHEETS.MOSQUES).getRange(row, 5).setValue(true);
    logActivity(admin, 'Update imam', id, 'Imam updated to: ' + imamName);
    return { ok: true, id: id, imamName: imamName };
  });
}

function archiveMosque(params) {
  const admin = requireAdmin(params);
  const id = String(params.id || params.mosqueId || '');
  if (!id) throw new Error('Mosque id is required.');
  return withLock(() => {
    const row = findMosqueRow(id);
    if (row < 0) throw new Error('Mosque not found: ' + id);
    sheet(SHEETS.MOSQUES).getRange(row, 24).setValue('archived');
    logActivity(admin, 'Archive mosque', id, 'Mosque archived');
    return { ok: true, id: id, status: 'archived' };
  });
}

function getDashboardStats(params) {
  requireAdmin(params);
  const mosques = rowsAsObjects(SHEETS.MOSQUES);
  const subs = rowsAsObjects(SHEETS.SUBMISSIONS);
  const approved = mosques.filter((r) => String(r.Status) === 'approved');
  const districts = {};
  approved.forEach((r) => { districts[r.District] = (districts[r.District] || 0) + 1; });
  return {
    ok: true,
    totalMosques: mosques.length,
    approved: approved.length,
    pending: subs.filter((r) => String(r.Status) === 'pending').length,
    rejected: subs.filter((r) => String(r.Status) === 'rejected').length,
    districtsCovered: Object.keys(districts).length,
    byDistrict: districts,
    openCorrections: rowsAsObjects(SHEETS.CORRECTIONS).filter((r) => String(r.Status) === 'open').length,
  };
}

function adminLogin(params) {
  const username = String(params.username || '').trim();
  const password = String(params.password || '');
  if (!username || !password) throw new Error('Username and password are required.');
  const admins = rowsAsObjects(SHEETS.ADMINS);
  const admin = admins.find((a) => String(a.Username) === username);
  if (!admin) throw new Error('Invalid username or password.');
  if (sha256Hex(password + String(admin.Salt || '')) !== String(admin.PasswordHash || '')) {
    throw new Error('Invalid username or password.');
  }
  const token = newToken();
  const expires = Date.now() + CONFIG.SESSION_TTL_MINUTES * 60 * 1000;
  const values = sheet(SHEETS.ADMINS).getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === username) {
      sheet(SHEETS.ADMINS).getRange(i + 1, 3).setValue(token);
      sheet(SHEETS.ADMINS).getRange(i + 1, 4).setValue(expires);
      break;
    }
  }
  logActivity(username, 'Admin login', 'Dashboard', 'Login successful');
  return { ok: true, token: token, expiresAt: expires, username: username };
}

function verifyAdminSession(params) {
  const username = requireAdmin(params);
  return { ok: true, valid: true, username: username };
}

function createBackup(params) {
  requireAdmin(params);
  const backupsFolderId = getSetting('BACKUPS_FOLDER_ID') || CONFIG.BACKUPS_FOLDER_ID;
  if (!backupsFolderId) throw new Error('BACKUPS_FOLDER_ID is not configured.');
  const spreadsheetId = getSetting('SPREADSHEET_ID') || CONFIG.SPREADSHEET_ID;
  const file = DriveApp.getFileById(spreadsheetId);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
  const copy = file.makeCopy('AMAR_MASJID_BACKUP_' + stamp, DriveApp.getFolderById(backupsFolderId));
  logActivity('Admin', 'Create backup', copy.getName(), 'Backup saved to DATABASE_BACKUPS');
  return { ok: true, backupFileId: copy.getId(), name: copy.getName() };
}

function setupSheets() {
  const spreadsheetId = CONFIG.SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('Set CONFIG.SPREADSHEET_ID first.');
  const book = SpreadsheetApp.openById(spreadsheetId);
  const headers = {};
  headers[SHEETS.MOSQUES] = MOSQUE_HEADERS;
  headers[SHEETS.SUBMISSIONS] = MOSQUE_HEADERS;
  headers[SHEETS.LOCATIONS] = ['Division', 'District', 'Upazila', 'UnionName'];
  headers[SHEETS.ADMINS] = ['Username', 'PasswordHash', 'SessionToken', 'SessionExpires', 'Salt', 'CreatedAt'];
  headers[SHEETS.LOGS] = ['Timestamp', 'Actor', 'Action', 'Target', 'Detail'];
  headers[SHEETS.SETTINGS] = ['Key', 'Value'];
  headers[SHEETS.CORRECTIONS] = ['CorrectionID', 'MosqueID', 'MosqueName', 'Field', 'CurrentValue', 'CorrectedValue', 'ReporterName', 'ReporterMobile', 'Note', 'Status', 'CreatedAt'];
  Object.keys(headers).forEach((name) => {
    let sh = book.getSheetByName(name);
    if (!sh) sh = book.insertSheet(name);
    sh.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]);
    sh.getRange(1, 1, 1, headers[name].length).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  const settings = book.getSheetByName(SHEETS.SETTINGS);
  settings.getRange(2, 1, 4, 2).setValues([
    ['SPREADSHEET_ID', spreadsheetId],
    ['PHOTOS_FOLDER_ID', CONFIG.PHOTOS_FOLDER_ID],
    ['GALLERIES_FOLDER_ID', CONFIG.GALLERIES_FOLDER_ID],
    ['BACKUPS_FOLDER_ID', CONFIG.BACKUPS_FOLDER_ID],
  ]);
}
