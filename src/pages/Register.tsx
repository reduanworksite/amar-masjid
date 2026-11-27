import { useMemo, useRef, useState } from 'react';
import { Upload, ImagePlus, CheckCircle2, AlertTriangle, Landmark, X } from 'lucide-react';
import type { Mosque } from '../lib/types';
import { profilePath, slugify } from '../lib/types';
import { findDuplicates, loadMosques, logActivity, nextMosqueId, saveMosques, syncSubmissionToApi } from '../lib/store';
import { districtsOf, DIVISIONS, upazilasOf, unionsOf } from '../data/locations';
import { MosqueCard, SectionHeading } from '../components/ui';

interface FormState {
  nameBn: string;
  nameEn: string;
  imamName: string;
  division: string;
  district: string;
  upazila: string;
  unionName: string;
  village: string;
  address: string;
  establishedYear: string;
  description: string;
  mapsUrl: string;
  committeeContact: string;
  submittedBy: string;
  submitterMobile: string;
  permission: boolean;
}

const EMPTY: FormState = {
  nameBn: '',
  nameEn: '',
  imamName: '',
  division: '',
  district: '',
  upazila: '',
  unionName: '',
  village: '',
  address: '',
  establishedYear: '',
  description: '',
  mapsUrl: '',
  committeeContact: '',
  submittedBy: '',
  submitterMobile: '',
  permission: false,
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const labelCls = 'mb-1.5 block text-sm font-bold text-emerald-950';
const inputCls =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-[15px] text-emerald-950 placeholder:text-stone-400';

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [mainImage, setMainImage] = useState<string>('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<Mosque[]>([]);
  const [submitted, setSubmitted] = useState<Mosque | null>(null);
  const mainRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  const districts = form.division ? districtsOf(form.division) : [];
  const upazilas = form.division && form.district ? upazilasOf(form.division, form.district) : [];
  const unions = form.upazila ? unionsOf(form.upazila) : [];
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const all = useMemo(() => loadMosques(), []);

  const checkDuplicates = () => {
    if (!form.nameBn || !form.district || !form.upazila) return;
    setDuplicates(
      findDuplicates(
        { nameBn: form.nameBn, district: form.district, upazila: form.upazila, address: form.address, village: form.village },
        all,
      ),
    );
  };

  const onMainImage = async (file: File | undefined) => {
    if (!file) return;
    setMainImage(await fileToDataUrl(file));
  };

  const onGallery = async (files: FileList | null) => {
    if (!files) return;
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 5)) urls.push(await fileToDataUrl(f));
    setGallery((g) => [...g, ...urls].slice(0, 6));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.nameBn.trim()) return setError('মসজিদের বাংলা নাম অবশ্যই দিতে হবে।');
    if (!form.imamName.trim()) return setError('বর্তমান ইমামের নাম অবশ্যই দিতে হবে।');
    if (!form.division || !form.district || !form.upazila)
      return setError('বিভাগ, জেলা ও উপজেলা নির্বাচন করুন।');
    if (!form.village.trim()) return setError('গ্রাম / মহল্লার নাম দিন।');
    if (!form.address.trim()) return setError('সম্পূর্ণ ঠিকানা দিন।');
    if (!form.submittedBy.trim()) return setError('আপনার নাম দিন (জমাদানকারী)।');
    if (!form.submitterMobile.trim()) return setError('আপনার মোবাইল নম্বর দিন।');
    if (!mainImage) return setError('মসজিদের মূল ছবি আপলোড করুন।');
    if (!form.permission) return setError('মসজিদের তথ্য ও ছবি প্রকাশের অনুমতি দিন।');

    const id = nextMosqueId(all);
    const mosque: Mosque = {
      id,
      slug: slugify(form.nameBn) || `mosque-${id.toLowerCase()}`,
      nameBn: form.nameBn.trim(),
      nameEn: form.nameEn.trim() || undefined,
      imamName: form.imamName.trim(),
      imamVerified: false,
      division: form.division,
      district: form.district,
      upazila: form.upazila,
      unionName: form.unionName.trim(),
      village: form.village.trim(),
      address: form.address.trim(),
      establishedYear: form.establishedYear.trim() || undefined,
      description: form.description.trim(),
      mapsUrl: form.mapsUrl.trim() || undefined,
      committeeContact: form.committeeContact.trim() || undefined,
      submittedBy: form.submittedBy.trim(),
      submitterMobile: form.submitterMobile.trim(),
      images: [mainImage, ...gallery],
      representativePhoto: false,
      verified: false,
      featured: false,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
      views: 0,
    };
    const updated = [...all, mosque];
    saveMosques(updated);
    logActivity('জমাদানকারী', 'নতুন নিবন্ধন', mosque.nameBn, `সাবমিশন ${id} — অপেক্ষমাণ (Pending)`);
    void syncSubmissionToApi(mosque);
    setSubmitted(mosque);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-sm sm:p-10">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-600" />
          <h1 className="text-2xl font-bold text-emerald-950">আপনার নিবন্ধন জমা হয়েছে!</h1>
          <p className="mx-auto mt-2 max-w-md text-stone-600">
            আপনার মসজিদের তথ্য অ্যাডমিনের কাছে পৌঁছেছে। যাচাই ও অনুমোদনের পর এটি হোমপেজ ও
            ডিরেক্টরিতে দেখা যাবে।
          </p>
          <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm text-stone-500">আপনার মসজিদ সাবমিশন আইডি</p>
            <p className="text-2xl font-bold tracking-wider text-emerald-800">{submitted.id}</p>
            <p className="mt-1 text-sm font-semibold text-amber-700">অবস্থা: অপেক্ষমাণ (Pending)</p>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            এই আইডিটি সংরক্ষণ করুন — এটি দিয়ে আপনি আপনার নিবন্ধনের অবস্থা জানতে পারবেন।
          </p>
        </div>
        <h2 className="mb-4 mt-8 text-center text-lg font-bold text-emerald-950">
          আপনার জমার প্রিভিউ কার্ড
        </h2>
        <div className="mx-auto max-w-md">
          <MosqueCard mosque={submitted} />
        </div>
        <p className="mt-4 text-center text-sm text-stone-500">
          অনুমোদন না হওয়া পর্যন্ত এই মসজিদটি পাবলিক ডিরেক্টরিতে দেখা যাবে না।
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="#/mosques" className="rounded-full bg-emerald-700 px-6 py-3 font-bold text-white">
            সকল মসজিদ দেখুন
          </a>
          <button
            onClick={() => {
              setSubmitted(null);
              setForm(EMPTY);
              setMainImage('');
              setGallery([]);
            }}
            className="rounded-full border-2 border-emerald-700 px-6 py-3 font-bold text-emerald-800"
          >
            আরেকটি মসজিদ নিবন্ধন করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <SectionHeading
        eyebrow="নিবন্ধন"
        title="আপনার মসজিদ নিবন্ধন করুন"
        subtitle="মসজিদের নাম, বর্তমান ইমামের নাম, ছবি ও ঠিকানা দিন। অ্যাডমিন যাচাই করে অনুমোদন দিলে আপনার মসজিদ সবার জন্য প্রকাশিত হবে।"
      />

      {duplicates.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="h-5 w-5" /> সম্ভাব্য ডুপ্লিকেট মসজিদ পাওয়া গেছে
          </p>
          <p className="mt-1 text-sm text-amber-800/90">
            একই নাম, জেলা ও উপজেলায় ইতিমধ্যে নিবন্ধিত মসজিদ রয়েছে। অনুগ্রহ করে যাচাই করুন — এটি
            কি একই মসজিদ?
          </p>
          <div className="mt-3 space-y-2">
            {duplicates.map((d) => (
              <a key={d.id} href={profilePath(d)} className="block rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">
                {d.nameBn} — {d.village}, {d.upazila}, {d.district} ({d.id})
              </a>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-950">
          <Landmark className="h-5 w-5 text-emerald-700" /> মসজিদের তথ্য
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="nameBn">মসজিদের নাম (বাংলা) *</label>
            <input id="nameBn" className={inputCls} value={form.nameBn} onChange={(e) => setField('nameBn', e.target.value)} onBlur={checkDuplicates} placeholder="যেমন: বায়তুল আমান জামে মসজিদ" />
          </div>
          <div>
            <label className={labelCls} htmlFor="nameEn">মসজিদের নাম (ইংরেজি) — ঐচ্ছিক</label>
            <input id="nameEn" className={inputCls} value={form.nameEn} onChange={(e) => setField('nameEn', e.target.value)} placeholder="যেমন: Baitul Aman Jame Masjid" />
          </div>
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4 sm:col-span-2">
            <label className={labelCls} htmlFor="imamName">বর্তমান ইমামের নাম *</label>
            <input id="imamName" className={inputCls} value={form.imamName} onChange={(e) => setField('imamName', e.target.value)} placeholder="মসজিদের বর্তমান ইমাম সাহেবের নাম" />
            <p className="mt-1.5 text-xs text-stone-500">
              ইমামের নাম একটি গুরুত্বপূর্ণ তথ্য। ইমাম পরিবর্তন হলে অ্যাডমিন তথ্য আপডেট করতে পারবেন।
            </p>
          </div>
          <div>
            <label className={labelCls} htmlFor="establishedYear">প্রতিষ্ঠার সাল — ঐচ্ছিক</label>
            <input id="establishedYear" className={inputCls} inputMode="numeric" value={form.establishedYear} onChange={(e) => setField('establishedYear', e.target.value)} placeholder="যেমন: ১৯৮৫" />
          </div>
          <div>
            <label className={labelCls} htmlFor="mapsUrl">Google Maps লিংক — ঐচ্ছিক</label>
            <input id="mapsUrl" className={inputCls} value={form.mapsUrl} onChange={(e) => setField('mapsUrl', e.target.value)} placeholder="https://maps.google.com/…" />
          </div>
        </div>

        <div className="mt-4">
          <label className={labelCls} htmlFor="description">মসজিদের বিবরণ / ইতিহাস</label>
          <textarea id="description" rows={4} className={inputCls} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="মসজিদের ইতিহাস, বিশেষত্ব বা সংক্ষিপ্ত বিবরণ লিখুন…" />
        </div>

        <h2 className="mb-4 mt-8 text-lg font-bold text-emerald-950">মসজিদের ছবি</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={labelCls}>মূল ছবি *</p>
            <button type="button" onClick={() => mainRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-6 text-emerald-800 transition hover:bg-emerald-50">
              {mainImage ? (
                <img src={mainImage} alt="মূল ছবির প্রিভিউ" className="h-40 w-full rounded-xl object-cover" />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8" />
                  <span className="text-sm font-bold">মূল ছবি আপলোড করুন</span>
                  <span className="text-xs text-stone-500">JPG / PNG — ছবি স্বয়ংক্রিয়ভাবে ছোট করা হবে</span>
                </>
              )}
            </button>
            <input ref={mainRef} type="file" accept="image/*" className="hidden" onChange={(e) => onMainImage(e.target.files?.[0])} />
            {mainImage && (
              <button type="button" onClick={() => setMainImage('')} className="mt-2 text-sm font-bold text-red-600 hover:underline">
                ছবি সরান
              </button>
            )}
          </div>
          <div>
            <p className={labelCls}>অতিরিক্ত ছবি (সর্বোচ্চ ৬টি)</p>
            <button type="button" onClick={() => galRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 font-bold text-stone-600 transition hover:bg-stone-100">
              <Upload className="h-5 w-5" /> অতিরিক্ত ছবি যোগ করুন
            </button>
            <input ref={galRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onGallery(e.target.files)} />
            {gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {gallery.map((g, i) => (
                  <div key={i} className="relative">
                    <img src={g} alt={`অতিরিক্ত ছবি ${i + 1}`} className="h-20 w-full rounded-lg object-cover" />
                    <button type="button" aria-label="ছবি সরান" onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <h2 className="mb-4 mt-8 text-lg font-bold text-emerald-950">অবস্থান</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="division">বিভাগ *</label>
            <select id="division" className={inputCls} value={form.division} onChange={(e) => set({ division: e.target.value, district: '', upazila: '', unionName: '' })}>
              <option value="">বিভাগ নির্বাচন করুন</option>
              {DIVISIONS.map((d) => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="district">জেলা *</label>
            <select id="district" className={inputCls} disabled={!form.division} value={form.district} onChange={(e) => set({ district: e.target.value, upazila: '', unionName: '' })}>
              <option value="">জেলা নির্বাচন করুন</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="upazila">উপজেলা / থানা *</label>
            <select id="upazila" className={inputCls} disabled={!form.district} value={form.upazila} onChange={(e) => set({ upazila: e.target.value, unionName: '' })}>
              <option value="">উপজেলা / থানা নির্বাচন করুন</option>
              {upazilas.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="unionName">ইউনিয়ন</label>
            {unions.length > 0 ? (
              <select id="unionName" className={inputCls} value={form.unionName} onChange={(e) => set({ unionName: e.target.value })}>
                <option value="">ইউনিয়ন নির্বাচন করুন</option>
                {unions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
                <option value="__other">অন্যান্য (নিচে লিখুন)</option>
              </select>
            ) : (
              <input id="unionName" className={inputCls} value={form.unionName === '__other' ? '' : form.unionName} onChange={(e) => set({ unionName: e.target.value })} placeholder="ইউনিয়নের নাম লিখুন" />
            )}
            {form.unionName === '__other' && (
              <input className={`${inputCls} mt-2`} placeholder="ইউনিয়নের নাম লিখুন" onChange={(e) => set({ unionName: e.target.value })} />
            )}
          </div>
          <div>
            <label className={labelCls} htmlFor="village">গ্রাম / মহল্লা *</label>
            <input id="village" className={inputCls} value={form.village} onChange={(e) => set({ village: e.target.value })} onBlur={checkDuplicates} placeholder="গ্রাম বা মহল্লার নাম" />
          </div>
          <div>
            <label className={labelCls} htmlFor="committeeContact">কমিটির যোগাযোগ নম্বর — ঐচ্ছিক</label>
            <input id="committeeContact" className={inputCls} inputMode="tel" value={form.committeeContact} onChange={(e) => set({ committeeContact: e.target.value })} placeholder="০১XXXXXXXXX" />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls} htmlFor="address">সম্পূর্ণ ঠিকানা *</label>
          <textarea id="address" rows={2} className={inputCls} value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="গ্রাম, ইউনিয়ন, উপজেলা, জেলা — সম্পূর্ণ ঠিকানা লিখুন" />
        </div>

        <h2 className="mb-4 mt-8 text-lg font-bold text-emerald-950">জমাদানকারীর তথ্য</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="submittedBy">জমাদানকারীর নাম *</label>
            <input id="submittedBy" className={inputCls} value={form.submittedBy} onChange={(e) => set({ submittedBy: e.target.value })} placeholder="আপনার নাম" />
          </div>
          <div>
            <label className={labelCls} htmlFor="submitterMobile">জমাদানকারীর মোবাইল নম্বর *</label>
            <input id="submitterMobile" className={inputCls} inputMode="tel" value={form.submitterMobile} onChange={(e) => set({ submitterMobile: e.target.value })} placeholder="০১XXXXXXXXX" />
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <input
            type="checkbox"
            checked={form.permission}
            onChange={(e) => set({ permission: e.target.checked })}
            className="mt-1 h-5 w-5 accent-emerald-700"
          />
          <span className="text-sm leading-relaxed text-emerald-950">
            আমি নিশ্চিত করছি যে উপরের তথ্য ও ছবি সঠিক এবং আমার মসজিদের তথ্য ও ছবি আমার মসজিদ
            ওয়েবসাইটে প্রকাশের অনুমতি দিচ্ছি। *
          </span>
        </label>

        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-emerald-700 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-800"
        >
          মসজিদ নিবন্ধন জমা দিন
        </button>
        <p className="mt-3 text-center text-xs text-stone-500">
          জমা দেওয়ার পর অ্যাডমিন যাচাই করবেন। অনুমোদন ছাড়া মসজিদ পাবলিক ডিরেক্টরিতে প্রকাশ করা
          হবে না।
        </p>
      </form>
    </div>
  );

  function setField(field: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }
}
