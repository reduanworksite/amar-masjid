# AMAR MASJID — Backend Setup Guide

> **এই ধাপগুলো Reduan নিজে করবেন** — Google Authorization শুধু তিনিই করতে পারবেন।
> Muse কখনো আপনার Google অ্যাকাউন্টের পাসওয়ার্ড বা OTP চাইবে না।
>
> **অগ্রগতি (2026-11-27): ধাপ ১ ও ২ ইতিমধ্যে সম্পন্ন** — নিচে আইডিসহ
> লেখা আছে। বাকি আছে শুধু ধাপ ৩ (অ্যাডমিন অ্যাকাউন্ট), ধাপ ৫ (Web App
> Deploy — Google Authorization লাগে) ও ধাপ ৬ (VITE_API_URL)।

## ধাপ ১ — Google Drive ফোল্ডার তৈরি করুন ✅ সম্পন্ন (2026-11-27)

ফোল্ডারটি **reduancomputer1@gmail.com** অ্যাকাউন্টে তৈরি হয়েছে
(Drive সংযোগ এই অ্যাকাউন্টের):

| ফোল্ডার | ID |
|---|---|
| `AMAR_MASJID_DATABASE` | `1UYiiCDDLLxnkqTd-vG7x0gfFuMS3J7tk` |
| `MOSQUE_PHOTOS` | `18_hSl9gvm5cKZn2Td4AY5DTHy-gGTEzL` |
| `MOSQUE_GALLERIES` | `1REqcieB1yfvo8mOmenJddrcIIQoH36OY` |
| `DATABASE_BACKUPS` | `1ITimWfD4dZQGA4COsQpeUY8SXGvvnnCQ` |

লিংক: https://drive.google.com/drive/folders/1UYiiCDDLLxnkqTd-vG7x0gfFuMS3J7tk

ফোল্ডারটি **reduan.digital@gmail.com-কে writer** হিসেবে শেয়ার করা হয়েছে,
যাতে Apps Script (reduan.digital হিসেবে চলবে) ছবি আপলোড করতে পারে।
ফোল্ডার কখনো Public করা হয়নি।

> ⚠️ ফোল্ডারগুলো **Private** রাখুন — কাউকে শেয়ার করবেন না। শুধু প্রতিটি
> ছবির ফাইল আলাদাভাবে "Anyone with the link can view" হয় (Apps Script
> নিজে সেটি করে), ফোল্ডার নয়।

## ধাপ ২ — Google Spreadsheet তৈরি করুন ✅ সম্পন্ন (2026-11-27)

স্প্রেডশিট **`AMAR_MASJID_MASTER_DATABASE`** তৈরি হয়েছে
**reduan.digital@gmail.com** অ্যাকাউন্টে (Sheets সংযোগ এই অ্যাকাউন্টের):

- **Spreadsheet ID:** `1vEv4XcHVk6ARSEejHpIyhwrjgG0pOmm5c_3JOGGze6E`
- লিংক: https://docs.google.com/spreadsheets/d/1vEv4XcHVk6ARSEejHpIyhwrjgG0pOmm5c_3JOGGze6E/edit
- ৭টি শিট তৈরি, হেডার বসানো ও যাচাই করা হয়েছে (readback দিয়ে):
  - `Mosques` — অনুমোদিত মসজিদ (২৬টি কলাম)
  - `Submissions` — সব নিবন্ধন (Pending সহ, ২৬টি কলাম)
  - `Locations` — বিভাগ/জেলা/উপজেলা/ইউনিয়ন তালিকা
  - `AdminUsers` — অ্যাডমিন অ্যাকাউন্ট (পাসওয়ার্ড হ্যাশ)
  - `ActivityLogs` — সব গুরুত্বপূর্ণ পরিবর্তনের লগ
  - `Settings` — কনফিগারেশন (SPREADSHEET_ID + ৪টি ফোল্ডার আইডি বসানো)
  - `CorrectionRequests` — ভুল তথ্যের সংশোধন আবেদন
- প্রথম সারি bold + frozen। `backend/Code.gs`-এর `CONFIG`-এ সব আইডি
  বসানো হয়েছে — `setupSheets()` আর চালাতে হবে না।

> **জানা সীমাবদ্ধতা:** Drive সংযোগ (reduancomputer1) আর Sheets সংযোগ
> (reduan.digital) দুটি আলাদা অ্যাকাউন্ট — একে অপরের ফাইল দেখতে পায় না।
> তাই স্প্রেডশিটটি Drive ফোল্ডারের ভেতরে সরানো যায়নি; এটি
> reduan.digital-এর Drive রুটে আছে। এটি Apps Script-এর জন্য সঠিকও —
> Deploy reduan.digital হিসেবেই করতে হবে (স্প্রেডশিটের মালিক)। চাইলে
> Reduan নিজে Drive UI-তে স্প্রেডশিটটি ফোল্ডারে টেনে নিতে পারেন, তবে
> Apps Script-এর কাজে তা জরুরি নয়।

## ধাপ ৩ — অ্যাডমিন অ্যাকাউন্ট তৈরি করুন

`AdminUsers` শিটে একটি সারি যোগ করুন:

| Username | PasswordHash | Salt |
|---|---|---|
| admin | _(নিচের হ্যাশ)_ | _(যেকোনো এলোমেলো লেখা)_ |

হ্যাশ তৈরি করতে Apps Script এডিটরে এই ফাংশনটি চালান (একবার):

```js
function makeAdminHash() {
  var salt = 'amar-masjid-' + new Date().getTime();
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
    'আপনার-পাসওয়ার্ড' + salt, Utilities.Charset.UTF_8)
    .map(function(b){ return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join('');
  Logger.log('Salt: ' + salt);
  Logger.log('Hash: ' + hash);
}
```

`Salt` ও `Hash` কপি করে শিটে বসান। **পাসওয়ার্ডটি কোথাও লিখে রাখবেন না
— শুধু মনে রাখুন।** পাসওয়ার্ড কখনো GitHub-এ বা কোডে রাখবেন না।

## ধাপ ৪ — ছবি কীভাবে পাবলিক হবে (নিরাপদ উপায়)

- ছবি থাকে **Private** Drive ফোল্ডারে।
- প্রতিটি ছবির ফাইল আলাদাভাবে "Anyone with the link can view" হয়
  (Apps Script-এর `uploadMosqueImages()` এটি নিজে করে)।
- ওয়েবসাইট ছবি দেখায় Google-এর thumbnail লিংক দিয়ে:
  `https://drive.google.com/thumbnail?id=<FILE_ID>&sz=w1200`
- ফোল্ডার কখনো পাবলিক করা হয় না, সরাসরি Drive লিংক ব্যবহার করা হয় না।

## ধাপ ৫ — Web App হিসেবে Deploy করুন

1. Apps Script এডিটরে **Deploy → New deployment → Web app**।
2. **Execute as:** Me
3. **Who has access:** Anyone
4. Deploy চাপুন → Google Authorization চাইবে → নিজে অনুমোদন দিন।
5. পাওয়া **Web App URL** নোট করুন।

## ধাপ ৬ — Frontend-এর সঙ্গে যুক্ত করুন

GitHub রিপোর **Settings → Secrets and variables → Actions → Variables**-এ যোগ করুন:

| Variable | Value |
|---|---|
| `VITE_API_URL` | ধাপ ৫-এর Web App URL |

তারপর নতুন করে deploy করলে সাইট Apps Script API ব্যবহার করবে। না করলে সাইট
localStorage ডেমো মোডে চলবে (নিবন্ধন শুধু ওই ব্রাউজারে সংরক্ষিত হবে)।

## API Actions (সবগুলো `backend/Code.gs`-এ আছে)

| Action | কাজ | Auth |
|---|---|---|
| `submitMosque` | নতুন নিবন্ধন জমা | — |
| `uploadMosqueImages` | ছবি Drive-এ আপলোড | — |
| `getApprovedMosques` | অনুমোদিত মসজিদের তালিকা | — |
| `getMosqueDetails` | একটি মসজিদের বিবরণ | — |
| `searchMosques` | নাম/ইমাম/অবস্থান দিয়ে খোঁজা | — |
| `filterByLocation` | বিভাগ/জেলা/উপজেলা ফিল্টার | — |
| `getPendingSubmissions` | অপেক্ষমাণ নিবন্ধন | Admin token |
| `approveMosque` | অনুমোদন ও প্রকাশ | Admin token |
| `rejectMosque` | প্রত্যাখ্যান | Admin token |
| `updateMosque` | মসজিদের তথ্য সম্পাদনা | Admin token |
| `updateImam` | ইমামের নাম আপডেট | Admin token |
| `archiveMosque` | আর্কাইভ | Admin token |
| `requestCorrection` | ভুল তথ্যের আবেদন | — |
| `getDashboardStats` | ড্যাশবোর্ড পরিসংখ্যান | Admin token |
| `adminLogin` | অ্যাডমিন লগইন (টোকেন দেয়) | username+password |
| `verifyAdminSession` | সেশন যাচাই | Admin token |
| `createBackup` | স্প্রেডশিটের ব্যাকআপ কপি | Admin token |

**গোপনীয়তা:** পাবলিক API কখনো জমাদানকারীর নাম, মোবাইল নম্বর বা কমিটির
যোগাযোগ নম্বর ফেরত দেয় না — `publicMosque()` সেগুলো ছেঁটে ফেলে।

## নিরাপত্তা নোট

- Google Sheets ও Drive **কখনো Public করবেন না**।
- পাসওয়ার্ড শুধু SHA-256 হ্যাশ আকারে `AdminUsers` শিটে থাকে।
- একসঙ্গে অনেক অনুরোধ এলে `LockService` লেখা সিরিয়াল করে — ডেটা নষ্ট হয় না।
- সার্ভার-সাইডে সব ইনপুট যাচাই করা হয় (`validateMosqueInput()`)।
