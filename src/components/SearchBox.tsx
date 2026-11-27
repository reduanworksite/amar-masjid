import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, User } from 'lucide-react';
import type { Mosque } from '../lib/types';
import { profilePath } from '../lib/types';
import { suggestions } from '../lib/search';

export function SearchBox({
  mosques,
  initial = '',
  large = false,
  autoFocus = false,
}: {
  mosques: Mosque[];
  initial?: string;
  large?: boolean;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const list = suggestions(mosques, q);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const goSearch = () => {
    setOpen(false);
    window.location.hash = `#/search?q=${encodeURIComponent(q.trim())}`;
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-full border border-emerald-200 bg-white shadow-lg ${
          large ? 'p-2 pl-5' : 'p-1.5 pl-4'
        }`}
      >
        <Search className="h-5 w-5 shrink-0 text-emerald-600" />
        <input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Enter' && goSearch()}
          placeholder="মসজিদের নাম, ইমামের নাম, জেলা, উপজেলা, গ্রাম…"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-emerald-950 placeholder:text-stone-400"
          style={{ boxShadow: 'none' }}
          aria-label="মসজিদ খুঁজুন"
        />
        <button
          onClick={goSearch}
          className="shrink-0 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
        >
          খুঁজুন
        </button>
      </div>
      {open && list.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl">
          {list.map((m) => (
            <a
              key={m.id}
              href={profilePath(m)}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-stone-100 px-4 py-3 text-left transition last:border-0 hover:bg-emerald-50"
            >
              <img src={m.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-emerald-950">{m.nameBn}</span>
                <span className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="flex items-center gap-0.5">
                    <User className="h-3 w-3" /> {m.imamName}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {m.upazila}, {m.district}
                  </span>
                </span>
              </span>
            </a>
          ))}
          <button
            onClick={goSearch}
            className="w-full bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
          >
            “{q.trim()}” এর সব ফলাফল দেখুন →
          </button>
        </div>
      )}
    </div>
  );
}
