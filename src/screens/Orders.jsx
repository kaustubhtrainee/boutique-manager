import React, { useMemo, useState, useEffect } from 'react';
import {
  Search, Plus, ClipboardList, ChevronRight, ChevronLeft, Check, Camera, X, Trash2, MessageCircle, Phone, Receipt,
  Wallet, Pencil, UserPlus, Ruler, Printer, Zap, Ban, Copy, Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../store';
import { useNav } from '../App';
import {
  Header, Page, Card, Btn, Field, Input, Textarea, Select, SectionTitle, Badge, Avatar, Empty, Row, Chip, Sheet,
  confirmBox, compressImage, cx,
} from '../ui';
import {
  uid, todayISO, addDays, fmtDate, fmtShort, money, daysBetween, itemTotal, orderTotal, orderPaid, orderDue,
  isActive, isReady, isDelivered, orderStageLabel, dressName, latestMeasurement, fillTemplate, orderVars, measurementText,
} from '../data';
import WaSheet from './WaSheet';

const PAY_MODES = ['Cash', 'UPI', 'Card', 'Bank transfer'];

// ------------------------------------------------------------ list
export function OrderList({ filter: f0 }) {
  const { s } = useStore();
  const nav = useNav();
  const t = todayISO();
  const [filter, setFilter] = useState(f0 || 'active');
  const [q, setQ] = useState('');
  const cust = (id) => s.customers.find((c) => c.id === id) || {};

  const filters = {
    active: (o) => isActive(o) && !isReady(o),
    late: (o) => isActive(o) && !isReady(o) && o.deliveryDate < t,
    ready: (o) => isActive(o) && isReady(o),
    delivered: (o) => o.status !== 'cancelled' && isDelivered(o),
    all: () => true,
  };
  const counts = Object.fromEntries(Object.entries(filters).map(([k, fn]) => [k, s.orders.filter(fn).length]));
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return s.orders
      .filter(filters[filter])
      .filter((o) => {
        if (!qq) return true;
        const c = cust(o.customerId);
        return String(o.no).includes(qq) || (c.name || '').toLowerCase().includes(qq) || (c.phone || '').includes(qq);
      })
      .sort((a, b) => (filter === 'delivered' || filter === 'all' ? b.createdAt.localeCompare(a.createdAt) : a.deliveryDate.localeCompare(b.deliveryDate)));
  }, [s, filter, q]);

  return (
    <>
      <Header title="Orders" right={<Btn size="sm" onClick={() => nav.go('newOrder')}><Plus size={16} /> New</Btn>} />
      <Page>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-3 text-muted" />
          <Input placeholder="Search order no, name or mobile" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          {[['active', 'In progress'], ['late', 'Late'], ['ready', 'Ready'], ['delivered', 'Delivered'], ['all', 'All']].map(([k, l]) => (
            <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{l} ({counts[k]})</Chip>
          ))}
        </div>
        {list.length === 0 ? (
          <Empty icon={ClipboardList} title="No orders here" text="New orders you take will show up in this list."
            action={<Btn onClick={() => nav.go('newOrder')}><Plus size={18} /> New order</Btn>} />
        ) : (
          <div className="space-y-2 mt-2">
            {list.map((o) => {
              const c = cust(o.customerId);
              const late = isActive(o) && !isReady(o) && o.deliveryDate < t;
              const due = orderDue(o, s);
              return (
                <Card key={o.id} className="p-3" onClick={() => nav.go('order', { id: o.id })}>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{c.name}</span>
                        {o.urgent && <Badge tone="Urgent">Urgent</Badge>}
                      </div>
                      <div className="text-xs text-muted truncate">#{o.no} · {o.items.map((i) => dressName(s, i.dressTypeId)).join(', ')}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cx('text-xs font-medium', late ? 'text-red-700' : 'text-muted')}>
                        {late ? `${daysBetween(o.deliveryDate, t)}d late` : `Due ${fmtShort(o.deliveryDate)}`}
                      </div>
                      {due > 0 && <div className="text-xs text-amber-700">{money(due)} due</div>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-2">
                    {o.status === 'cancelled' ? <Badge>Cancelled</Badge> : o.items.map((i) => <Badge key={i.id} tone={i.stage}>{i.stage}</Badge>)}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Page>
    </>
  );
}

// ------------------------------------------------------------ item editor (used by new order + edit)
function ItemEditor({ open, onClose, onSave, initial, customerId }) {
  const { s, notify } = useStore();
  const firstType = s.dressTypes[0]?.id;
  const blank = () => ({
    id: uid(), dressTypeId: firstType, styles: {}, measurementValues: {}, fabric: 'Customer', fabricNote: '', photos: [],
    price: s.dressTypes[0]?.price || 0, addons: [], tailorId: '', notes: '',
  });
  const [it, setIt] = useState(blank());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) setIt({ ...initial });
    else {
      const b = blank();
      const m = latestMeasurement(s, customerId, b.dressTypeId);
      setIt({ ...b, measurementValues: m?.values || {}, prevMeasurementId: m?.id });
    }
  }, [open]);

  const dtype = s.dressTypes.find((d) => d.id === it.dressTypeId);
  const unit = s.shop.unit === 'cm' ? 'cm' : 'in';
  const prev = latestMeasurement(s, customerId, it.dressTypeId);

  const pickType = (id) => {
    const d = s.dressTypes.find((x) => x.id === id);
    const m = latestMeasurement(s, customerId, id);
    setIt({ ...it, dressTypeId: id, price: d?.price || 0, styles: {}, measurementValues: m?.values || {}, prevMeasurementId: m?.id });
  };
  const addPhotos = async (e) => {
    const files = [...(e.target.files || [])].slice(0, 4);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      const imgs = await Promise.all(files.map((f) => compressImage(f)));
      setIt((x) => ({ ...x, photos: [...x.photos, ...imgs].slice(0, 6) }));
    } catch (err) {
      notify('Could not read photo');
    }
    setBusy(false);
  };
  const toggleAddon = (id) => setIt({ ...it, addons: it.addons.includes(id) ? it.addons.filter((x) => x !== id) : [...it.addons, id] });

  return (
    <Sheet open={open} onClose={onClose} title={initial ? 'Edit dress' : 'Add dress'}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex-1"><div className="text-xs text-muted">Dress price</div><div className="font-semibold text-lg">{money(itemTotal(it, s))}</div></div>
          <Btn size="lg" onClick={() => onSave(it)}><Check size={18} /> Save dress</Btn>
        </div>
      }>
      <Field label="Dress type">
        <div className="flex flex-wrap gap-2">
          {s.dressTypes.map((d) => <Chip key={d.id} active={it.dressTypeId === d.id} onClick={() => pickType(d.id)}>{d.name}</Chip>)}
        </div>
      </Field>

      {(dtype?.styles || []).map((g) => (
        <Field key={g} label={g} className="mt-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(s.styleGroups[g] || []).map((o) => (
              <Chip key={o} active={it.styles[g] === o} onClick={() => setIt({ ...it, styles: { ...it.styles, [g]: it.styles[g] === o ? undefined : o } })}>{o}</Chip>
            ))}
          </div>
        </Field>
      ))}

      {dtype?.fields?.length > 0 && (
        <>
          <SectionTitle>
            <span className="inline-flex items-center gap-1"><Ruler size={14} /> Measurements ({unit})</span>
          </SectionTitle>
          <div className="text-xs text-muted -mt-1 mb-2">
            {prev ? `Filled from ${fmtDate(prev.date)}. Change any value and a new record is saved with the order.` : 'No saved measurements for this dress type — enter them now.'}
            {prev && daysBetween(prev.date, todayISO()) > 365 && <span className="text-red-700 font-medium"> Over a year old — re-measure.</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {dtype.fields.map((f) => (
              <Field key={f} label={<span className="text-[11px] leading-tight block truncate">{f}</span>}>
                <Input inputMode="decimal" className="h-10 px-2" value={it.measurementValues?.[f] ?? ''}
                  onChange={(e) => setIt({ ...it, measurementValues: { ...it.measurementValues, [f]: e.target.value } })} />
              </Field>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Fabric & design photos</SectionTitle>
      <div className="flex gap-2">
        {['Customer', 'Shop'].map((x) => <Chip key={x} active={it.fabric === x} onClick={() => setIt({ ...it, fabric: x })}>{x === 'Customer' ? "Customer's fabric" : 'Shop fabric'}</Chip>)}
      </div>
      <Input className="mt-2" placeholder="Fabric details, e.g. red silk 1.2 m" value={it.fabricNote} onChange={(e) => setIt({ ...it, fabricNote: e.target.value })} />
      <div className="flex gap-2 mt-3 flex-wrap">
        {it.photos.map((p, i) => (
          <div key={i} className="relative w-20 h-20">
            <img src={p} alt="" className="w-20 h-20 object-cover rounded-xl border border-line" />
            <button aria-label="Remove photo" className="absolute -top-2 -right-2 bg-white border border-line rounded-full p-1"
              onClick={() => setIt({ ...it, photos: it.photos.filter((_, j) => j !== i) })}><X size={12} /></button>
          </div>
        ))}
        {it.photos.length < 6 && (
          <label className="w-20 h-20 rounded-xl border-2 border-dashed border-plum-200 flex flex-col items-center justify-center text-plum-700 text-xs cursor-pointer">
            <Camera size={20} />{busy ? '…' : 'Add'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
          </label>
        )}
      </div>

      <SectionTitle>Price & extras</SectionTitle>
      <Field label="Stitching price (₹)">
        <Input inputMode="numeric" value={it.price} onChange={(e) => setIt({ ...it, price: e.target.value.replace(/[^\d.]/g, '') })} />
      </Field>
      <div className="flex flex-wrap gap-2 mt-3">
        {s.addons.map((a) => <Chip key={a.id} active={it.addons.includes(a.id)} onClick={() => toggleAddon(a.id)}>{a.name} +{money(a.price)}</Chip>)}
      </div>

      <div className="grid grid-cols-1 gap-3 mt-4">
        <Field label="Assign tailor">
          <Select value={it.tailorId} onChange={(e) => setIt({ ...it, tailorId: e.target.value })}>
            <option value="">Not assigned</option>
            {s.tailors.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Field label="Notes for tailor"><Textarea rows={2} value={it.notes} onChange={(e) => setIt({ ...it, notes: e.target.value })} placeholder="e.g. add latkan on back dori" /></Field>
      </div>
    </Sheet>
  );
}

const sameVals = (a = {}, b = {}) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if (String(a[k] ?? '').trim() !== String(b[k] ?? '').trim()) return false;
  return true;
};

// ------------------------------------------------------------ new order wizard
export function NewOrder({ customerId: cid0 }) {
  const { s, update, notify } = useStore();
  const nav = useNav();
  const t = todayISO();
  const [step, setStep] = useState(cid0 ? 2 : 1);
  const [customerId, setCustomerId] = useState(cid0 || '');
  const [q, setQ] = useState('');
  const [quick, setQuick] = useState(null);
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [o, setO] = useState({ trialDate: '', deliveryDate: '', urgent: false, discount: '', advance: '', mode: 'Cash', notes: '' });
  const c = s.customers.find((x) => x.id === customerId);

  const suggested = useMemo(() => {
    const days = Math.max(0, ...items.map((i) => s.dressTypes.find((d) => d.id === i.dressTypeId)?.days || 0));
    return addDays(t, o.urgent ? Math.max(1, Math.ceil(days / 2)) : days || 7);
  }, [items, o.urgent]);
  useEffect(() => { if (step === 3 && !o.deliveryDate) setO((x) => ({ ...x, deliveryDate: suggested })); }, [step]);

  const load = s.orders.filter((x) => isActive(x) && x.deliveryDate === (o.deliveryDate || suggested)).length;
  const draft = { items, discount: o.discount, payments: [] };
  const total = orderTotal(draft, s);

  const custList = s.customers
    .filter((x) => !q || x.name.toLowerCase().includes(q.toLowerCase()) || (x.phone || '').includes(q))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 30);

  const addQuick = () => {
    if (!quick.name.trim()) return notify('Enter name');
    const id = uid();
    update((st) => ({ ...st, customers: [...st.customers, { id, name: quick.name.trim(), phone: quick.phone, address: '', birthday: '', anniversary: '', notes: '', fitNotes: '', createdAt: t }] }));
    setCustomerId(id);
    setQuick(null);
    setStep(2);
  };

  const saveItem = (it) => {
    setItems((xs) => (xs.find((x) => x.id === it.id) ? xs.map((x) => (x.id === it.id ? it : x)) : [...xs, it]));
    setEditing(null);
  };

  const save = () => {
    const deliveryDate = o.deliveryDate || suggested;
    if (!deliveryDate) return notify('Choose a delivery date');
    const id = uid();
    const now = new Date();
    const stamp = t + 'T' + now.toTimeString().slice(0, 5);
    const newMeas = [];
    const finalItems = items.map((it) => {
      const vals = Object.fromEntries(Object.entries(it.measurementValues || {}).filter(([, v]) => String(v).trim() !== ''));
      let measurementId = '';
      const prev = latestMeasurement(s, customerId, it.dressTypeId);
      if (Object.keys(vals).length) {
        if (prev && sameVals(prev.values, vals)) measurementId = prev.id;
        else {
          const dup = newMeas.find((m) => m.dressTypeId === it.dressTypeId && sameVals(m.values, vals));
          if (dup) measurementId = dup.id;
          else {
            measurementId = uid();
            newMeas.push({ id: measurementId, customerId, dressTypeId: it.dressTypeId, values: vals, note: `Order #${s.nextOrderNo}`, date: t });
          }
        }
      }
      const { measurementValues, prevMeasurementId, ...rest } = it;
      return { ...rest, measurementId, stage: 'Order placed', stageLog: [{ stage: 'Order placed', at: stamp }] };
    });
    const adv = Number(o.advance) || 0;
    const order = {
      id, no: s.nextOrderNo, customerId, createdAt: stamp, trialDate: o.trialDate, deliveryDate, urgent: o.urgent,
      discount: Number(o.discount) || 0, status: 'active', notes: o.notes, items: finalItems,
      payments: adv > 0 ? [{ id: uid(), amount: adv, mode: o.mode, date: t, note: 'Advance' }] : [],
    };
    update((st) => ({ ...st, orders: [...st.orders, order], measurements: [...st.measurements, ...newMeas], nextOrderNo: st.nextOrderNo + 1 }));
    notify(`Order #${order.no} saved`);
    nav.replace('order', { id, justCreated: true });
  };

  const steps = ['Customer', 'Dresses', 'Dates & payment'];

  return (
    <>
      <Header title="New order" sub={c ? c.name : 'Step ' + step + ' of 3'} onBack={() => (step > 1 && !(cid0 && step === 2) ? setStep(step - 1) : nav.back())} />
      <div className="max-w-3xl mx-auto px-4 pt-3 flex gap-2">
        {steps.map((l, i) => (
          <div key={l} className="flex-1">
            <div className={cx('h-1.5 rounded-full', step > i ? 'bg-plum-700' : 'bg-plum-100')} />
            <div className={cx('text-[11px] mt-1', step === i + 1 ? 'text-plum-800 font-semibold' : 'text-muted')}>{l}</div>
          </div>
        ))}
      </div>
      <Page>
        {step === 1 && (
          <>
            {quick ? (
              <Card className="p-4 space-y-3">
                <div className="font-serif text-lg">Quick add customer</div>
                <Field label="Name"><Input autoFocus value={quick.name} onChange={(e) => setQuick({ ...quick, name: e.target.value })} /></Field>
                <Field label="Mobile (WhatsApp)"><Input inputMode="tel" value={quick.phone} onChange={(e) => setQuick({ ...quick, phone: e.target.value })} /></Field>
                <div className="flex gap-2"><Btn variant="outline" onClick={() => setQuick(null)}>Cancel</Btn><Btn className="flex-1" onClick={addQuick}>Add & continue</Btn></div>
              </Card>
            ) : (
              <>
                <Btn variant="soft" className="w-full mb-3" onClick={() => setQuick({ name: q, phone: '' })}><UserPlus size={18} /> New customer</Btn>
                <div className="relative mb-3">
                  <Search size={18} className="absolute left-3 top-3 text-muted" />
                  <Input placeholder="Search existing customer" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
                </div>
                <div className="space-y-2">
                  {custList.map((x) => (
                    <Card key={x.id} className="p-3 flex items-center gap-3" onClick={() => { setCustomerId(x.id); setStep(2); }}>
                      <Avatar name={x.name} />
                      <div className="flex-1"><div className="font-medium">{x.name}</div><div className="text-xs text-muted">{x.phone}</div></div>
                      <ChevronRight size={18} className="text-muted" />
                    </Card>
                  ))}
                  {custList.length === 0 && <div className="text-sm text-muted text-center py-6">No customer found. Tap “New customer”.</div>}
                </div>
              </>
            )}
          </>
        )}

        {step === 2 && c && (
          <>
            {c.fitNotes && <div className="mb-3 text-sm bg-rose-50 rounded-xl p-3"><b>Fit notes:</b> {c.fitNotes}</div>}
            {items.length === 0 ? (
              <Empty icon={ClipboardList} title="Add the first dress" text="Pick dress type, style, measurements, photos and price." />
            ) : (
              <div className="space-y-2">
                {items.map((it, i) => (
                  <Card key={it.id} className="p-3">
                    <div className="flex items-start gap-3">
                      {it.photos[0] ? <img src={it.photos[0]} alt="" className="w-14 h-14 rounded-xl object-cover" /> :
                        <div className="w-14 h-14 rounded-xl bg-plum-50 flex items-center justify-center text-plum-700"><ImageIcon size={20} /></div>}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{i + 1}. {dressName(s, it.dressTypeId)}</div>
                        <div className="text-xs text-muted">{Object.values(it.styles).filter(Boolean).join(' · ') || 'No style options'}</div>
                        <div className="text-xs text-muted">{Object.values(it.measurementValues || {}).filter((v) => v !== '').length} measurements · {it.fabric} fabric</div>
                      </div>
                      <div className="font-semibold">{money(itemTotal(it, s))}</div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Btn size="sm" variant="soft" onClick={() => setEditing(it)}><Pencil size={14} /> Edit</Btn>
                      <Btn size="sm" variant="ghost" onClick={() => setItems(items.filter((x) => x.id !== it.id))}><Trash2 size={14} /> Remove</Btn>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <Btn variant="outline" className="w-full mt-3" onClick={() => setEditing('new')}><Plus size={18} /> Add {items.length ? 'another ' : ''}dress</Btn>
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-line p-3 z-30">
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <div className="flex-1"><div className="text-xs text-muted">{items.length} dress{items.length === 1 ? '' : 'es'}</div><div className="font-semibold text-lg">{money(total)}</div></div>
                <Btn size="lg" disabled={!items.length} onClick={() => setStep(3)}>Next <ChevronRight size={18} /></Btn>
              </div>
            </div>
            <ItemEditor open={!!editing} initial={editing && editing !== 'new' ? editing : null} customerId={customerId}
              onClose={() => setEditing(null)} onSave={saveItem} />
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium flex items-center gap-2"><Zap size={16} className="text-red-600" /> Urgent order</div>
                <div className="text-xs text-muted">Shows on top of the work board</div>
              </div>
              <Chip active={o.urgent} onClick={() => setO({ ...o, urgent: !o.urgent, deliveryDate: '' })}>{o.urgent ? 'Yes' : 'No'}</Chip>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Trial date (optional)"><Input type="date" value={o.trialDate} min={t} onChange={(e) => setO({ ...o, trialDate: e.target.value })} /></Field>
              <Field label="Delivery date"><Input type="date" value={o.deliveryDate || suggested} min={t} onChange={(e) => setO({ ...o, deliveryDate: e.target.value })} /></Field>
            </div>
            <div className={cx('text-xs rounded-xl px-3 py-2', load >= 5 ? 'bg-amber-50 text-amber-800' : 'bg-plum-50 text-plum-900')}>
              Suggested: {fmtDate(suggested)} · {load} other order{load === 1 ? '' : 's'} already due on {fmtShort(o.deliveryDate || suggested)}{load >= 5 ? ' — busy day!' : ''}
            </div>
            <Card className="p-4">
              <Row label="Dresses" value={money(orderTotal({ items, discount: 0 }, s))} />
              <Field label="Discount (₹)" className="mt-2"><Input inputMode="numeric" value={o.discount} onChange={(e) => setO({ ...o, discount: e.target.value.replace(/[^\d]/g, '') })} placeholder="0" /></Field>
              <div className="border-t border-line mt-3 pt-2"><Row label="Total" value={money(total)} strong /></div>
            </Card>
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Advance received (₹)"><Input inputMode="numeric" value={o.advance} onChange={(e) => setO({ ...o, advance: e.target.value.replace(/[^\d]/g, '') })} placeholder="0" /></Field>
                <Field label="Mode"><Select value={o.mode} onChange={(e) => setO({ ...o, mode: e.target.value })}>{PAY_MODES.map((m) => <option key={m}>{m}</option>)}</Select></Field>
              </div>
              <div className="mt-2"><Row label="Balance" value={money(Math.max(0, total - (Number(o.advance) || 0)))} strong /></div>
            </Card>
            <Field label="Order notes"><Textarea rows={2} value={o.notes} onChange={(e) => setO({ ...o, notes: e.target.value })} /></Field>
            <Btn size="lg" className="w-full" onClick={save}><Check size={18} /> Save order</Btn>
          </div>
        )}
      </Page>
    </>
  );
}

// ------------------------------------------------------------ order detail
const confirmShown = new Set();
export function OrderDetail({ id, justCreated }) {
  const { s, update, notify } = useStore();
  const nav = useNav();
  const t = todayISO();
  const o = s.orders.find((x) => x.id === id);
  const c = s.customers.find((x) => x.id === o?.customerId) || {};
  const [wa, setWa] = useState(null);
  const [pay, setPay] = useState(null);
  const [edit, setEdit] = useState(null);
  const [itemEdit, setItemEdit] = useState(null);
  const [msgMenu, setMsgMenu] = useState(false);
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    if (justCreated && o && !confirmShown.has(id)) confirmShown.add(id), setWa({ phone: c.phone, text: fillTemplate(s.templates.confirm, orderVars(s, o)), title: 'Send order confirmation' });
  }, []);

  if (!o) return <><Header title="Order" onBack={nav.back} /><Empty title="Order not found" /></>;

  const total = orderTotal(o, s), paid = orderPaid(o), due = orderDue(o, s);
  const setOrder = (fn) => update((st) => ({ ...st, orders: st.orders.map((x) => (x.id === id ? fn(x) : x)) }));

  const moveStage = (item, stage) => {
    const now = new Date();
    const stamp = t + 'T' + now.toTimeString().slice(0, 5);
    const next = { ...o, items: o.items.map((i) => (i.id === item.id ? { ...i, stage, stageLog: [...(i.stageLog || []), { stage, at: stamp }] } : i)) };
    setOrder(() => next);
    const allReady = next.items.every((i) => i.stage === 'Ready' || i.stage === 'Delivered') && !next.items.every((i) => i.stage === 'Delivered');
    const allDelivered = next.items.every((i) => i.stage === 'Delivered');
    let tpl = s.templates.stage, title = 'Send progress update';
    if (stage === 'Ready' && allReady) { tpl = s.templates.ready; title = 'Tell customer it is ready'; }
    if (stage === 'Delivered' && allDelivered) { tpl = s.templates.thanks; title = 'Send thank-you & bill'; }
    if (stage === 'Trial') { tpl = s.templates.trial; title = 'Send trial reminder'; }
    setWa({ phone: c.phone, title, text: fillTemplate(tpl, orderVars(s, next, { stage, itemName: dressName(s, item.dressTypeId) })) });
  };

  const addPayment = () => {
    const amt = Number(pay.amount) || 0;
    if (amt <= 0) return notify('Enter amount');
    setOrder((x) => ({ ...x, payments: [...(x.payments || []), { id: uid(), amount: amt, mode: pay.mode, date: pay.date, note: pay.note }] }));
    setPay(null);
    notify('Payment recorded');
  };

  const messages = [
    ['Order confirmation', s.templates.confirm],
    ['Trial reminder', s.templates.trial],
    ['Dress is ready', s.templates.ready],
    ['Pickup reminder', s.templates.reminder],
    ['Payment reminder', s.templates.dues],
    ['Thank you + bill', s.templates.thanks],
  ];

  const late = isActive(o) && !isReady(o) && o.deliveryDate < t;

  return (
    <>
      <Header title={`Order #${o.no}`} sub={c.name} onBack={nav.back}
        right={<Btn size="sm" variant="ghost" onClick={() => nav.go('invoice', { id })}><Receipt size={16} /> Bill</Btn>} />
      <Page>
        <Card className="p-3 flex items-center gap-3" onClick={() => nav.go('customer', { id: c.id })}>
          <Avatar name={c.name} />
          <div className="flex-1 min-w-0"><div className="font-medium">{c.name}</div><div className="text-xs text-muted">{c.phone}</div></div>
          {c.phone && <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="p-2 rounded-full bg-plum-50 text-plum-700"><Phone size={18} /></a>}
          <button onClick={(e) => { e.stopPropagation(); setMsgMenu(true); }} className="p-2 rounded-full bg-[#e7f6ee] text-[#1f9d55]" aria-label="WhatsApp"><MessageCircle size={18} /></button>
        </Card>
        {c.fitNotes && <div className="mt-2 text-sm bg-rose-50 rounded-xl p-3"><b>Fit notes:</b> {c.fitNotes}</div>}

        <Card className="p-4 mt-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge tone={o.status === 'cancelled' ? 'Cancelled' : orderStageLabel(o).split(',')[0]}>{orderStageLabel(o)}</Badge>
            {o.urgent && <Badge tone="Urgent">Urgent</Badge>}
            {late && <Badge tone="Overdue">{daysBetween(o.deliveryDate, t)} days late</Badge>}
            <div className="flex-1" />
            <button className="text-plum-700 text-sm inline-flex items-center gap-1" onClick={() => setEdit({ trialDate: o.trialDate, deliveryDate: o.deliveryDate, discount: o.discount, notes: o.notes, urgent: o.urgent })}><Pencil size={14} /> Edit</button>
          </div>
          <Row label="Booked on" value={fmtDate(o.createdAt)} />
          <Row label="Trial" value={o.trialDate ? fmtDate(o.trialDate) : 'Not needed'} />
          <Row label="Delivery" value={fmtDate(o.deliveryDate)} strong />
          {o.notes && <div className="text-sm text-muted mt-1">{o.notes}</div>}
        </Card>

        <SectionTitle right={o.status !== 'cancelled' && <Btn size="sm" variant="ghost" onClick={() => setItemEdit('new')}><Plus size={16} /> Add dress</Btn>}>Dresses</SectionTitle>
        <div className="space-y-3">
          {o.items.map((it, idx) => {
            const m = s.measurements.find((x) => x.id === it.measurementId);
            const si = s.stages.indexOf(it.stage);
            const tailor = s.tailors.find((x) => x.id === it.tailorId);
            return (
              <Card key={it.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{idx + 1}. {dressName(s, it.dressTypeId)}</div>
                    <div className="text-xs text-muted">{Object.entries(it.styles || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'No style options'}</div>
                    <div className="text-xs text-muted">{it.fabric} fabric{it.fabricNote ? ' — ' + it.fabricNote : ''} · Tailor: {tailor?.name || 'not assigned'}</div>
                    {(it.addons || []).length > 0 && <div className="text-xs text-muted">Extras: {it.addons.map((a) => s.addons.find((x) => x.id === a)?.name).filter(Boolean).join(', ')}</div>}
                    {it.notes && <div className="text-xs mt-1 text-plum-900">📝 {it.notes}</div>}
                  </div>
                  <div className="font-semibold">{money(itemTotal(it, s))}</div>
                </div>
                {it.photos?.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                    {it.photos.map((p, i) => <img key={i} src={p} alt="" onClick={() => setPhoto(p)} className="w-16 h-16 rounded-lg object-cover border border-line" />)}
                  </div>
                )}
                {m && (
                  <details className="mt-2 text-xs">
                    <summary className="text-plum-700 cursor-pointer">Measurements ({fmtDate(m.date)})</summary>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-2">
                      {Object.entries(m.values).map(([k, v]) => <div key={k}><span className="text-muted">{k}:</span> <b>{v}</b></div>)}
                    </div>
                    <button className="mt-2 text-[#1f9d55] inline-flex items-center gap-1" onClick={() => setWa({ phone: tailor?.phone || '', text: measurementText(s, m) + `\n\nOrder #${o.no} · ${dressName(s, it.dressTypeId)}\n${Object.entries(it.styles || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')}${it.notes ? '\nNote: ' + it.notes : ''}\nDeliver by: ${fmtDate(o.deliveryDate)}`, title: 'Send job card to tailor' })}>
                      <MessageCircle size={13} /> Send job card to tailor
                    </button>
                  </details>
                )}
                {o.status !== 'cancelled' && (
                  <>
                    <div className="flex items-center gap-1 mt-3 overflow-x-auto no-scrollbar">
                      {s.stages.map((st, i) => (
                        <div key={st} className="flex items-center">
                          <div className={cx('h-1.5 w-6 rounded-full', i <= si ? 'bg-plum-600' : 'bg-plum-100')} title={st} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Btn size="sm" variant="outline" disabled={si <= 0} onClick={() => moveStage(it, s.stages[si - 1])}><ChevronLeft size={16} /></Btn>
                      <Select value={it.stage} onChange={(e) => moveStage(it, e.target.value)} className="h-9 flex-1 text-sm">
                        {s.stages.map((st) => <option key={st}>{st}</option>)}
                      </Select>
                      <Btn size="sm" disabled={si >= s.stages.length - 1} onClick={() => moveStage(it, s.stages[si + 1])}>{s.stages[si + 1] || 'Done'} <ChevronRight size={16} /></Btn>
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <button className="text-plum-700" onClick={() => setItemEdit({ ...it, measurementValues: m?.values || {} })}>Edit dress</button>
                      {o.items.length > 1 && <button className="text-red-700" onClick={() => confirmBox('Remove this dress from the order?', () => setOrder((x) => ({ ...x, items: x.items.filter((i) => i.id !== it.id) })))}>Remove</button>}
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>

        <SectionTitle right={<Btn size="sm" variant="ghost" onClick={() => setPay({ amount: String(due || ''), mode: 'Cash', date: t, note: due ? 'Balance' : '' })}><Wallet size={16} /> Add payment</Btn>}>Payment</SectionTitle>
        <Card className="p-4">
          <Row label="Dresses" value={money(total + (Number(o.discount) || 0))} />
          {o.discount > 0 && <Row label="Discount" value={'− ' + money(o.discount)} />}
          <Row label="Total" value={money(total)} strong />
          <Row label="Paid" value={money(paid)} />
          <div className="border-t border-line mt-1 pt-1"><Row label="Balance due" value={<span className={due ? 'text-amber-700' : 'text-emerald-700'}>{due ? money(due) : 'Fully paid ✓'}</span>} strong /></div>
          {(o.payments || []).length > 0 && (
            <div className="mt-3 space-y-1">
              {o.payments.map((p) => (
                <div key={p.id} className="flex items-center text-sm bg-cream rounded-lg px-2 py-1.5">
                  <span className="flex-1">{fmtDate(p.date)} · {p.mode}{p.note ? ' · ' + p.note : ''}</span>
                  <b>{money(p.amount)}</b>
                  <button aria-label="Delete payment" className="ml-2 text-muted" onClick={() => confirmBox('Delete this payment entry?', () => setOrder((x) => ({ ...x, payments: x.payments.filter((y) => y.id !== p.id) })))}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {due > 0 && <Btn variant="wa" size="sm" className="w-full mt-3" onClick={() => setWa({ phone: c.phone, title: 'Payment reminder', text: fillTemplate(s.templates.dues, orderVars(s, o)) })}><MessageCircle size={16} /> Send payment reminder</Btn>}
        </Card>

        <div className="grid grid-cols-2 gap-2 mt-6">
          <Btn variant="outline" onClick={() => setMsgMenu(true)}><MessageCircle size={16} /> Messages</Btn>
          <Btn variant="outline" onClick={() => nav.go('invoice', { id })}><Printer size={16} /> Bill</Btn>
          {o.status !== 'cancelled' ? (
            <Btn variant="danger" onClick={() => confirmBox('Cancel this order?', () => setOrder((x) => ({ ...x, status: 'cancelled' })))}><Ban size={16} /> Cancel order</Btn>
          ) : (
            <Btn variant="soft" onClick={() => setOrder((x) => ({ ...x, status: 'active' }))}>Restore order</Btn>
          )}
          <Btn variant="danger" onClick={() => confirmBox('Delete this order permanently?', () => { update((st) => ({ ...st, orders: st.orders.filter((x) => x.id !== id) })); notify('Order deleted'); nav.back(); })}><Trash2 size={16} /> Delete</Btn>
        </div>
      </Page>

      <Sheet open={msgMenu} onClose={() => setMsgMenu(false)} title="WhatsApp messages">
        <div className="space-y-2">
          {messages.map(([label, tpl]) => (
            <Card key={label} className="p-3 flex items-center gap-3" onClick={() => { setMsgMenu(false); setWa({ phone: c.phone, title: label, text: fillTemplate(tpl, orderVars(s, o)) }); }}>
              <MessageCircle size={18} className="text-[#1f9d55]" /><div className="flex-1">{label}</div><ChevronRight size={16} className="text-muted" />
            </Card>
          ))}
        </div>
      </Sheet>

      <Sheet open={!!pay} onClose={() => setPay(null)} title="Add payment" footer={<Btn size="lg" className="w-full" onClick={addPayment}>Save payment</Btn>}>
        {pay && (
          <div className="space-y-3">
            <Field label="Amount (₹)"><Input autoFocus inputMode="numeric" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value.replace(/[^\d]/g, '') })} /></Field>
            <Field label="Mode"><div className="flex flex-wrap gap-2">{PAY_MODES.map((m) => <Chip key={m} active={pay.mode === m} onClick={() => setPay({ ...pay, mode: m })}>{m}</Chip>)}</div></Field>
            <Field label="Date"><Input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
            <Field label="Note"><Input value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} /></Field>
          </div>
        )}
      </Sheet>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title="Edit order" footer={<Btn size="lg" className="w-full" onClick={() => { setOrder((x) => ({ ...x, ...edit, discount: Number(edit.discount) || 0 })); setEdit(null); notify('Order updated'); }}>Save</Btn>}>
        {edit && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Trial date"><Input type="date" value={edit.trialDate} onChange={(e) => setEdit({ ...edit, trialDate: e.target.value })} /></Field>
              <Field label="Delivery date"><Input type="date" value={edit.deliveryDate} onChange={(e) => setEdit({ ...edit, deliveryDate: e.target.value })} /></Field>
            </div>
            <Field label="Discount (₹)"><Input inputMode="numeric" value={edit.discount} onChange={(e) => setEdit({ ...edit, discount: e.target.value.replace(/[^\d]/g, '') })} /></Field>
            <div className="flex items-center justify-between"><span className="text-sm">Urgent order</span><Chip active={edit.urgent} onClick={() => setEdit({ ...edit, urgent: !edit.urgent })}>{edit.urgent ? 'Yes' : 'No'}</Chip></div>
            <Field label="Notes"><Textarea rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
          </div>
        )}
      </Sheet>

      <ItemEditor open={!!itemEdit} initial={itemEdit && itemEdit !== 'new' ? itemEdit : null} customerId={o.customerId} onClose={() => setItemEdit(null)}
        onSave={(it) => {
          const vals = Object.fromEntries(Object.entries(it.measurementValues || {}).filter(([, v]) => String(v).trim() !== ''));
          const prevM = s.measurements.find((x) => x.id === it.measurementId) || latestMeasurement(s, o.customerId, it.dressTypeId);
          let measurementId = it.measurementId || '';
          const newMeas = [];
          if (Object.keys(vals).length) {
            if (prevM && prevM.dressTypeId === it.dressTypeId && sameVals(prevM.values, vals)) measurementId = prevM.id;
            else { measurementId = uid(); newMeas.push({ id: measurementId, customerId: o.customerId, dressTypeId: it.dressTypeId, values: vals, note: `Order #${o.no}`, date: t }); }
          }
          const { measurementValues, prevMeasurementId, ...rest } = it;
          const exists = o.items.find((x) => x.id === it.id);
          const clean = { ...rest, measurementId, stage: exists ? exists.stage : 'Order placed', stageLog: exists ? exists.stageLog : [{ stage: 'Order placed', at: t + 'T00:00' }] };
          update((st) => ({
            ...st,
            measurements: [...st.measurements, ...newMeas],
            orders: st.orders.map((x) => (x.id === id ? { ...x, items: exists ? x.items.map((i) => (i.id === it.id ? clean : i)) : [...x.items, clean] } : x)),
          }));
          setItemEdit(null);
          notify('Dress saved');
        }} />

      {photo && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center" onClick={() => setPhoto(null)}>
          <img src={photo} alt="" className="max-w-full max-h-full" />
        </div>
      )}
      <WaSheet open={!!wa} onClose={() => setWa(null)} {...(wa || {})} />
    </>
  );
}

// ------------------------------------------------------------ bill / invoice
export function Invoice({ id }) {
  const { s, notify } = useStore();
  const nav = useNav();
  const [wa, setWa] = useState(null);
  const o = s.orders.find((x) => x.id === id);
  if (!o) return <><Header title="Bill" onBack={nav.back} /><Empty title="Order not found" /></>;
  const c = s.customers.find((x) => x.id === o.customerId) || {};
  const total = orderTotal(o, s), paid = orderPaid(o), due = orderDue(o, s);

  const text = [
    `*${s.shop.name}*`, s.shop.address, s.shop.phone && 'Ph: ' + s.shop.phone, s.shop.gst && 'GSTIN: ' + s.shop.gst, '',
    `*Bill — Order #${o.no}*`, `Date: ${fmtDate(o.createdAt)}`, `Customer: ${c.name}`, '',
    ...o.items.flatMap((it, i) => [
      `${i + 1}. ${dressName(s, it.dressTypeId)} — ${money(it.price)}`,
      ...(it.addons || []).map((a) => { const x = s.addons.find((y) => y.id === a); return x ? `   + ${x.name} — ${money(x.price)}` : null; }).filter(Boolean),
    ]),
    '', o.discount ? `Discount: − ${money(o.discount)}` : null, `*Total: ${money(total)}*`, `Paid: ${money(paid)}`, `*Balance: ${money(due)}*`,
    s.shop.upi && due ? `UPI: ${s.shop.upi}` : null, '', 'Thank you! 🙏',
  ].filter((x) => x !== null && x !== undefined && x !== false).join('\n');

  return (
    <>
      <div className="print:hidden"><Header title={`Bill #${o.no}`} onBack={nav.back} /></div>
      <Page className="print:p-0">
        <div className="bg-white rounded-2xl border border-line p-5 print:border-0 print:rounded-none">
          <div className="text-center border-b border-dashed border-line pb-3">
            <div className="font-serif text-2xl text-plum-800">{s.shop.name}</div>
            {s.shop.address && <div className="text-xs text-muted">{s.shop.address}</div>}
            {s.shop.phone && <div className="text-xs text-muted">Ph: {s.shop.phone}</div>}
            {s.shop.gst && <div className="text-xs text-muted">GSTIN: {s.shop.gst}</div>}
          </div>
          <div className="flex justify-between text-sm mt-3">
            <div><div className="text-muted text-xs">Bill to</div><div className="font-medium">{c.name}</div><div className="text-xs text-muted">{c.phone}</div></div>
            <div className="text-right"><div className="text-muted text-xs">Order</div><div className="font-medium">#{o.no}</div><div className="text-xs text-muted">{fmtDate(o.createdAt)}</div></div>
          </div>
          <table className="w-full text-sm mt-4">
            <thead><tr className="border-b border-line text-muted text-xs"><th className="text-left py-1 font-medium">Item</th><th className="text-right py-1 font-medium">Amount</th></tr></thead>
            <tbody>
              {o.items.map((it, i) => (
                <React.Fragment key={it.id}>
                  <tr><td className="py-1">{i + 1}. {dressName(s, it.dressTypeId)}</td><td className="text-right">{money(it.price)}</td></tr>
                  {(it.addons || []).map((a) => { const x = s.addons.find((y) => y.id === a); return x && <tr key={a} className="text-muted text-xs"><td className="pl-4">+ {x.name}</td><td className="text-right">{money(x.price)}</td></tr>; })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="border-t border-line mt-3 pt-2 text-sm">
            {o.discount > 0 && <Row label="Discount" value={'− ' + money(o.discount)} />}
            <Row label="Total" value={money(total)} strong />
            <Row label="Paid" value={money(paid)} />
            <Row label="Balance" value={money(due)} strong />
          </div>
          {s.shop.upi && due > 0 && <div className="text-center text-xs text-muted mt-3">Pay by UPI: <b className="text-ink">{s.shop.upi}</b></div>}
          <div className="text-center text-xs text-muted mt-4">Thank you for your order!</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 print:hidden">
          <Btn variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(text); notify('Bill copied'); } catch (e) { notify('Could not copy'); } }}><Copy size={16} /> Copy bill</Btn>
          <Btn variant="wa" onClick={() => setWa({ phone: c.phone, text, title: 'Send bill on WhatsApp' })}><MessageCircle size={16} /> Send bill</Btn>
        </div>
      </Page>
      <WaSheet open={!!wa} onClose={() => setWa(null)} {...(wa || {})} />
    </>
  );
}
