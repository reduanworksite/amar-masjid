import { useMemo, useState } from 'react';
import {
  MapPin,
  User,
  ShieldCheck,
  Share2,
  Flag,
  Calendar,
  Landmark,
  Phone,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  Send,
} from 'lucide-react';
import type { Mosque } from '../lib/types';
import { IMAM_UNVERIFIED, profileUrl } from '../lib/types';
import { loadCorrections, loadMosques, logActivity, saveCorrections } from '../lib/store';
import type { CorrectionRequest } from '../lib/types';
import { EmptyState } from '../components/ui';

export default function MosqueProfilePage({ id }: { id: string }) {
  const mosque: Mosque | undefined = useMemo(
    () => loadMosques().find((m) => m.id.toLowerCase() === id.toLowerCase()),
    [id],
  );
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [report, setReport] = useState({
    field: 'ইমামের নাম',
    currentValue: '',
    correctedValue: '',
    reporterName: '',
    reporterMobile: '',
    note: '',
  });

  if (!mosque) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState title="মসজিদটি পাওয়া যায়নি" hint="লিংকটি সঠিক কি না যাচাই করুন অথবা ডিরেক্টরি থেকে খুঁজুন।" />
        <div className="mt-6 text-center">
          <a href="#/mosques" className="font-bold text-emerald-700 hover:underline">← সকল মসজিদ দেখুন</a>
        </div>
      </div>
    );
  }

  const url = profileUrl(mosque);
  const shareText = `${mosque.nameBn} — ${mosque.upazila}, ${mosque.district} | আমার মসজিদ`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!report.correctedValue.trim() || !report.reporterName.trim()) return;
    const req: CorrectionRequest = {
      id: `CR-${Date.now()}`,
      mosqueId: mosque.id,
      mosqueName: mosque.nameBn,
      field: report.field,
      currentValue: report.currentValue || '—',
      correctedValue: report.correctedValue.trim(),
      reporterName: report.reporterName.trim(),
      reporterMobile: report.reporterMobile.trim() || undefined,
      note: report.note.trim() || undefined,
      status: 'open',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    saveCorrections([...loadCorrections(), req]);
    logActivity('দর্শক', 'সংশোধনের আবেদন', mosque.nameBn, `${report.field}: ${req.correctedValue}`);
    setReportSent(true);
  };

  const details: [string, string][] = [
    ['বিভাগ', mosque.division],
    ['জেলা', mosque.district],
    ['উপজেলা / থানা', mosque.upazila],
    ['ইউনিয়ন', mosque.unionName || '—'],
    ['গ্রাম / মহল্লা', mosque.village],
    ['সম্পূর্ণ ঠিকানা', mosque.address],
    ['প্রতিষ্ঠার সাল', mosque.establishedYear || 'তথ্য যাচাই চলছে'],
    ['সাবমিশন আইডি', mosque.id],
  ];

  return (
    <div>
      <section className="relative">
        <img src={mosque.images[activeImage]} alt={mosque.nameBn} className="h-72 w-full object-cover sm:h-96" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">{mosque.id}</span>
            {mosque.verified && (
              <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> যাচাইকৃত মসজিদ
              </span>
            )}
            {mosque.representativePhoto && (
              <span className="rounded-full bg-black/55 px-3 py-1 text-xs text-white/90">প্রতিনিধিত্বমূলক ছবি</span>
            )}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{mosque.nameBn}</h1>
          {mosque.nameEn && <p className="mt-1 text-emerald-100/90">{mosque.nameEn}</p>}
          <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-100">
            <MapPin className="h-4 w-4" /> {mosque.village}
            {mosque.unionName ? `, ${mosque.unionName}` : ''} · {mosque.upazila} · {mosque.district} · {mosque.division}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
                <User className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">বর্তমান ইমাম</p>
                <p className={`text-xl font-bold text-emerald-950 ${mosque.imamName === IMAM_UNVERIFIED ? 'italic text-stone-500' : ''}`}>
                  {mosque.imamName}
                </p>
                {!mosque.imamVerified && (
                  <p className="text-xs text-stone-500">ইমামের তথ্য যাচাই চলছে — সঠিক নাম জানা থাকলে নিচে সংশোধনের আবেদন করুন।</p>
                )}
              </div>
            </div>

            <h2 className="mb-3 text-lg font-bold text-emerald-950">মসজিদের ছবি</h2>
            <div className="grid grid-cols-3 gap-3">
              {mosque.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`overflow-hidden rounded-xl border-2 transition ${i === activeImage ? 'border-emerald-600' : 'border-transparent'}`}
                >
                  <img src={src} alt={`${mosque.nameBn} — ছবি ${i + 1}`} className="h-24 w-full object-cover sm:h-32" />
                </button>
              ))}
            </div>

            <h2 className="mb-3 mt-8 text-lg font-bold text-emerald-950">মসজিদ সম্পর্কে</h2>
            <p className="leading-relaxed text-stone-700">{mosque.description}</p>
            {mosque.history && mosque.history !== mosque.description && (
              <>
                <h3 className="mb-2 mt-5 font-bold text-emerald-950">ইতিহাস</h3>
                <p className="leading-relaxed text-stone-700">{mosque.history}</p>
              </>
            )}
            {mosque.establishedYear && (
              <p className="mt-4 flex items-center gap-2 text-sm text-stone-600">
                <Calendar className="h-4 w-4 text-emerald-600" /> প্রতিষ্ঠিত: {mosque.establishedYear}
              </p>
            )}
            {mosque.committeeContact && (
              <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                <Phone className="h-4 w-4 text-emerald-600" /> কমিটি যোগাযোগ: {mosque.committeeContact}
              </p>
            )}

            {mosque.mapsUrl && (
              <div className="mt-8">
                <h2 className="mb-3 text-lg font-bold text-emerald-950">অবস্থান (মানচিত্র)</h2>
                <a
                  href={mosque.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-bold text-emerald-800 transition hover:bg-emerald-100"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Google Maps-এ মসজিদটি দেখুন
                  </span>
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-emerald-950">
                <Landmark className="h-5 w-5 text-emerald-700" /> মসজিদের তথ্য
              </h2>
              <dl className="space-y-2.5 text-sm">
                {details.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 border-b border-stone-100 pb-2 last:border-0">
                    <dt className="text-stone-500">{k}</dt>
                    <dd className="text-right font-semibold text-emerald-950">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 font-bold text-emerald-950">
                <Share2 className="h-5 w-5 text-emerald-700" /> এই মসজিদ শেয়ার করুন
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#1877f2] px-3 py-2.5 text-center text-sm font-bold text-white"
                >
                  Facebook
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#25d366] px-3 py-2.5 text-center text-sm font-bold text-white"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://www.messenger.com/share?link=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#0084ff] px-3 py-2.5 text-center text-sm font-bold text-white"
                >
                  <MessageCircle className="h-4 w-4" /> Messenger
                </a>
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-1 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'কপি হয়েছে!' : 'লিংক কপি'}
                </button>
              </div>
              <p className="mt-3 break-all rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600">{url}</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
              <h2 className="mb-2 flex items-center gap-2 font-bold text-emerald-950">
                <Flag className="h-5 w-5 text-amber-600" /> ভুল তথ্য রিপোর্ট করুন
              </h2>
              <p className="text-sm text-stone-600">
                ইমামের নাম, ঠিকানা বা অন্য কোনো তথ্য ভুল মনে হলে সংশোধনের আবেদন করুন। অ্যাডমিন
                যাচাই করে সংশোধন করবেন।
              </p>
              {!showReport ? (
                <button
                  onClick={() => setShowReport(true)}
                  className="mt-3 w-full rounded-full border-2 border-amber-500 py-2.5 font-bold text-amber-700 transition hover:bg-amber-100"
                >
                  সংশোধনের আবেদন করুন
                </button>
              ) : reportSent ? (
                <p className="mt-3 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-800">
                  ধন্যবাদ! আপনার আবেদনটি অ্যাডমিনের কাছে পৌঁছেছে।
                </p>
              ) : (
                <form onSubmit={submitReport} className="mt-3 space-y-2.5">
                  <select
                    value={report.field}
                    onChange={(e) => setReport({ ...report, field: e.target.value })}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
                    aria-label="কোন তথ্য ভুল"
                  >
                    {['ইমামের নাম', 'মসজিদের নাম', 'ঠিকানা', 'উপজেলা / জেলা', 'প্রতিষ্ঠার সাল', 'ছবি', 'অন্যান্য'].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                  <input
                    value={report.correctedValue}
                    onChange={(e) => setReport({ ...report, correctedValue: e.target.value })}
                    placeholder="সঠিক তথ্যটি লিখুন *"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
                  />
                  <input
                    value={report.reporterName}
                    onChange={(e) => setReport({ ...report, reporterName: e.target.value })}
                    placeholder="আপনার নাম *"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
                  />
                  <input
                    value={report.reporterMobile}
                    onChange={(e) => setReport({ ...report, reporterMobile: e.target.value })}
                    placeholder="মোবাইল নম্বর (ঐচ্ছিক)"
                    className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm"
                  />
                  <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-700 py-2.5 font-bold text-white">
                    <Send className="h-4 w-4" /> আবেদন পাঠান
                  </button>
                </form>
              )}
            </div>

            <a
              href="#/register"
              className="block rounded-2xl bg-emerald-700 px-5 py-4 text-center font-bold text-white transition hover:bg-emerald-800"
            >
              আপনার মসজিদও নিবন্ধন করুন →
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}
