// Default data, helpers and calculations for the boutique app.

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export const daysBetween = (a, b) =>
  Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (iso) => {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
export const fmtShort = (iso) => {
  if (!iso) return '—';
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};
export const money = (n) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export const STYLE_GROUPS = {
  Neck: ['Round', 'V neck', 'Boat', 'Sweetheart', 'Square', 'High neck', 'Collar', 'Keyhole'],
  Sleeve: ['Sleeveless', 'Cap', 'Short', 'Elbow', '3/4', 'Full', 'Puff', 'Bell'],
  Back: ['Plain', 'Deep', 'Dori (tie)', 'Buttons', 'Hooks', 'Zip', 'Window'],
  Opening: ['Front', 'Back', 'Side zip', 'None'],
  Lining: ['Yes', 'No'],
  Padding: ['Yes', 'No'],
  Fit: ['Regular', 'Fitted', 'Loose'],
  Bottom: ['Straight', 'Churidar', 'Palazzo', 'Patiala', 'Cigarette', 'Dhoti'],
};

const dt = (id, name, fields, styles, days, price) => ({ id, name, fields, styles, days, price });

export const DEFAULT_DRESS_TYPES = [
  dt('blouse', 'Blouse', ['Shoulder', 'Bust', 'Under-bust', 'Waist', 'Front length', 'Back length', 'Blouse length', 'Armhole', 'Sleeve length', 'Sleeve round', 'Elbow round', 'Front neck depth', 'Back neck depth', 'Neck width', 'Apex point', 'Dart point'], ['Neck', 'Sleeve', 'Back', 'Opening', 'Lining', 'Padding'], 7, 800),
  dt('kurti', 'Kurti / Kurta', ['Shoulder', 'Bust', 'Waist', 'Hip', 'Kurti length', 'Armhole', 'Sleeve length', 'Sleeve round', 'Wrist', 'Front neck', 'Back neck', 'Slit length'], ['Neck', 'Sleeve', 'Fit', 'Lining'], 7, 700),
  dt('salwar', 'Salwar / Pant / Palazzo', ['Waist', 'Hip', 'Length', 'Thigh', 'Knee', 'Calf', 'Bottom (mohri)', 'Crotch / rise'], ['Bottom'], 5, 500),
  dt('suit', 'Salwar suit (set)', ['Shoulder', 'Bust', 'Waist', 'Hip', 'Kurti length', 'Armhole', 'Sleeve length', 'Sleeve round', 'Front neck', 'Back neck', 'Bottom waist', 'Bottom length', 'Thigh', 'Knee', 'Bottom (mohri)'], ['Neck', 'Sleeve', 'Bottom', 'Lining'], 8, 1200),
  dt('lehenga', 'Lehenga / Skirt', ['Waist', 'Hip', 'Length', 'Flare (kali count)'], ['Lining', 'Opening'], 12, 2500),
  dt('anarkali', 'Anarkali / Gown', ['Shoulder', 'Bust', 'Waist', 'Hip', 'Waist to floor', 'Full length', 'Armhole', 'Sleeve length', 'Sleeve round', 'Front neck', 'Back neck'], ['Neck', 'Sleeve', 'Back', 'Lining', 'Padding'], 10, 1800),
  dt('western', 'Western dress / Top', ['Shoulder', 'Bust', 'Waist', 'Hip', 'Length', 'Sleeve length', 'Armhole'], ['Neck', 'Sleeve', 'Fit', 'Opening'], 7, 900),
  dt('saree', 'Saree fall / pico', [], [], 2, 150),
  dt('alteration', 'Alteration', ['Change needed (inches)'], [], 2, 200),
];

export const DEFAULT_ADDONS = [
  { id: 'lining', name: 'Lining', price: 150 },
  { id: 'padding', name: 'Padding', price: 150 },
  { id: 'piping', name: 'Piping / lace work', price: 100 },
  { id: 'latkan', name: 'Latkan / tassels', price: 100 },
  { id: 'embroidery', name: 'Embroidery / handwork', price: 1000 },
  { id: 'urgent', name: 'Urgent delivery', price: 300 },
];

export const DEFAULT_STAGES = ['Order placed', 'Cutting', 'Stitching', 'Trial', 'Alteration', 'Ready', 'Delivered'];

export const DEFAULT_TEMPLATES = {
  confirm:
    'Namaste {name} 🙏\nThank you for your order at *{shop}*.\n\nOrder no: *{orderNo}*\n{items}\n\nTotal: {total}\nAdvance paid: {paid}\nBalance: {due}\nTrial: {trialDate}\nDelivery: {deliveryDate}\n\nFor any change, reply here or call {phone}.',
  stage: 'Hi {name}, update on your order *{orderNo}* at {shop}:\n{itemName} is now at *{stage}* stage. ✂️\nExpected delivery: {deliveryDate}.',
  trial: 'Hi {name}, reminder from *{shop}*: your trial for order *{orderNo}* is on *{trialDate}*. Please visit us. 📍 {address}',
  ready:
    'Good news {name}! 🎉 Your dress for order *{orderNo}* is *ready* at {shop}.\nBalance to pay: *{due}*\nUPI: {upi}\nPlease collect it at your convenience.',
  reminder: 'Hi {name}, gentle reminder from {shop}: your order *{orderNo}* is ready and waiting for you. Balance: {due}.',
  thanks:
    'Thank you {name} for choosing *{shop}* 💐\nOrder *{orderNo}* delivered. Total {total}, paid {paid}.\nWe would love your feedback: {review}',
  dues: 'Hi {name}, this is a friendly reminder from {shop} that {due} is pending for order *{orderNo}*. UPI: {upi}. Thank you!',
  greeting: 'Happy birthday {name}! 🎂 Wishing you a wonderful year from all of us at *{shop}*. Visit us this month for a special surprise.',
};

export const defaultState = () => ({
  version: 1,
  shop: {
    name: 'My Boutique',
    owner: '',
    phone: '',
    address: '',
    gst: '',
    upi: '',
    review: '',
    unit: 'in',
    countryCode: '91',
  },
  dressTypes: DEFAULT_DRESS_TYPES,
  styleGroups: STYLE_GROUPS,
  addons: DEFAULT_ADDONS,
  stages: DEFAULT_STAGES,
  tailors: [],
  templates: DEFAULT_TEMPLATES,
  customers: [],
  measurements: [],
  orders: [],
  nextOrderNo: 1001,
  onboarded: false,
});

// ---------- calculations ----------
export const itemTotal = (item, s) =>
  (Number(item.price) || 0) +
  (item.addons || []).reduce((a, id) => a + (Number(s.addons.find((x) => x.id === id)?.price) || 0), 0);

export const orderTotal = (o, s) =>
  Math.max(0, o.items.reduce((a, it) => a + itemTotal(it, s), 0) - (Number(o.discount) || 0));

export const orderPaid = (o) => (o.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0);
export const orderDue = (o, s) => Math.max(0, orderTotal(o, s) - orderPaid(o));

export const isDelivered = (o) => o.items.length > 0 && o.items.every((i) => i.stage === 'Delivered');
export const isReady = (o) => !isDelivered(o) && o.items.every((i) => i.stage === 'Ready' || i.stage === 'Delivered');
export const isActive = (o) => o.status !== 'cancelled' && !isDelivered(o);

export const orderStageLabel = (o) => {
  if (o.status === 'cancelled') return 'Cancelled';
  if (isDelivered(o)) return 'Delivered';
  if (isReady(o)) return 'Ready';
  const stages = o.items.map((i) => i.stage);
  return [...new Set(stages)].join(', ');
};

export const dressName = (s, id) => s.dressTypes.find((d) => d.id === id)?.name || 'Dress';

export const latestMeasurement = (s, customerId, dressTypeId) =>
  s.measurements
    .filter((m) => m.customerId === customerId && m.dressTypeId === dressTypeId)
    .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))[0];

export const phoneDigits = (p, cc = '91') => {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 10) return cc + d;
  return d;
};

export const waUrl = (phone, text, cc) => {
  const p = phoneDigits(phone, cc);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
};

export const fillTemplate = (tpl, vars) =>
  String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== '' ? vars[k] : '—'));

export const orderVars = (s, o, extra = {}) => {
  const c = s.customers.find((x) => x.id === o.customerId) || {};
  return {
    name: c.name || '',
    shop: s.shop.name,
    phone: s.shop.phone,
    address: s.shop.address,
    upi: s.shop.upi,
    review: s.shop.review,
    orderNo: '#' + o.no,
    items: o.items.map((it, i) => `${i + 1}. ${dressName(s, it.dressTypeId)} — ${money(itemTotal(it, s))}`).join('\n'),
    total: money(orderTotal(o, s)),
    paid: money(orderPaid(o)),
    due: money(orderDue(o, s)),
    trialDate: o.trialDate ? fmtDate(o.trialDate) : 'Not needed',
    deliveryDate: fmtDate(o.deliveryDate),
    ...extra,
  };
};

export const measurementText = (s, m) => {
  const c = s.customers.find((x) => x.id === m.customerId) || {};
  const d = s.dressTypes.find((x) => x.id === m.dressTypeId);
  const unit = s.shop.unit === 'cm' ? 'cm' : 'in';
  const lines = Object.entries(m.values || {})
    .filter(([, v]) => v !== '' && v !== undefined)
    .map(([k, v]) => `${k}: ${v} ${unit}`);
  return `*${s.shop.name}* — Measurement card\n${c.name || ''} · ${d?.name || ''}\nTaken: ${fmtDate(m.date)}\n\n${lines.join('\n')}${m.note ? '\n\nNote: ' + m.note : ''}`;
};

// ---------- demo data ----------
export const demoData = (base) => {
  const s = { ...base };
  const t = todayISO();
  const tailors = [
    { id: 'tl1', name: 'Rekha (Master)', phone: '9800000001' },
    { id: 'tl2', name: 'Salim bhai', phone: '9800000002' },
  ];
  const cust = [
    { id: 'c1', name: 'Priya Patil', phone: '9876543210', address: 'Station Road, Bhusawal', birthday: addDays(t, 3).replace(/^\d{4}/, '1992'), anniversary: '', notes: 'Regular customer', fitNotes: 'Prefers slightly loose armhole', createdAt: addDays(t, -200) },
    { id: 'c2', name: 'Sneha Joshi', phone: '9822012345', address: 'Jamner Road', birthday: '', anniversary: '', notes: '', fitNotes: '', createdAt: addDays(t, -40) },
    { id: 'c3', name: 'Ayesha Shaikh', phone: '9890011223', address: 'Khadka Road', birthday: '', anniversary: '', notes: 'Bridal order — wedding in Jan', fitNotes: 'Deep back, no padding', createdAt: addDays(t, -10) },
    { id: 'c4', name: 'Kavita Chaudhari', phone: '9763322110', address: 'Jalgaon', birthday: '', anniversary: '', notes: '', fitNotes: '', createdAt: addDays(t, -5) },
  ];
  const meas = [
    { id: 'm1', customerId: 'c1', dressTypeId: 'blouse', date: addDays(t, -420), note: '', values: { Shoulder: '14', Bust: '36', 'Under-bust': '31', Waist: '32', 'Blouse length': '15', Armhole: '17', 'Sleeve length': '10', 'Sleeve round': '12', 'Front neck depth': '7', 'Back neck depth': '9' } },
    { id: 'm2', customerId: 'c2', dressTypeId: 'kurti', date: addDays(t, -6), note: '', values: { Shoulder: '13.5', Bust: '34', Waist: '30', Hip: '38', 'Kurti length': '42', Armhole: '16', 'Sleeve length': '17', 'Front neck': '6.5', 'Back neck': '7' } },
    { id: 'm3', customerId: 'c3', dressTypeId: 'blouse', date: addDays(t, -10), note: 'Bridal blouse', values: { Shoulder: '14.5', Bust: '35', Waist: '30', 'Blouse length': '14', Armhole: '16.5', 'Sleeve length': '11', 'Front neck depth': '6.5', 'Back neck depth': '10' } },
    { id: 'm4', customerId: 'c3', dressTypeId: 'lehenga', date: addDays(t, -10), note: '', values: { Waist: '30', Hip: '39', Length: '41', 'Flare (kali count)': '24' } },
    { id: 'm5', customerId: 'c4', dressTypeId: 'blouse', date: addDays(t, -5), note: '', values: { Shoulder: '15', Bust: '38', Waist: '34', 'Blouse length': '15.5', Armhole: '18', 'Sleeve length': '9' } },
  ];
  const item = (dressTypeId, stage, price, measurementId, tailorId, styles = {}, addons = [], daysAgo = 3) => ({
    id: uid(), dressTypeId, stage, price, measurementId, tailorId, styles, addons, fabric: 'Customer', fabricNote: '', photos: [], notes: '',
    stageLog: [{ stage: 'Order placed', at: addDays(t, -daysAgo) + 'T10:00' }, ...(stage !== 'Order placed' ? [{ stage, at: addDays(t, -1) + 'T12:00' }] : [])],
  });
  const orders = [
    { id: 'o1', no: 1001, customerId: 'c1', createdAt: addDays(t, -6) + 'T11:00', trialDate: t, deliveryDate: addDays(t, 2), urgent: false, discount: 0, status: 'active', notes: '', items: [item('blouse', 'Trial', 800, 'm1', 'tl1', { Neck: 'Boat', Sleeve: 'Elbow', Back: 'Dori (tie)' }, ['lining'], 6)], payments: [{ id: uid(), amount: 500, mode: 'UPI', date: addDays(t, -6), note: 'Advance' }] },
    { id: 'o2', no: 1002, customerId: 'c2', createdAt: addDays(t, -6) + 'T16:00', trialDate: '', deliveryDate: addDays(t, -1), urgent: false, discount: 0, status: 'active', notes: '', items: [item('kurti', 'Stitching', 700, 'm2', 'tl2', { Neck: 'Round', Sleeve: '3/4' }, [], 6)], payments: [{ id: uid(), amount: 300, mode: 'Cash', date: addDays(t, -6), note: 'Advance' }] },
    { id: 'o3', no: 1003, customerId: 'c3', createdAt: addDays(t, -10) + 'T12:00', trialDate: addDays(t, 5), deliveryDate: addDays(t, 12), urgent: false, discount: 200, status: 'active', notes: 'Bridal set — red & gold', items: [item('blouse', 'Cutting', 1200, 'm3', 'tl1', { Neck: 'Sweetheart', Sleeve: 'Elbow', Back: 'Deep', Padding: 'No' }, ['embroidery'], 10), item('lehenga', 'Order placed', 2500, 'm4', 'tl2', { Lining: 'Yes' }, ['latkan'], 10)], payments: [{ id: uid(), amount: 3000, mode: 'UPI', date: addDays(t, -10), note: 'Advance' }] },
    { id: 'o4', no: 1004, customerId: 'c4', createdAt: addDays(t, -5) + 'T10:00', trialDate: '', deliveryDate: addDays(t, -2), urgent: true, discount: 0, status: 'active', notes: '', items: [item('blouse', 'Ready', 800, 'm5', 'tl1', { Neck: 'V neck', Sleeve: 'Short' }, ['urgent'], 5)], payments: [{ id: uid(), amount: 400, mode: 'Cash', date: addDays(t, -5), note: 'Advance' }] },
    { id: 'o5', no: 1005, customerId: 'c1', createdAt: addDays(t, -30) + 'T10:00', trialDate: '', deliveryDate: addDays(t, -22), urgent: false, discount: 0, status: 'active', notes: '', items: [item('saree', 'Delivered', 150, '', 'tl2', {}, [], 30)], payments: [{ id: uid(), amount: 150, mode: 'Cash', date: addDays(t, -22), note: 'Full' }] },
    { id: 'o6', no: 1006, customerId: 'c2', createdAt: t + 'T09:30', trialDate: '', deliveryDate: addDays(t, 5), urgent: false, discount: 0, status: 'active', notes: '', items: [item('salwar', 'Order placed', 500, '', 'tl2', { Bottom: 'Palazzo' }, [], 0)], payments: [{ id: uid(), amount: 200, mode: 'UPI', date: t, note: 'Advance' }] },
  ];
  return {
    ...s,
    shop: { ...s.shop, name: 'Shree Designer Studio', owner: 'Meera', phone: '9800012345', address: 'Main Road, Bhusawal', upi: 'shreedesigner@upi', review: 'https://g.page/r/your-review-link' },
    tailors, customers: cust, measurements: meas, orders, nextOrderNo: 1007, onboarded: true,
  };
};
