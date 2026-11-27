# আমার মসজিদ (Amar Masjid) — Bangladesh Digital Mosque Directory

> **আমাদের মসজিদ, আমাদের পরিচয়।**
> **বাংলাদেশের প্রতিটি মসজিদ, এক ঠিকানায়।**

**Live Website:** https://reduanworksite.github.io/amar-masjid/
**Admin Dashboard:** https://reduanworksite.github.io/amar-masjid/#/admin
**Register a Mosque:** https://reduanworksite.github.io/amar-masjid/#/register
**All Mosques:** https://reduanworksite.github.io/amar-masjid/#/mosques
**Search:** https://reduanworksite.github.io/amar-masjid/#/search

বাংলাদেশের সকল জেলা, উপজেলা, থানা, ইউনিয়ন, গ্রাম ও মহল্লার মসজিদ নিয়ে একটি
ডিজিটাল ডিরেক্টরি। যেকোনো মানুষ নিজের মসজিদের নাম, ছবি, বর্তমান ইমামের নাম,
অবস্থান ও অন্যান্য তথ্য দিয়ে নিবন্ধন করতে পারেন। অ্যাডমিন যাচাই করে অনুমোদন
দিলে মসজিদটি হোমপেজ ও ডিরেক্টরিতে দেখা যায় এবং প্রতিটি মসজিদের জন্য আলাদা
পাবলিক প্রোফাইল পাতা তৈরি হয়।

## Features

- **Homepage** — Hero, Smart Search, Recently Added, All Mosques, Explore by
  Division / District / Upazila, Featured Mosques, Gallery, Register CTA,
  How It Works, About, Footer
- **Smart Search** — মসজিদের নাম, ইমামের নাম, বিভাগ, জেলা, উপজেলা, ইউনিয়ন,
  গ্রাম/মহল্লা দিয়ে খোঁজা; লাইভ সাজেশন; একসঙ্গে একাধিক ফিল্টার; বাংলা ও
  ইংরেজি নামে খোঁজা
- **Registration** — ১৮টি ফিল্ডের ফরম, Dependent Dropdown (বিভাগ → জেলা →
  উপজেলা → ইউনিয়ন), ছবি আপলোড ও প্রিভিউ, ডুপ্লিকেট সতর্কতা, Unique ID
  (`AM-000001`), তাৎক্ষণিক প্রিভিউ কার্ড, Status: Pending
- **Mosque Profile** — `/mosque/<slug>-<id>`, কভার ছবি, গ্যালারি, বর্তমান
  ইমাম (প্রধান তথ্য), সম্পূর্ণ ঠিকানা, ইতিহাস, Google Maps লিংক, Facebook /
  WhatsApp / Messenger শেয়ার, ভুল তথ্য রিপোর্ট
- **Admin Dashboard** (`#/admin`) — পরিসংখ্যান, নতুন সাবমিশন, অনুমোদন /
  প্রত্যাখ্যান, ইমাম আপডেট, তথ্য সম্পাদনা, যাচাইকরণ, বিশেষ মসজিদ, আর্কাইভ,
  সংশোধন আবেদন, অ্যাক্টিভিটি লগ, সেটিংস
- **Unique Mosque ID** — `AM-000001` ফরম্যাট
- **Duplicate Detection** — একই নাম + জেলা + উপজেলা + গ্রাম মিললে সতর্কতা
- **District Statistics** — কোন জেলায় কতটি অনুমোদিত মসজিদ
- **Map Explorer** — Google Maps লিংক-আউট (কোনো API Key লাগে না)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS 4 |
| Backend | Google Apps Script (`backend/Code.gs`) |
| Database | Google Sheets |
| Image Storage | Google Drive (private folders) |
| Hosting | GitHub Pages |

## Seed Data — সতর্কতা

বিখ্যাত মসজিদগুলোর (বায়তুল মুকাররম, ষাট গম্বুজ, তারা মসজিদ, ছোট সোনা,
কুসুম্বা) ক্ষেত্রে শুধু সুপরিচিত সর্বজনীন তথ্য (অবস্থান, জেলা, ঐতিহাসিক
পরিচিতি) ব্যবহার করা হয়েছে। **কোনো ইমামের নাম, প্রতিষ্ঠার সাল, ঠিকানার
বিস্তারিত বা ফোন নম্বর উদ্ভাবন করা হয়নি** — যাচাই হয়নি এমন তথ্য "তথ্য যাচাই
চলছে" হিসেবে দেখানো হয়। ছবিগুলো Unsplash-এর প্রতিনিধিত্বমূলক ছবি, আসল
মসজিদের ছবি নয় — প্রোফাইলে "প্রতিনিধিত্বমূলক ছবি" লেবেল দেওয়া আছে। আসল
ছবি নিবন্ধনের মাধ্যমে যুক্ত হবে। একটি নমুনা মসজিদ ("নমুনা জামে মসজিদ")
স্পষ্টভাবে নমুনা হিসেবে চিহ্নিত আছে।

## Local Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
npm run preview    # preview the production build
```

## Backend Setup

`backend/SETUP_GUIDE.md` দেখুন — Drive ফোল্ডার `AMAR_MASJID_DATABASE`,
স্প্রেডশিট `AMAR_MASJID_MASTER_DATABASE`, অ্যাডমিন অ্যাকাউন্ট তৈরি, Web App
Deploy এবং Frontend-এর সঙ্গে যুক্ত করার ধাপগুলো বাংলায় লেখা আছে।

## Backend — Live Resources (তৈরি: 2026-11-27)

Drive ও Sheets ইতিমধ্যে তৈরি করা হয়েছে — `backend/Code.gs`-এর `CONFIG`-এ
আইডিগুলো বসানো আছে, আর কোডে কোনো পাসওয়ার্ড/সিক্রেট নেই।

| Resource | ID / Link |
|---|---|
| Drive ফোল্ডার `AMAR_MASJID_DATABASE` (মালিক: reduancomputer1@gmail.com) | https://drive.google.com/drive/folders/1UYiiCDDLLxnkqTd-vG7x0gfFuMS3J7tk |
| সাবফোল্ডার `MOSQUE_PHOTOS` | `18_hSl9gvm5cKZn2Td4AY5DTHy-gGTEzL` |
| সাবফোল্ডার `MOSQUE_GALLERIES` | `1REqcieB1yfvo8mOmenJddrcIIQoH36OY` |
| সাবফোল্ডার `DATABASE_BACKUPS` | `1ITimWfD4dZQGA4COsQpeUY8SXGvvnnCQ` |
| স্প্রেডশিট `AMAR_MASJID_MASTER_DATABASE` (মালিক: reduan.digital@gmail.com) | https://docs.google.com/spreadsheets/d/1vEv4XcHVk6ARSEejHpIyhwrjgG0pOmm5c_3JOGGze6E/edit |

শিট: Mosques, Submissions, Locations, AdminUsers, ActivityLogs, Settings,
CorrectionRequests — হেডার, ফ্রোজেন প্রথম সারি ও Settings-এ ফোল্ডার আইডি
বসানো হয়েছে। **বাকি:** Apps Script Web App Deploy — এটি শুধু Reduan
নিজে করতে পারবেন (Google Authorization লাগে); ধাপগুলো `backend/SETUP_GUIDE.md`-এর
ধাপ ৩–৬-এ আছে।

> **অ্যাকাউন্ট ভাগাভাগি (জানা সীমাবদ্ধতা):** Drive সংযোগ
> reduancomputer1@gmail.com আর Sheets সংযোগ reduan.digital@gmail.com —
> দুটি অ্যাকাউন্ট একে অপরের ফাইল দেখতে পায় না। তাই স্প্রেডশিটটি Drive
> ফোল্ডারের ভেতরে সরানো যায়নি; এটি reduan.digital-এর Drive রুটে আছে।
> Drive ফোল্ডারটি reduan.digital@gmail.com-কে writer হিসেবে শেয়ার করা
> হয়েছে, যাতে Apps Script (যা reduan.digital হিসেবে চলবে) ছবি আপলোড
> করতে পারে। Sheets ও Drive কখনো Public করা হয়নি।

> **Google Authorization শুধু Reduan নিজে করবেন।** কোনো পাসওয়ার্ড, সিক্রেট
> কী বা প্রাইভেট ক্রেডেনশিয়াল এই রিপোতে নেই। অ্যাডমিন পাসওয়ার্ড সেটআপের
> সময় Reduan নিজে তৈরি করবেন (ডেমো মোডে প্রথমবার `/admin`-এ গিয়ে)।

## Deployment

`main` ব্রাঞ্চে push করলেই GitHub Actions (`.github/workflows/deploy.yml`)
স্বয়ংক্রিয়ভাবে GitHub Pages-এ deploy করে:
https://reduanworksite.github.io/amar-masjid/

Backend সংযুক্ত করতে GitHub Variables-এ `VITE_API_URL` (Apps Script Web App
URL) যোগ করুন।

## Project Structure

```
amar-masjid/
├── src/
│   ├── components/      # Navbar, MosqueCard, SearchBox, Footer
│   ├── pages/           # Home, Directory, Search, Register, MosqueProfile, Admin
│   ├── data/            # locations.ts (8 বিভাগ, 64 জেলা, উপজেলা), seedMosques.ts
│   ├── lib/             # types, store (localStorage + API-ready), search
│   └── App.tsx          # hash router (#/, #/mosques, #/search, #/register, #/mosque/…, #/admin)
├── backend/
│   ├── Code.gs          # Google Apps Script — 17 API actions
│   └── SETUP_GUIDE.md   # Drive/Sheets/Admin সেটআপ (বাংলা)
└── .github/workflows/deploy.yml
```

## License

MIT — বাংলাদেশের মসজিদগুলোর ডিজিটাল পরিচিতি সংরক্ষণের জন্য।
