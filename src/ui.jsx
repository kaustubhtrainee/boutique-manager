import React, { useEffect } from 'react';
import { ArrowLeft, X } from 'lucide-react';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Header({ title, sub, onBack, right }) {
  return (
    <div className="sticky top-0 z-30 bg-cream/95 backdrop-blur border-b border-line">
      <div className="flex items-center gap-2 px-4 h-14 max-w-3xl mx-auto">
        {onBack && (
          <button aria-label="Back" onClick={onBack} className="-ml-2 p-2 rounded-full active:bg-plum-50">
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[19px] leading-tight text-ink truncate">{title}</h1>
          {sub && <div className="text-xs text-muted truncate">{sub}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

export const Page = ({ children, className }) => (
  <div className={cx('max-w-3xl mx-auto px-4 pt-4 pb-28', className)}>{children}</div>
);

export const Card = ({ children, className, onClick }) => (
  <div
    onClick={onClick}
    className={cx(
      'bg-white rounded-2xl border border-line shadow-[0_1px_2px_rgba(60,20,40,.04)]',
      onClick && 'active:bg-plum-50 cursor-pointer',
      className
    )}
  >
    {children}
  </div>
);

export function Btn({ children, variant = 'primary', className, size = 'md', ...p }) {
  const v = {
    primary: 'bg-plum-700 text-white active:bg-plum-800',
    soft: 'bg-plum-50 text-plum-800 active:bg-plum-100',
    outline: 'border border-line bg-white text-ink active:bg-plum-50',
    wa: 'bg-[#1f9d55] text-white active:bg-[#178246]',
    danger: 'bg-red-50 text-red-700 active:bg-red-100',
    ghost: 'text-plum-700 active:bg-plum-50',
  }[variant];
  const sz = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-4 text-[15px]', lg: 'h-12 px-5 text-base' }[size];
  return (
    <button
      {...p}
      className={cx('inline-flex items-center justify-center gap-2 rounded-xl font-medium disabled:opacity-40', v, sz, className)}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <div className="text-[13px] font-medium text-muted mb-1">{label}</div>}
      {children}
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </label>
  );
}

export const inputCls =
  'w-full h-11 px-3 rounded-xl border border-line bg-white text-[15px] text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-plum-300';

export const Input = (p) => <input {...p} className={cx(inputCls, p.className)} />;
export const Textarea = (p) => <textarea rows={3} {...p} className={cx(inputCls, 'h-auto py-2', p.className)} />;
export const Select = ({ children, ...p }) => (
  <select {...p} className={cx(inputCls, 'appearance-none bg-white', p.className)}>
    {children}
  </select>
);

export function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'px-3 h-9 rounded-full text-sm border whitespace-nowrap',
        active ? 'bg-plum-700 text-white border-plum-700' : 'bg-white text-ink border-line active:bg-plum-50'
      )}
    >
      {children}
    </button>
  );
}

const BADGE = {
  'Order placed': 'bg-slate-100 text-slate-700',
  Cutting: 'bg-amber-50 text-amber-800',
  Stitching: 'bg-sky-50 text-sky-800',
  Trial: 'bg-violet-50 text-violet-800',
  Alteration: 'bg-orange-50 text-orange-800',
  Ready: 'bg-emerald-50 text-emerald-800',
  Delivered: 'bg-gray-100 text-gray-600',
  Cancelled: 'bg-red-50 text-red-700',
  Overdue: 'bg-red-50 text-red-700',
  Urgent: 'bg-red-600 text-white',
};
export const Badge = ({ children, tone }) => (
  <span className={cx('inline-flex items-center px-2 h-6 rounded-full text-xs font-medium whitespace-nowrap', BADGE[tone || children] || 'bg-plum-50 text-plum-800')}>
    {children}
  </span>
);

export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-cream w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl flex flex-col">
        <div className="flex items-center px-4 h-14 border-b border-line">
          <div className="flex-1 font-serif text-lg">{title}</div>
          <button aria-label="Close" onClick={onClose} className="p-2 -mr-2 rounded-full active:bg-plum-50">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 flex-1">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-line bg-white rounded-b-3xl">{footer}</div>}
      </div>
    </div>
  );
}

export const Empty = ({ icon: Icon, title, text, action }) => (
  <div className="text-center py-12 px-6">
    {Icon && (
      <div className="mx-auto w-14 h-14 rounded-2xl bg-plum-50 text-plum-700 flex items-center justify-center mb-3">
        <Icon size={26} />
      </div>
    )}
    <div className="font-serif text-lg text-ink">{title}</div>
    {text && <div className="text-sm text-muted mt-1">{text}</div>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const SectionTitle = ({ children, right }) => (
  <div className="flex items-center justify-between mt-6 mb-2">
    <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">{children}</h2>
    {right}
  </div>
);

export const Row = ({ label, value, strong }) => (
  <div className="flex justify-between py-1.5 text-[15px]">
    <span className="text-muted">{label}</span>
    <span className={strong ? 'font-semibold text-ink' : 'text-ink'}>{value}</span>
  </div>
);

export const Avatar = ({ name }) => {
  const initials = (name || '?')
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-10 h-10 shrink-0 rounded-full bg-rose-100 text-plum-800 flex items-center justify-center font-semibold text-sm">
      {initials}
    </div>
  );
};

// In-app confirm dialog (browser pop-ups are blocked in some viewers and look out of place in the app).
let showConfirm = null;
export const confirmBox = (msg, onYes) => {
  if (showConfirm) showConfirm({ msg, onYes });
  else if (window.confirm(msg)) onYes();
};
export function ConfirmHost() {
  const [c, setC] = React.useState(null);
  useEffect(() => { showConfirm = setC; return () => { showConfirm = null; }; }, []);
  if (!c) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={() => setC(null)} />
      <div role="dialog" className="relative bg-white rounded-3xl p-5 w-full max-w-sm shadow-xl">
        <div className="text-[16px] text-ink">{c.msg}</div>
        <div className="flex gap-2 mt-5">
          <Btn variant="outline" className="flex-1" onClick={() => setC(null)}>No</Btn>
          <Btn className="flex-1" onClick={() => { const f = c.onYes; setC(null); f(); }}>Yes</Btn>
        </div>
      </div>
    </div>
  );
}

export const openWhatsApp = (url) => {
  const w = window.open(url, '_blank');
  if (!w) window.location.href = url;
};

// Compress a photo to a small JPEG data URL so storage stays light.
export const compressImage = (file, max = 900, q = 0.72) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.onerror = reject;
      img.src = r.result;
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
