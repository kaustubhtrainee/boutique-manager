import React, { useMemo, useState } from 'react';
import {
  BarChart3, Wallet, Store, Shirt, Palette, PlusCircle, ListChecks, Users2, MessageSquareText, DatabaseBackup, ChevronRight,
  Plus, Trash2, ArrowUp, ArrowDown, MessageCircle, Download, Upload, Sparkles, RotateCcw, Scissors, Copy,
} from 'lucide-react';
import { useStore, migrate } from '../store';
import { useNav } from '../App';
import { Header, Page, Card, Btn, Field, Input, Textarea, Select, SectionTitle, Chip, Empty, Row, confirmBox, cx } from '../ui';
import {
  uid, todayISO, fmtDate, money, orderTotal, orderPaid, orderDue, isDelivered, dressName, fillTemplate, orderVars,
  defaultState, demoData, DEFAULT_TEMPLATES,
} from '../data';
import WaSheet from './WaSheet';

// ------------------------------------------------------------ menu
export function More() {
  const { s } = useStore();
  const nav = useNav();
  const groups = [
    ['Business', [
      ['Reports', 'Sales, collections, dress types, tailors', BarChart3, () => nav.go('reports')],
      ['Pending dues', 'Who owes how much', Wallet, () => nav.go('dues')],
    ]],
    ['Settings', [
      ['Shop profile', s.shop.name, Store, () => nav.go('settings', { section: 'shop' })],
      ['Dress types & measurements', `${s.dressTypes.length} dress types`, Shirt, () => nav.go('settings', { section: 'dress' })],
      ['Style options', 'Neck, sleeve, back…', Palette, () => nav.go('settings', { section: 'styles' })],
      ['Extras & add-on prices', `${s.addons.length} extras`, PlusCircle, () => nav.go('settings', { section: 'addons' })],
      ['Work stages', s.stages.join(' → '), ListChecks, () => nav.go('settings', { section: 'stages' })],
      ['Tailors / karigar', `${s.tailors.length} tailors`, Users2, () => nav.go('settings', { section: 'tailors' })],
      ['WhatsApp messages', 'Edit message templates', MessageSquareText, () => nav.go('settings', { section: 'templates' })],
      ['Backup & restore', 'Save all data to a file', DatabaseBackup, () => nav.go('settings', { section: 'backup' })],
    ]],
  ];
  return (
    <>
      <Header title="More" />
      <Page>
        {groups.map(([g, rows]) => (
          <div key={g}>
            <SectionTitle>{g}</SectionTitle>
            <Card className="divide-y divide-line overflow-hidden">
              {rows.map(([l, sub, Icon, fn]) => (
                <button key={l} onClick={fn} className="w-full flex items-center gap-3 p-3 text-left active:bg-plum-50">
                  <div className="w-9 h-9 rounded-xl bg-plum-50 text-plum-700 flex items-center justify-center"><Icon size={18} /></div>
                  <div className="flex-1 min-w-0"><div className="font-medium">{l}</div><div className="text-xs text-muted truncate">{sub}</div></div>
                  <ChevronRight size={18} className="text-muted" />
                </button>
              ))}
            </Card>
          </div>
        ))}
        <div className="text-center text-xs text-muted mt-8">Boutique Manager · v1.0 · data stays on this device</div>
      </Page>
    </>
  );
}

// ------------------------------------------------------------ reports
const Bar = ({ label, value, max, text }) => (
  <div className="py-1.5">
    <div className="flex justify-between text-sm"><span>{label}</span><span className="font-medium">{text}</span></div>
    <div className="h-2 bg-plum-50 rounded-full mt-1"><div className="h-2 bg-plum-600 rounded-full" style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%` }} /></div>
  </div>
);

export function Reports() {
  const { s } = useStore();
  const nav = useNav();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const r = useMemo(() => {
    const live = s.orders.filter((o) => o.status !== 'cancelled');
    const booked = live.filter((o) => o.createdAt.slice(0, 7) === month);
    const pays = live.flatMap((o) => (o.payments || []).map((p) => ({ ...p, o })) ).filter((p) => p.date.slice(0, 7) === month);
    const collected = pays.reduce((a, p) => a + Number(p.amount), 0);
    const billed = booked.reduce((a, o) => a + orderTotal(o, s), 0);
    const byType = {};
    booked.forEach((o) => o.items.forEach((i) => {
      const k = dressName(s, i.dressTypeId);
      byType[k] = byType[k] || { n: 0, v: 0 };
      byType[k].n += 1;
      byType[k].v += Number(i.price) || 0;
    }));
    const byMode = {};
    pays.forEach((p) => (byMode[p.mode] = (byMode[p.mode] || 0) + Number(p.amount)));
    const byCust = {};
    booked.forEach((o) => (byCust[o.customerId] = (byCust[o.customerId] || 0) + orderTotal(o, s)));
    const top = Object.entries(byCust).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, v]) => [s.customers.find((c) => c.id === id)?.name || '—', v]);
    const tailors = s.tailors.map((t) => {
      const items = live.flatMap((o) => o.items.map((i) => ({ i, o }))).filter(({ i }) => i.tailorId === t.id);
      const active = items.filter(({ i }) => i.stage !== 'Ready' && i.stage !== 'Delivered').length;
      const done = items.filter(({ i }) => (i.stageLog || []).some((l) => (l.stage === 'Ready') && l.at.slice(0, 7) === month)).length;
      return { name: t.name, active, done };
    });
    const newCust = s.customers.filter((c) => (c.createdAt || '').slice(0, 7) === month).length;
    const dues = live.reduce((a, o) => a + orderDue(o, s), 0);
    return { booked, collected, billed, byType, byMode, top, tailors, newCust, dues, pieces: booked.reduce((a, o) => a + o.items.length, 0) };
  }, [s, month]);
  const maxType = Math.max(0, ...Object.values(r.byType).map((x) => x.n));
  const maxMode = Math.max(0, ...Object.values(r.byMode));
  return (
    <>
      <Header title="Reports" onBack={nav.back} />
      <Page>
        <Field label="Month"><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[['Orders booked', r.booked.length], ['Pieces', r.pieces], ['Billed value', money(r.billed)], ['Collected', money(r.collected)], ['Avg. order', money(r.booked.length ? r.billed / r.booked.length : 0)], ['New customers', r.newCust]].map(([l, v]) => (
            <Card key={l} className="p-3"><div className="text-lg font-semibold">{v}</div><div className="text-xs text-muted">{l}</div></Card>
          ))}
        </div>
        <Card className="p-3 mt-3 flex justify-between items-center" onClick={() => nav.go('dues')}>
          <span className="text-sm">Total pending dues (all time)</span><b className="text-amber-700">{money(r.dues)}</b>
        </Card>
        <SectionTitle>By dress type</SectionTitle>
        <Card className="p-4">{Object.keys(r.byType).length ? Object.entries(r.byType).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => <Bar key={k} label={k} value={v.n} max={maxType} text={`${v.n} · ${money(v.v)}`} />) : <div className="text-sm text-muted">No orders this month.</div>}</Card>
        <SectionTitle>Collections by mode</SectionTitle>
        <Card className="p-4">{Object.keys(r.byMode).length ? Object.entries(r.byMode).map(([k, v]) => <Bar key={k} label={k} value={v} max={maxMode} text={money(v)} />) : <div className="text-sm text-muted">No payments this month.</div>}</Card>
        <SectionTitle>Top customers</SectionTitle>
        <Card className="p-4">{r.top.length ? r.top.map(([n, v], i) => <Row key={i} label={`${i + 1}. ${n}`} value={money(v)} />) : <div className="text-sm text-muted">—</div>}</Card>
        {r.tailors.length > 0 && (
          <>
            <SectionTitle>Tailors</SectionTitle>
            <Card className="p-4">{r.tailors.map((t) => <Row key={t.name} label={t.name} value={`${t.active} in hand · ${t.done} finished this month`} />)}</Card>
          </>
        )}
      </Page>
    </>
  );
}

// ------------------------------------------------------------ dues
export function Dues() {
  const { s } = useStore();
  const nav = useNav();
  const [wa, setWa] = useState(null);
  const list = s.orders.filter((o) => o.status !== 'cancelled' && orderDue(o, s) > 0).sort((a, b) => orderDue(b, s) - orderDue(a, s));
  const total = list.reduce((a, o) => a + orderDue(o, s), 0);
  return (
    <>
      <Header title="Pending dues" sub={`${list.length} orders · ${money(total)}`} onBack={nav.back} />
      <Page>
        {list.length === 0 ? <Empty icon={Wallet} title="No pending dues" text="Every order is fully paid." /> : (
          <div className="space-y-2">
            {list.map((o) => {
              const c = s.customers.find((x) => x.id === o.customerId) || {};
              return (
                <Card key={o.id} className="p-3 flex items-center gap-3" onClick={() => nav.go('order', { id: o.id })}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted">#{o.no} · total {money(orderTotal(o, s))} · paid {money(orderPaid(o))}{isDelivered(o) ? ' · delivered' : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-amber-700">{money(orderDue(o, s))}</div>
                    <button className="text-xs text-[#1f9d55] inline-flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setWa({ phone: c.phone, title: 'Payment reminder', text: fillTemplate(s.templates.dues, orderVars(s, o)) }); }}><MessageCircle size={13} /> Remind</button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Page>
      <WaSheet open={!!wa} onClose={() => setWa(null)} {...(wa || {})} />
    </>
  );
}

// ------------------------------------------------------------ settings
const TITLES = { shop: 'Shop profile', dress: 'Dress types & measurements', styles: 'Style options', addons: 'Extras & prices', stages: 'Work stages', tailors: 'Tailors / karigar', templates: 'WhatsApp messages', backup: 'Backup & restore' };

export function Settings({ section }) {
  const nav = useNav();
  const C = { shop: ShopSettings, dress: DressSettings, styles: StyleSettings, addons: AddonSettings, stages: StageSettings, tailors: TailorSettings, templates: TemplateSettings, backup: BackupSettings }[section];
  return (
    <>
      <Header title={TITLES[section]} onBack={nav.back} />
      <Page>{C && <C />}</Page>
    </>
  );
}

function ShopSettings() {
  const { s, update, notify } = useStore();
  const [f, setF] = useState(s.shop);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="space-y-3">
      <Field label="Shop / boutique name"><Input value={f.name} onChange={set('name')} /></Field>
      <Field label="Owner name"><Input value={f.owner} onChange={set('owner')} /></Field>
      <Field label="Shop phone"><Input inputMode="tel" value={f.phone} onChange={set('phone')} /></Field>
      <Field label="Address"><Textarea rows={2} value={f.address} onChange={set('address')} /></Field>
      <Field label="UPI ID (shown on bills & reminders)"><Input value={f.upi} onChange={set('upi')} placeholder="name@upi" /></Field>
      <Field label="GSTIN (optional)"><Input value={f.gst} onChange={set('gst')} /></Field>
      <Field label="Google review link (optional)"><Input value={f.review} onChange={set('review')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Measurement unit"><Select value={f.unit} onChange={set('unit')}><option value="in">Inches</option><option value="cm">Centimetres</option></Select></Field>
        <Field label="Country code"><Input value={f.countryCode} onChange={set('countryCode')} /></Field>
      </div>
      <Btn size="lg" className="w-full" onClick={() => { update((st) => ({ ...st, shop: f })); notify('Saved'); }}>Save</Btn>
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }) {
  const [v, setV] = useState('');
  const move = (i, d) => { const a = [...items]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div>
      <div className="space-y-1">
        {items.map((x, i) => (
          <div key={x + i} className="flex items-center gap-1 bg-white border border-line rounded-xl pl-3 pr-1 h-11">
            <input className="flex-1 min-w-0 bg-transparent outline-none text-[15px]" value={x} onChange={(e) => onChange(items.map((y, j) => (j === i ? e.target.value : y)))} />
            <button aria-label="Up" className="p-2 text-muted" onClick={() => move(i, -1)}><ArrowUp size={15} /></button>
            <button aria-label="Down" className="p-2 text-muted" onClick={() => move(i, 1)}><ArrowDown size={15} /></button>
            <button aria-label="Delete" className="p-2 text-red-600" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <Input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter' && v.trim()) { onChange([...items, v.trim()]); setV(''); } }} />
        <Btn variant="soft" onClick={() => { if (v.trim()) { onChange([...items, v.trim()]); setV(''); } }}><Plus size={18} /></Btn>
      </div>
    </div>
  );
}

function DressSettings() {
  const { s, update, notify } = useStore();
  const [open, setOpen] = useState(null);
  const setDT = (id, patch) => update((st) => ({ ...st, dressTypes: st.dressTypes.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  const add = () => { const id = uid(); update((st) => ({ ...st, dressTypes: [...st.dressTypes, { id, name: 'New dress type', fields: [], styles: [], days: 7, price: 500 }] })); setOpen(id); };
  const del = (d) => {
    if (s.orders.some((o) => o.items.some((i) => i.dressTypeId === d.id))) return notify('Used in orders — rename it instead');
    confirmBox(`Delete ${d.name}?`, () => update((st) => ({ ...st, dressTypes: st.dressTypes.filter((x) => x.id !== d.id) })));
  };
  return (
    <>
      <div className="text-sm text-muted mb-3">Each dress type has its own measurement list, standard days and base price. Changes apply to new orders.</div>
      <div className="space-y-2">
        {s.dressTypes.map((d) => (
          <Card key={d.id} className="p-3">
            <button className="w-full flex items-center text-left" onClick={() => setOpen(open === d.id ? null : d.id)}>
              <div className="flex-1"><div className="font-medium">{d.name}</div><div className="text-xs text-muted">{d.fields.length} measurements · {d.days} days · {money(d.price)}</div></div>
              <ChevronRight size={18} className={cx('text-muted transition', open === d.id && 'rotate-90')} />
            </button>
            {open === d.id && (
              <div className="mt-3 space-y-3 border-t border-line pt-3">
                <Field label="Name"><Input value={d.name} onChange={(e) => setDT(d.id, { name: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Standard days"><Input inputMode="numeric" value={d.days} onChange={(e) => setDT(d.id, { days: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></Field>
                  <Field label="Base price (₹)"><Input inputMode="numeric" value={d.price} onChange={(e) => setDT(d.id, { price: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></Field>
                </div>
                <Field label="Style options shown">
                  <div className="flex flex-wrap gap-2">{Object.keys(s.styleGroups).map((g) => <Chip key={g} active={d.styles.includes(g)} onClick={() => setDT(d.id, { styles: d.styles.includes(g) ? d.styles.filter((x) => x !== g) : [...d.styles, g] })}>{g}</Chip>)}</div>
                </Field>
                <Field label="Measurement fields (in order)"><ListEditor items={d.fields} onChange={(fields) => setDT(d.id, { fields })} placeholder="Add a measurement, e.g. Hip" /></Field>
                <Btn variant="danger" size="sm" onClick={() => del(d)}><Trash2 size={14} /> Delete dress type</Btn>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Btn variant="outline" className="w-full mt-3" onClick={add}><Plus size={18} /> Add dress type</Btn>
    </>
  );
}

function StyleSettings() {
  const { s, update } = useStore();
  const [name, setName] = useState('');
  const setG = (g, list) => update((st) => ({ ...st, styleGroups: { ...st.styleGroups, [g]: list } }));
  return (
    <>
      {Object.entries(s.styleGroups).map(([g, list]) => (
        <div key={g} className="mb-5">
          <SectionTitle right={<button className="text-xs text-red-600" onClick={() => confirmBox(`Remove the ${g} group?`, () => update((st) => { const sg = { ...st.styleGroups }; delete sg[g]; return { ...st, styleGroups: sg, dressTypes: st.dressTypes.map((d) => ({ ...d, styles: d.styles.filter((x) => x !== g) })) }; }))}>Remove group</button>}>{g}</SectionTitle>
          <ListEditor items={list} onChange={(l) => setG(g, l)} placeholder={`Add ${g.toLowerCase()} option`} />
        </div>
      ))}
      <SectionTitle>New style group</SectionTitle>
      <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dupatta work" /><Btn variant="soft" onClick={() => { if (name.trim()) { setG(name.trim(), []); setName(''); } }}><Plus size={18} /></Btn></div>
    </>
  );
}

function AddonSettings() {
  const { s, update } = useStore();
  const set = (addons) => update((st) => ({ ...st, addons }));
  return (
    <>
      <div className="space-y-2">
        {s.addons.map((a) => (
          <div key={a.id} className="flex gap-2 items-center">
            <Input value={a.name} onChange={(e) => set(s.addons.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)))} />
            <Input className="w-28" inputMode="numeric" value={a.price} onChange={(e) => set(s.addons.map((x) => (x.id === a.id ? { ...x, price: Number(e.target.value.replace(/\D/g, '')) || 0 } : x)))} />
            <button aria-label="Delete" className="p-2 text-red-600" onClick={() => set(s.addons.filter((x) => x.id !== a.id))}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
      <Btn variant="outline" className="w-full mt-3" onClick={() => set([...s.addons, { id: uid(), name: 'New extra', price: 100 }])}><Plus size={18} /> Add extra</Btn>
    </>
  );
}

function StageSettings() {
  const { s, update, notify } = useStore();
  const middle = s.stages.filter((x) => x !== 'Order placed' && x !== 'Ready' && x !== 'Delivered');
  const save = (m) => {
    const inUse = s.stages.filter((x) => !m.includes(x) && !['Order placed', 'Ready', 'Delivered'].includes(x))
      .filter((x) => s.orders.some((o) => o.items.some((i) => i.stage === x)));
    if (inUse.length) return notify(`"${inUse[0]}" has dresses in it — move them first`);
    update((st) => ({ ...st, stages: ['Order placed', ...m, 'Ready', 'Delivered'] }));
  };
  return (
    <>
      <div className="text-sm text-muted mb-3">“Order placed” is always first and “Ready → Delivered” always last. Add, rename or reorder the stages in between, e.g. Embroidery, Dyeing, Ironing.</div>
      <ListEditor items={middle} onChange={save} placeholder="Add a stage, e.g. Embroidery" />
    </>
  );
}

function TailorSettings() {
  const { s, update } = useStore();
  const set = (tailors) => update((st) => ({ ...st, tailors }));
  return (
    <>
      {s.tailors.length === 0 && <div className="text-sm text-muted mb-3">Add your tailors to assign work and send them job cards on WhatsApp.</div>}
      <div className="space-y-2">
        {s.tailors.map((t) => (
          <Card key={t.id} className="p-3 space-y-2">
            <Input value={t.name} placeholder="Name" onChange={(e) => set(s.tailors.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))} />
            <div className="flex gap-2">
              <Input value={t.phone} placeholder="Mobile" inputMode="tel" onChange={(e) => set(s.tailors.map((x) => (x.id === t.id ? { ...x, phone: e.target.value } : x)))} />
              <button aria-label="Delete" className="p-2 text-red-600" onClick={() => confirmBox(`Remove ${t.name || 'this tailor'}?`, () => set(s.tailors.filter((x) => x.id !== t.id)))}><Trash2 size={16} /></button>
            </div>
          </Card>
        ))}
      </div>
      <Btn variant="outline" className="w-full mt-3" onClick={() => set([...s.tailors, { id: uid(), name: '', phone: '' }])}><Scissors size={18} /> Add tailor</Btn>
    </>
  );
}

const TPL_LABELS = { confirm: 'Order confirmation', stage: 'Progress update', trial: 'Trial reminder', ready: 'Dress ready', reminder: 'Pickup reminder', dues: 'Payment reminder', thanks: 'Thank you / delivered', greeting: 'Birthday wishes' };

function TemplateSettings() {
  const { s, update, notify } = useStore();
  const [f, setF] = useState(s.templates);
  return (
    <>
      <div className="text-sm text-muted mb-3">
        Words in curly brackets are filled automatically: {'{name} {shop} {orderNo} {items} {total} {paid} {due} {trialDate} {deliveryDate} {stage} {itemName} {upi} {phone} {address} {review}'}. Use *stars* for bold.
      </div>
      {Object.keys(TPL_LABELS).map((k) => (
        <Field key={k} label={TPL_LABELS[k]} className="mb-4">
          <Textarea rows={5} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          <button className="text-xs text-plum-700 mt-1" onClick={() => setF({ ...f, [k]: DEFAULT_TEMPLATES[k] })}>Reset to default</button>
        </Field>
      ))}
      <Btn size="lg" className="w-full" onClick={() => { update((st) => ({ ...st, templates: f })); notify('Messages saved'); }}>Save messages</Btn>
    </>
  );
}

function BackupSettings() {
  const { s, update, notify } = useStore();
  const exportData = async () => {
    const name = `boutique-backup-${todayISO()}.json`;
    const json = JSON.stringify(s);
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        const res = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
        await Share.share({ title: 'Boutique backup', files: [res.uri] });
        return;
      }
    } catch (e) { /* fall through */ }
    const file = new File([json], name, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Boutique backup' });
        return;
      }
    } catch (e) { /* fall through to download */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    notify('Backup downloaded');
  };
  const importData = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data.customers || !data.orders) throw new Error('bad');
        confirmBox(`Restore backup with ${data.customers.length} customers and ${data.orders.length} orders? Current data will be replaced.`, () => {
          update(migrate({ ...data, onboarded: true }));
          notify('Backup restored');
        });
      } catch (err) { notify('This is not a valid backup file'); }
    };
    r.readAsText(f);
  };
  return (
    <>
      <Card className="p-4 text-sm text-muted">
        All data is saved on this phone only. Take a backup every week and keep it on Google Drive or WhatsApp “Message yourself”, so nothing is lost if the phone is changed.
      </Card>
      <div className="mt-3"><Row label="Customers" value={s.customers.length} /><Row label="Orders" value={s.orders.length} /><Row label="Measurement records" value={s.measurements.length} /></div>
      <Btn size="lg" className="w-full mt-4" onClick={exportData}><Download size={18} /> Save backup file</Btn>
      <Btn variant="outline" size="lg" className="w-full mt-2" onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(s)); notify('Backup copied — paste it in WhatsApp “Message yourself”'); } catch (e) { notify('Could not copy'); } }}><Copy size={18} /> Copy backup as text</Btn>
      <label className="mt-2 flex items-center justify-center gap-2 h-12 rounded-xl border border-line bg-white font-medium cursor-pointer active:bg-plum-50">
        <Upload size={18} /> Restore from backup
        <input type="file" accept="application/json,.json" className="hidden" onChange={importData} />
      </label>
      <details className="mt-2">
        <summary className="text-sm text-plum-700 text-center py-2 cursor-pointer">Restore from copied text instead</summary>
        <PasteRestore />
      </details>
      <SectionTitle>Testing</SectionTitle>
      <Btn variant="soft" className="w-full" onClick={() => confirmBox('Replace current data with demo data?', () => { update((st) => demoData({ ...defaultState(), shop: st.shop })); notify('Demo data loaded'); })}><Sparkles size={18} /> Load demo data</Btn>
      <Btn variant="danger" className="w-full mt-2" onClick={() => confirmBox('Delete ALL customers, orders and settings? This cannot be undone.', () => update(defaultState()))}><RotateCcw size={18} /> Erase everything</Btn>
    </>
  );
}

function PasteRestore() {
  const { update, notify } = useStore();
  const [txt, setTxt] = useState('');
  const go = () => {
    try {
      const data = JSON.parse(txt);
      if (!data.customers || !data.orders) throw new Error('bad');
      confirmBox(`Restore backup with ${data.customers.length} customers and ${data.orders.length} orders? Current data will be replaced.`, () => {
        update(migrate({ ...data, onboarded: true }));
        notify('Backup restored');
        setTxt('');
      });
    } catch (e) { notify('This text is not a valid backup'); }
  };
  return (
    <div className="space-y-2">
      <Textarea rows={4} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Paste the backup text here" />
      <Btn variant="soft" className="w-full" onClick={go} disabled={!txt.trim()}>Restore</Btn>
    </div>
  );
}

// ------------------------------------------------------------ first launch
export function Onboarding() {
  const { update } = useStore();
  const [f, setF] = useState({ name: '', owner: '', phone: '' });
  const start = (demo) => {
    const base = defaultState();
    const shop = { ...base.shop, name: f.name.trim() || base.shop.name, owner: f.owner, phone: f.phone };
    update(demo ? (() => { const d = demoData(base); return { ...d, shop: { ...d.shop, ...(f.name.trim() ? { name: f.name.trim(), owner: f.owner, phone: f.phone } : {}) } }; })() : { ...base, shop, onboarded: true });
  };
  return (
    <div className="min-h-full bg-plum-800 text-white flex flex-col">
      <div className="max-w-md mx-auto w-full px-6 pt-16 pb-8 flex-1 flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center"><Scissors size={28} /></div>
        <h1 className="font-serif text-3xl mt-6 leading-tight">Your boutique,<br />without the register.</h1>
        <p className="text-plum-200 mt-3 text-[15px]">Customers, measurements, orders, payments and WhatsApp updates — all in one place.</p>
        <div className="bg-white text-ink rounded-3xl p-5 mt-8 space-y-3">
          <Field label="Boutique name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Shree Designer Studio" /></Field>
          <Field label="Your name"><Input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></Field>
          <Field label="Shop mobile"><Input inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Btn size="lg" className="w-full" onClick={() => start(false)}>Start fresh</Btn>
          <Btn size="lg" variant="soft" className="w-full" onClick={() => start(true)}><Sparkles size={18} /> Try with sample data</Btn>
        </div>
      </div>
    </div>
  );
}
