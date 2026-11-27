import React, { useMemo, useState } from 'react';
import { ChevronRight, Columns3 } from 'lucide-react';
import { useStore } from '../store';
import { useNav } from '../App';
import { Header, Card, Badge, Chip, Empty, cx } from '../ui';
import { todayISO, fmtShort, daysBetween, isActive, dressName, fillTemplate, orderVars } from '../data';
import WaSheet from './WaSheet';

export default function Board() {
  const { s, update } = useStore();
  const nav = useNav();
  const t = todayISO();
  const [tailor, setTailor] = useState('all');
  const [wa, setWa] = useState(null);
  const stages = s.stages.filter((x) => x !== 'Delivered');

  const cards = useMemo(
    () =>
      s.orders
        .filter((o) => isActive(o))
        .flatMap((o) => o.items.filter((i) => i.stage !== 'Delivered').map((i) => ({ o, i })))
        .filter(({ i }) => tailor === 'all' || (tailor === 'none' ? !i.tailorId : i.tailorId === tailor))
        .sort((a, b) => (b.o.urgent - a.o.urgent) || a.o.deliveryDate.localeCompare(b.o.deliveryDate)),
    [s, tailor]
  );

  const advance = (o, i) => {
    const idx = s.stages.indexOf(i.stage);
    const stage = s.stages[idx + 1];
    if (!stage) return;
    const stamp = t + 'T' + new Date().toTimeString().slice(0, 5);
    const next = { ...o, items: o.items.map((x) => (x.id === i.id ? { ...x, stage, stageLog: [...(x.stageLog || []), { stage, at: stamp }] } : x)) };
    update((st) => ({ ...st, orders: st.orders.map((x) => (x.id === o.id ? next : x)) }));
    const c = s.customers.find((x) => x.id === o.customerId) || {};
    const allReady = next.items.every((x) => x.stage === 'Ready' || x.stage === 'Delivered');
    let tpl = s.templates.stage, title = `Moved to ${stage} — tell customer?`;
    if (stage === 'Ready' && allReady) { tpl = s.templates.ready; title = 'Ready — tell customer?'; }
    if (stage === 'Trial') { tpl = s.templates.trial; title = 'Trial — remind customer?'; }
    if (stage === 'Delivered') { tpl = s.templates.thanks; title = 'Delivered — send thanks?'; }
    setWa({ phone: c.phone, title, text: fillTemplate(tpl, orderVars(s, next, { stage, itemName: dressName(s, i.dressTypeId) })) });
  };

  return (
    <>
      <Header title="Work board" sub={`${cards.length} pieces in progress`} />
      <div className="max-w-3xl mx-auto px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
        <Chip active={tailor === 'all'} onClick={() => setTailor('all')}>All tailors</Chip>
        {s.tailors.map((x) => <Chip key={x.id} active={tailor === x.id} onClick={() => setTailor(x.id)}>{x.name}</Chip>)}
        <Chip active={tailor === 'none'} onClick={() => setTailor('none')}>Unassigned</Chip>
      </div>
      {cards.length === 0 ? (
        <Empty icon={Columns3} title="Nothing in progress" text="New order pieces appear here, one column per stage." />
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 pt-3 pb-28 snap-x">
          {stages.map((st) => {
            const col = cards.filter(({ i }) => i.stage === st);
            return (
              <div key={st} className="w-[78vw] max-w-[290px] shrink-0 snap-start">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Badge tone={st}>{st}</Badge>
                  <span className="text-xs text-muted">{col.length}</span>
                </div>
                <div className="space-y-2 bg-plum-50/50 rounded-2xl p-2 min-h-[120px]">
                  {col.map(({ o, i }) => {
                    const c = s.customers.find((x) => x.id === o.customerId) || {};
                    const late = o.deliveryDate < t;
                    const tl = s.tailors.find((x) => x.id === i.tailorId);
                    return (
                      <Card key={i.id} className="p-3" onClick={() => nav.go('order', { id: o.id })}>
                        <div className="flex gap-2">
                          {i.photos?.[0] && <img src={i.photos[0]} alt="" className="w-11 h-11 rounded-lg object-cover" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{c.name}</div>
                            <div className="text-xs text-muted truncate">#{o.no} · {dressName(s, i.dressTypeId)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {o.urgent && <Badge tone="Urgent">Urgent</Badge>}
                          <span className={cx('text-xs', late ? 'text-red-700 font-medium' : 'text-muted')}>
                            {late ? `${daysBetween(o.deliveryDate, t)}d late` : `Due ${fmtShort(o.deliveryDate)}`}
                          </span>
                          <span className="text-xs text-muted">· {tl?.name || 'Unassigned'}</span>
                        </div>
                        {s.stages[s.stages.indexOf(st) + 1] ? (
                          <button
                            className="mt-2 w-full h-8 rounded-lg bg-white border border-line text-xs font-medium text-plum-800 inline-flex items-center justify-center gap-1 active:bg-plum-50"
                            onClick={(e) => { e.stopPropagation(); advance(o, i); }}
                          >
                            Move to {s.stages[s.stages.indexOf(st) + 1]} <ChevronRight size={14} />
                          </button>
                        ) : null}
                      </Card>
                    );
                  })}
                  {col.length === 0 && <div className="text-xs text-muted text-center py-6">Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <WaSheet open={!!wa} onClose={() => setWa(null)} {...(wa || {})} />
    </>
  );
}
