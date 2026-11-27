# AMAR MASJID — Status (আপডেট: 2026-11-27, ~13:25 +06)

> Reduan PC বন্ধ করে বাইরে গেছেন — এই ফাইলে কাজের অগ্রগতি সংরক্ষিত আছে।
> ফিরে এসে এই ফাইল দেখলেই বোঝা যাবে কী হয়েছে আর কী বাকি।

## ✅ সম্পন্ন — যা তৈরি ও যাচাই করা হয়েছে

### Frontend (React 19 + Vite + TypeScript + Tailwind 4)
- Homepage-এর ১৪টি Section, Hero, Smart Search, Directory, Division / District / Upazila explore, Featured, Gallery, Register CTA, How It Works, About, Footer
- Search (`#/search`): মসজিদের নাম, ইমামের নাম, বিভাগ/জেলা/উপজেলা/ইউনিয়ন/গ্রাম/মহল্লা; লাইভ সাজেশন; একসঙ্গে একাধিক ফিল্টার; বাংলা + ইংরেজি
- Directory (`#/mosques`): কার্ড, Verified ব্যাজ, Load More, ক্লিকে প্রোফাইল
- Registration (`#/register`): ১৮টি ফিল্ড, Dependent Dropdown (বিভাগ → জেলা → উপজেলা → ইউনিয়ন), ছবি আপলোড + প্রিভিউ, ডুপ্লিকেট সতর্কতা, Unique ID `AM-000001`, তাৎক্ষণিক প্রিভিউ কার্ড, Status Pending — অনুমোদন ছাড়া পাবলিকে দেখায় না
- Mosque Profile (`#/mosque/<slug>-<id>`): কভার, গ্যালারি, ইমাম কার্ড, সম্পূর্ণ ঠিকানা, ইতিহাস, Google Maps, Share (Facebook/WhatsApp/Messenger/কপি), ভুল তথ্য রিপোর্ট
- Admin (`#/admin`): পরিসংখ্যান, ১৪টি মেনু, Approve/Reject/Edit/ইমাম আপডেট/ঠিকানা আপডেট/Verify/Feature/Archive, সংশোধন আবেদন, অ্যাক্টিভিটি লগ
- ডেটা: ৮ বিভাগ, ৬৪ জেলা, ৫১৬ উপজেলা; ৬টি সিড মসজিদ (বায়তুল মুকাররম, ষাট গম্বুজ, তারা মসজিদ, ছোট সোনা, কুসুম্বা + নমুনা মসজিদ) — **কোনো ইমামের নাম, সাল, ঠিকানা বা ফোন উদ্ভাবন করা হয়নি**
- **এই রাউন্ডে ঠিক করা:** `slugify()` বাংলা যুক্তাক্ষর ভাঙত — এখন ঠিক আছে; `src/lib/api.ts` নতুন Apps Script ক্লায়েন্ট (১৭টি অ্যাকশন) + `VITE_API_URL` থাকলে নিবন্ধন Google Sheets-এ পাঠায় ও অনুমোদিত মসজিদ রিফ্রেশ করে; না থাকলে localStorage মোডে চলে; `vite.config.ts`-এর ভুল কমেন্ট ঠিক করা হয়েছে

### পরীক্ষা (এই রাউন্ডে)
- `npm run build` ✅ (tsc + vite, কোনো error নেই)
- লজিক টেস্ট ✅ ১৬/১৬ পাস: বাংলা/ইংরেজি নাম সার্চ, ইমাম সার্চ, বিভাগ/জেলা ফিল্টার, একাধিক ফিল্টার, লাইভ সাজেশন, জেলা পরিসংখ্যান, ডুপ্লিকেট শনাক্তকরণ, backend mapper
- `vite preview` smoke test ✅: home HTTP 200, সঠিক বাংলা title, JS asset 200, `#/mosques` রুট 200
- মোবাইল রেসপন্সিভনেস আসল ব্রাউজারে যাচাই **বাকি** — লাইভ সাইটে করতে হবে

### Google Backend — সরাসরি তৈরি করা হয়েছে
| Resource | মালিক | ID / লিংক |
|---|---|---|
| Drive ফোল্ডার `AMAR_MASJID_DATABASE` | reduancomputer1@gmail.com | https://drive.google.com/drive/folders/1UYiiCDDLLxnkqTd-vG7x0gfFuMS3J7tk |
| `MOSQUE_PHOTOS` | — | `18_hSl9gvm5cKZn2Td4AY5DTHy-gGTEzL` |
| `MOSQUE_GALLERIES` | — | `1REqcieB1yfvo8mOmenJddrcIIQoH36OY` |
| `DATABASE_BACKUPS` | — | `1ITimWfD4dZQGA4COsQpeUY8SXGvvnnCQ` |
| স্প্রেডশিট `AMAR_MASJID_MASTER_DATABASE` | reduan.digital@gmail.com | https://docs.google.com/spreadsheets/d/1vEv4XcHVk6ARSEejHpIyhwrjgG0pOmm5c_3JOGGze6E/edit |

- ৭টি শিট (Mosques, Submissions, Locations, AdminUsers, ActivityLogs, Settings, CorrectionRequests) — হেডার, bold + frozen প্রথম সারি, Settings-এ ৫টি আইডি — readback দিয়ে যাচাই করা
- Drive ফোল্ডার reduan.digital@gmail.com-কে **writer** শেয়ার করা হয়েছে (Apps Script ছবি আপলোড করতে পারবে)
- `backend/Code.gs`-এর `CONFIG`-এ সব আইডি বসানো হয়েছে
- Sheets/Drive **কখনো Public করা হয়নি**; কোনো পাসওয়ার্ড/সিক্রেট কোডে নেই

### Git
- লোকাল git repo তৈরি, `main` ব্রাঞ্চে কমিট করা (clean tree) — `git log` দেখুন
- **কোনো remote নেই** — push বাকি (নিচে দেখুন)

## ❌ লাইভ নয় — যা বাকি (শুধু Reduan করতে পারবেন)

### ১. GitHub রিপো তৈরি (২ মিনিট) — লাইভ সাইটের একমাত্র বাধা
- https://github.com/new → **Public** রিপো, নাম **`amar-masjid`**, খালি (README নয়)
- তারপর https://github.com/apps/meta-muse-ai/installations/new → নতুন `amar-masjid` রিপো সিলেক্ট করে Muse GitHub App-কে অনুমতি দিন
- কারণ: Muse GitHub App রিপো তৈরি করতে পারে না (403) — শুধু অনুমতি দেওয়া রিপোতে push করতে পারে; `gh` CLI-তেও লগইন নেই
- রিপো তৈরি হলেই চালাতে হবে (লোকাল থেকে):
  ```
  cd ~/workspace/github-projects/amar-masjid
  git remote add origin https://github.com/reduanworksite/amar-masjid.git
  git push -u origin main
  ```
  তারপর GitHub Actions নিজে থেকে Pages-এ deploy করবে।
- লাইভ হবে: **https://reduanworksite.github.io/amar-masjid/**
  - Admin: `.../amar-masjid/#/admin`
  - Register: `.../amar-masjid/#/register`
  - All Mosques: `.../amar-masjid/#/mosques`
  - Search: `.../amar-masjid/#/search`
  - Sample profile: `.../amar-masjid/#/mosque/baitul-mukarram-national-mosque-am-000001`

### ২. Apps Script Deploy (Google Authorization — শুধু Reduan)
- কোনো Apps Script CLI/connector নেই — Deploy শুধু ব্রাউজারে script.google.com-এ করা যায়
- ধাপ (`backend/SETUP_GUIDE.md` ধাপ ৩–৬):
  1. স্প্রেডশিট খুলে Extensions → Apps Script → `backend/Code.gs` কপি-পেস্ট করুন (CONFIG-এ আইডি বসানো আছে)
  2. `AdminUsers` শিটে অ্যাডমিন অ্যাকাউন্ট তৈরি করুন — **পাসওয়ার্ড Reduan নিজে ঠিক করবেন** (গাইডের `makeAdminHash()` দিয়ে হ্যাশ বানান; পাসওয়ার্ড কোথাও লিখবেন না)
  3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → Google Authorization নিজে দিন
  4. পাওয়া Web App URL GitHub রিপোর Settings → Secrets and variables → Actions → Variables-এ `VITE_API_URL` নামে যোগ করুন, তারপর নতুন deploy
- এর আগে সাইট localStorage ডেমো মোডে চলবে (নিবন্ধন শুধু ওই ব্রাউজারে থাকবে)

### ৩. স্প্রেডশিট শেয়ার (ঐচ্ছিক, Drive UI থেকে)
- স্প্রেডশিটটি reduan.digital-এর Drive রুটে আছে — Drive ফোল্ডারের ভেতরে সরানো যায়নি (দুটি অ্যাকাউন্ট একে অপরের ফাইল দেখতে পায় না; জানা সীমাবদ্ধতা, অ্যাডমিশন প্রজেক্টের মতোই)
- Apps Script-এর কাজে এটি জরুরি নয়; চাইলে Reduan নিজে Drive UI-তে ফোল্ডারে টেনে নিতে পারেন
- নোট: Drive connector দিয়ে স্প্রেডশিট শেয়ার করার চেষ্টা করা হয়েছিল — cross-account বলে ব্যর্থ হয়েছে ("send source could not be resolved"); এটি কোনো ক্ষতি করেনি

## যা করা হয়নি (নির্দেশ অনুযায়ী)
- কোনো Facebook Page/Group তৈরি করা হয়নি
- কিছু কেনা হয়নি; কোনো পাসওয়ার্ড/OTP চাওয়া হয়নি; অ্যাডমিন পাসওয়ার্ড সেট করা হয়নি
- কোনো ফাইল মোছা হয়নি; Sheets/Drive Public করা হয়নি

## লোকাল প্রজেক্ট
`~/workspace/github-projects/amar-masjid/` — `npm install && npm run build && npm run preview`
