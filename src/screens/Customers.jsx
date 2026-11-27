import React, { useMemo, useState } from 'react';
import { Search, UserPlus, Phone, MessageCircle, Pencil, Ruler, Plus, Trash2, Users, Share2, History, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { useNav } from '../App';
import { Header, Page, Card, Btn, Field, Input, Textarea, Select, SectionTitle, Badge, Avatar, Empty, Row, Chip, confirmBox, cx } from '../ui';
import {
  uid, todayISO, fmtDate, money, daysBetween, orderTotal, orderDue, orderStageLabel, dressName,
  latestMeasurement, measurementText,
} from '../data';
import WaSheet from './WaSheet';

export function CustomerList() {
  const { s } = useStore();
  const nav = useNav();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return s.customers
      .filter((c) => !qq || c.name.toLowerCase().includes(qq) || (c.phone || '').includes(qq))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [s.customers, q]);
  const stats = (c) => {
    const os = s.orders.filter((o) => o.customerId === c.id && o.status !== 'cancelled');
    return { n: os.length, due: os.reduce((a, o) => a + orderDue(o, s), 0) };
  };
  return (
    <>
      <Header
        title="Customers"
        sub={`${s.customers.length} saved`}
        right={
          <Btn size="sm" onClick={() => nav.go('customerForm')}>
            <UserPlus size={16} /> Add
          </Btn>
        }
      />
      <Page>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-3 text-muted" />
          <Input placeholder="Search name or mobile" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        {list.length === 0 ? (
          <Empty icon={Users} title={q ? 'No match' : 'No customers yet'} text={q ? 'Try another name or number.' : 'Add your first customer to save her measurements.'}
            action={!q && <Btn onClick={() => nav.go('customerForm')}><UserPlus size={18} /> Add customer</Btn>} />
        ) : (
          <div className="space-y-2">
            {list.map((c) => {
              const st = stats(c);
              return (
                <Card key={c.id} className="p-3 flex items-center gap-3" onClick={() => nav.go('customer', { id: c.id })}>
                  <Avatar name={c.name} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted">{c.phone || 'No number'} · {st.n} order{st.n === 1 ? '' : 's'}</div>
                  </div>
                  {st.due > 0 && <div className="text-xs font-medium text-amber-700">{money(st.due)} due</div>}
                </Card>
              );
            })}
          </div>
        )}
      </Page>
    </>
  );
}

export function CustomerDetail({ id }) {
  const { s, update, notify } = useStore();
  const nav = useNav();
  const [wa, setWa] = useState(null);
  const [hist, setHist] = useState(null);
  const c = s.customers.find((x) => x.id === id);
  if (!c) return <><Header title="Customer" onBack={nav.back} /><Empty title="Customer not found" /></>;

  const orders = s.orders.filter((o) => o.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const spent = orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + orderTotal(o, s), 0);
  const due = orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + orderDue(o, s), 0);
  const mTypes = [...new Set(s.measurements.filter((m) => m.customerId === id).map((m) => m.dressTypeId))];

  const del = () => {
    if (orders.length) return notify('Customer has orders — cannot delete');
    confirmBox(`Delete ${c.name}? Her measurements will also be removed.`, () => {
      update((st) => ({ ...st, customers: st.customers.filter((x) => x.id !== id), measurements: st.measurements.filter((m) => m.customerId !== id) }));
      notify('Customer deleted');
      nav.back();
    });
  };

  return (
    <>
      <Header title={c.name} sub={c.phone} onBack={nav.back}
        right={<Btn size="sm" variant="ghost" onClick={() => nav.go('customerForm', { id })}><Pencil size={16} /> Edit</Btn>} />
      <Page>
        <div className="grid grid-cols-3 gap-2">
          <a href={c.phone ? `tel:${c.phone}` : undefined}><Btn variant="outline" className="w-full" disabled={!c.phone}><Phone size={17} /> Call</Btn></a>
          <Btn variant="wa" disabled={!c.phone} onClick={() => setWa({ phone: c.phone, text: `Namaste ${c.name}, ` })}><MessageCircle size={17} /> Chat</Btn>
          <Btn onClick={() => nav.go('newOrder', { customerId: id })}><Plus size={17} /> Order</Btn>
        </div>

        <Card className="p-4 mt-4">
          <Row label="Total orders" value={orders.length} />
          <Row label="Total business" value={money(spent)} />
          <Row label="Pending dues" value={<span className={due ? 'text-amber-700 font-semibold' : ''}>{money(due)}</span>} />
          {c.address && <Row label="Address" value={c.address} />}
          {c.birthday && <Row label="Birthday" value={fmtDate(c.birthday)} />}
          {c.anniversary && <Row label="Anniversary" value={fmtDate(c.anniversary)} />}
          {c.notes && <div className="text-sm text-muted mt-2">{c.notes}</div>}
        </Card>
        {c.fitNotes && (
          <div className="mt-3 rounded-2xl bg-rose-50 border border-rose-100 p-3 text-sm text-plum-900">
            <span className="font-semibold">Fit notes: </span>{c.fitNotes}
          </div>
        )}

        <SectionTitle right={<Btn size="sm" variant="ghost" onClick={() => nav.go('measurement', { customerId: id })}><Plus size={16} /> Add</Btn>}>
          Measurements
        </SectionTitle>
        {mTypes.length === 0 ? (
          <Card className="p-4 text-sm text-muted">No measurements saved yet.</Card>
        ) : (
          <div className="space-y-2">
            {mTypes.map((dtId) => {
              const m = latestMeasurement(s, id, dtId);
              const age = daysBetween(m.date, todayISO());
              const versions = s.measurements.filter((x) => x.customerId === id && x.dressTypeId === dtId).length;
              const filled = Object.entries(m.values).filter(([, v]) => v !== '');
              return (
                <Card key={dtId} className="p-3">
                  <div className="flex items-center gap-2">
                    <Ruler size={16} className="text-plum-700" />
                    <div className="font-medium flex-1">{dressName(s, dtId)}</div>
                    {age > 365 && <Badge tone="Overdue">Re-measure</Badge>}
                    <span className="text-xs text-muted">{fmtDate(m.date)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-2 text-xs">
                    {filled.slice(0, 9).map(([k, v]) => (
                      <div key={k} className="truncate"><span className="text-muted">{k}:</span> <b>{v}</b></div>
                    ))}
                  </div>
                  {filled.length > 9 && <div className="text-xs text-muted mt-1">+{filled.length - 9} more</div>}
                  <div className="flex gap-2 mt-3">
                    <Btn size="sm" variant="soft" onClick={() => nav.go('measurement', { customerId: id, dressTypeId: dtId, id: m.id })}><Pencil size={14} /> Update</Btn>
                    <Btn size="sm" variant="outline" onClick={() => setWa({ phone: c.phone, text: measurementText(s, m), title: 'Share measurement card' })}><Share2 size={14} /> Share</Btn>
                    {versions > 1 && <Btn size="sm" variant="ghost" onClick={() => setHist(dtId)}><History size={14} /> {versions}</Btn>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <SectionTitle>Order history</SectionTitle>
        {orders.length === 0 ? (
          <Card className="p-4 text-sm text-muted">No orders yet.</Card>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <Card key={o.id} className="p-3 flex items-center gap-3" onClick={() => nav.go('order', { id: o.id })}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">#{o.no} · {o.items.map((i) => dressName(s, i.dressTypeId)).join(', ')}</div>
                  <div className="text-xs text-muted">{fmtDate(o.createdAt)} · {money(orderTotal(o, s))}</div>
                </div>
                <Badge>{orderStageLabel(o).split(',')[0]}</Badge>
              </Card>
            ))}
          </div>
        )}
        <Btn variant="danger" className="w-full mt-8" onClick={del}><Trash2 size={16} /> Delete customer</Btn>
      </Page>
      <WaSheet open={!!wa} onClose={() => setWa(null)} {...(wa || {})} />
      {hist && <HistorySheet customerId={id} dtId={hist} onClose={() => setHist(null)} />}
    </>
  );
}

function HistorySheet({ customerId, dtId, onClose }) {
  const { s } = useStore();
  const list = s.measurements.filter((m) => m.customerId === customerId && m.dressTypeId === dtId).sort((a, b) => b.date.localeCompare(a.date));
  const fields = s.dressTypes.find((d) => d.id === dtId)?.fields || [];
  return (
    <div className="fixed inset-0 z-50 bg-cream overflow-auto">
      <Header title={`${dressName(s, dtId)} history`} onBack={onClose} />
      <Page>
        <div className="overflow-x-auto bg-white rounded-2xl border border-line">
          <table className="text-sm min-w-full">
            <thead>
              <tr className="bg-plum-50">
                <th className="text-left p-2 font-medium sticky left-0 bg-plum-50">Field</th>
                {list.map((m) => <th key={m.id} className="p-2 font-medium whitespace-nowrap">{fmtDate(m.date)}</th>)}
              </tr>
            </thead>
            <tbody>
              {fields.map((f) => (
                <tr key={f} className="border-t border-line">
                  <td className="p-2 text-muted sticky left-0 bg-white whitespace-nowrap">{f}</td>
                  {list.map((m) => <td key={m.id} className="p-2 text-center">{m.values[f] || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </div>
  );
}

export function CustomerForm({ id, returnTo }) {
  const { s, update, notify } = useStore();
  const nav = useNav();
  const ex = s.customers.find((c) => c.id === id);
  const [f, setF] = useState(ex || { name: '', phone: '', address: '', birthday: '', anniversary: '', notes: '', fitNotes: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const dup = !ex && f.phone && s.customers.find((c) => c.phone && c.phone.replace(/\D/g, '').slice(-10) === f.phone.replace(/\D/g, '').slice(-10));

  const save = () => {
    if (!f.name.trim()) return notify('Please enter a name');
    if (ex) {
      update((st) => ({ ...st, customers: st.customers.map((c) => (c.id === id ? { ...f, name: f.name.trim() } : c)) }));
      notify('Saved');
      nav.back();
    } else {
      const nid = uid();
      update((st) => ({ ...st, customers: [...st.customers, { ...f, name: f.name.trim(), id: nid, createdAt: todayISO() }] }));
      notify('Customer added');
      if (returnTo === 'newOrder') nav.replace('newOrder', { customerId: nid });
      else nav.replace('customer', { id: nid });
    }
  };

  return (
    <>
      <Header title={ex ? 'Edit customer' : 'New customer'} onBack={nav.back} />
      <Page className="space-y-3">
        <Field label="Full name *"><Input autoFocus value={f.name} onChange={set('name')} placeholder="e.g. Priya Patil" /></Field>
        <Field label="Mobile (WhatsApp)" hint={dup ? `⚠ Already saved as ${dup.name}` : 'Used for WhatsApp updates'}>
          <Input value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="10-digit mobile" />
        </Field>
        <Field label="Address / area"><Input value={f.address} onChange={set('address')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Birthday"><Input type="date" value={f.birthday} onChange={set('birthday')} /></Field>
          <Field label="Anniversary"><Input type="date" value={f.anniversary} onChange={set('anniversary')} /></Field>
        </div>
        <Field label="Fit notes" hint="Shown on every order, e.g. prefers loose armhole"><Textarea rows={2} value={f.fitNotes} onChange={set('fitNotes')} /></Field>
        <Field label="Other notes"><Textarea rows={2} value={f.notes} onChange={set('notes')} /></Field>
        <Btn size="lg" className="w-full" onClick={save}>Save customer</Btn>
      </Page>
    </>
  );
}

export function MeasurementForm({ customerId, dressTypeId, id }) {
  const { s, update, notify } = useStore();
  const nav = useNav();
  const c = s.customers.find((x) => x.id === customerId);
  const [dt, setDt] = useState(dressTypeId || s.dressTypes.find((d) => d.fields.length)?.id);
  const dtype = s.dressTypes.find((d) => d.id === dt);
  const prev = id ? s.measurements.find((m) => m.id === id) : latestMeasurement(s, customerId, dt);
  const [vals, setVals] = useState(prev?.values || {});
  const [note, setNote] = useState(prev?.note || '');
  const [date, setDate] = useState(todayISO());
  const [mode, setMode] = useState('new');
  const unit = s.shop.unit === 'cm' ? 'cm' : 'in';

  const changeType = (v) => {
    setDt(v);
    const p = latestMeasurement(s, customerId, v);
    setVals(p?.values || {});
    setNote(p?.note || '');
  };

  const save = () => {
    const values = {};
    (dtype?.fields || []).forEach((f) => { if (vals[f] !== undefined && vals[f] !== '') values[f] = String(vals[f]).trim(); });
    if (!Object.keys(values).length) return notify('Enter at least one measurement');
    let mid = uid();
    if (mode === 'edit' && prev) {
      mid = prev.id;
      update((st) => ({ ...st, measurements: st.measurements.map((m) => (m.id === prev.id ? { ...m, values, note, date } : m)) }));
    } else {
      update((st) => ({ ...st, measurements: [...st.measurements, { id: mid, customerId, dressTypeId: dt, values, note, date }] }));
    }
    notify('Measurements saved');
    nav.back();
  };

  if (!c) return <><Header title="Measurements" onBack={nav.back} /><Empty title="Customer not found" /></>;
  const age = prev ? daysBetween(prev.date, todayISO()) : 0;

  return (
    <>
      <Header title="Measurements" sub={c.name} onBack={nav.back} />
      <Page>
        <Field label="Dress type">
          <Select value={dt} onChange={(e) => changeType(e.target.value)}>
            {s.dressTypes.filter((d) => d.fields.length).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        {prev && (
          <div className={cx('mt-3 rounded-xl p-3 text-sm flex gap-2', age > 365 ? 'bg-red-50 text-red-800' : 'bg-plum-50 text-plum-900')}>
            <AlertCircle size={18} className="shrink-0" />
            <div>
              Pre-filled from {fmtDate(prev.date)}{age > 365 ? ` — over a year old, please re-measure.` : '.'}
              <div className="flex gap-2 mt-2">
                <Chip active={mode === 'new'} onClick={() => setMode('new')}>Save as new</Chip>
                <Chip active={mode === 'edit'} onClick={() => setMode('edit')}>Correct old record</Chip>
              </div>
            </div>
          </div>
        )}
        {c.fitNotes && <div className="mt-3 text-sm bg-rose-50 rounded-xl p-3"><b>Fit notes:</b> {c.fitNotes}</div>}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {(dtype?.fields || []).map((f) => (
            <Field key={f} label={`${f} (${unit})`}>
              <Input inputMode="decimal" value={vals[f] ?? ''} onChange={(e) => setVals({ ...vals, [f]: e.target.value })} placeholder="—" />
            </Field>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Date taken"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <Field label="Note (e.g. measured from old blouse)" className="mt-3"><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <Btn size="lg" className="w-full mt-4" onClick={save}><Ruler size={18} /> Save measurements</Btn>
      </Page>
    </>
  );
}
