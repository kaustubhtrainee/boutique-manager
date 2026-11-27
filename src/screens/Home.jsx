import React, { useMemo, useState } from 'react';
import { Plus, UserPlus, CalendarClock, Truck, PackageCheck, Wallet, AlertTriangle, MessageCircle, Cake, Scissors } from 'lucide-react';
import { useStore } from '../store';
import { useNav } from '../App';
import { Page, Card, Btn, SectionTitle, Badge, Avatar, cx } from '../ui';
import {
  todayISO, fmtShort, money, isActive, isReady, isDelivered, orderDue, orderStageLabel, daysBetween,
  dressName, fillTemplate, orderVars,
} from '../data';
import WaSheet from './WaSheet';

export default function Home() {
  const { s } = useStore();
  const nav = useNav();
  const t = todayISO();
  const [wa, setWa] = useState(null);
  const cust = (id) => s.customers.find((c) => c.id === id) || {};

  const d = useMemo(() => {
    const active = s.orders.filter(isActive);
    const trials = active.filter((o) => o.trialDate === t && !isReady(o));
    const dueToday = active.filter((o) => o.deliveryDate === t && !isReady(o));
    const overdue = active.filter((o) => o.deliveryDate < t && !isReady(o));
    const ready = active.filter(isReady);
    const dues = s.orders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + orderDue(o, s), 0);
    const collected = s.orders
      .flatMap((o) => o.payments || [])
      .filter((p) => p.date === t)
      .reduce((a, p) => a + Number(p.amount || 0), 0);
    const md = t.slice(5);
    const bdays = s.customers.filter(
      (c) => (c.birthday && c.birthday.slice(5) === md) || (c.anniversary && c.anniversary.slice(5) === md)
    );
    const items = active.flatMap((o) => o.items).filter((i) => i.stage !== 'Ready' && i.stage !== 'Delivered').length;
    return { active, trials, dueToday, overdue, ready, dues, collected, bdays, items };
  }, [s, t]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const OrderLine = ({ o, extra }) => {
    const c = cust(o.customerId);
    return (
      <Card className="p-3 flex items-center gap-3" onClick={() => nav.go('order', { id: o.id })}>
        <Avatar name={c.name} />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{c.name}</div>
          <div className="text-xs text-muted truncate">
            #{o.no} · {o.items.map((i) => dressName(s, i.dressTypeId)).join(', ')}
          </div>
        </div>
        <div className="text-right shrink-0">
          {extra}
          <div className="mt-1">
            <Badge>{orderStageLabel(o).split(',')[0]}</Badge>
          </div>
        </div>
      </Card>
    );
  };

  const stats = [
    { label: 'Pieces in work', value: d.items, icon: Scissors, tone: 'text-plum-700 bg-plum-50', go: () => nav.tab('board') },
    { label: 'Ready to collect', value: d.ready.length, icon: PackageCheck, tone: 'text-emerald-700 bg-emerald-50', go: () => nav.go('orders', { filter: 'ready' }) },
    { label: 'Pending dues', value: money(d.dues), icon: Wallet, tone: 'text-amber-700 bg-amber-50', go: () => nav.go('dues') },
    { label: 'Collected today', value: money(d.collected), icon: Wallet, tone: 'text-sky-700 bg-sky-50', go: () => nav.go('reports') },
  ];

  return (
    <>
      <div className="bg-plum-800 text-white">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-16">
          <div className="text-plum-200 text-sm">{greet}{s.shop.owner ? ', ' + s.shop.owner : ''}</div>
          <div className="font-serif text-2xl mt-0.5">{s.shop.name}</div>
          <div className="text-plum-200 text-xs mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>
      <Page className="-mt-12">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((x) => (
            <Card key={x.label} className="p-3" onClick={x.go}>
              <div className={cx('w-9 h-9 rounded-xl flex items-center justify-center', x.tone)}>
                <x.icon size={18} />
              </div>
              <div className="text-xl font-semibold mt-2 text-ink">{x.value}</div>
              <div className="text-xs text-muted">{x.label}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Btn size="lg" onClick={() => nav.go('newOrder')}>
            <Plus size={20} /> New order
          </Btn>
          <Btn size="lg" variant="soft" onClick={() => nav.go('customerForm')}>
            <UserPlus size={20} /> Customer
          </Btn>
        </div>

        {d.overdue.length > 0 && (
          <>
            <SectionTitle>
              <span className="text-red-700 inline-flex items-center gap-1">
                <AlertTriangle size={14} /> Late orders ({d.overdue.length})
              </span>
            </SectionTitle>
            <div className="space-y-2">
              {d.overdue.map((o) => (
                <OrderLine key={o.id} o={o} extra={<div className="text-xs text-red-700 font-medium">{daysBetween(o.deliveryDate, t)}d late</div>} />
              ))}
            </div>
          </>
        )}

        <SectionTitle>
          <span className="inline-flex items-center gap-1">
            <CalendarClock size={14} /> Trials today ({d.trials.length})
          </span>
        </SectionTitle>
        {d.trials.length ? (
          <div className="space-y-2">{d.trials.map((o) => <OrderLine key={o.id} o={o} />)}</div>
        ) : (
          <div className="text-sm text-muted">No trials scheduled today.</div>
        )}

        <SectionTitle>
          <span className="inline-flex items-center gap-1">
            <Truck size={14} /> Due for delivery today ({d.dueToday.length})
          </span>
        </SectionTitle>
        {d.dueToday.length ? (
          <div className="space-y-2">{d.dueToday.map((o) => <OrderLine key={o.id} o={o} />)}</div>
        ) : (
          <div className="text-sm text-muted">Nothing due today.</div>
        )}

        <SectionTitle>
          <span className="inline-flex items-center gap-1">
            <PackageCheck size={14} /> Ready, waiting for pickup ({d.ready.length})
          </span>
        </SectionTitle>
        {d.ready.length ? (
          <div className="space-y-2">
            {d.ready.map((o) => (
              <OrderLine
                key={o.id}
                o={o}
                extra={
                  <button
                    className="text-xs text-[#1f9d55] font-medium inline-flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWa({ phone: cust(o.customerId).phone, text: fillTemplate(s.templates.reminder, orderVars(s, o)), title: 'Pickup reminder' });
                    }}
                  >
                    <MessageCircle size={14} /> Remind
                  </button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted">No finished orders waiting.</div>
        )}

        {d.bdays.length > 0 && (
          <>
            <SectionTitle>
              <span className="inline-flex items-center gap-1">
                <Cake size={14} /> Birthdays & anniversaries today
              </span>
            </SectionTitle>
            <div className="space-y-2">
              {d.bdays.map((c) => (
                <Card key={c.id} className="p-3 flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="flex-1 font-medium">{c.name}</div>
                  <Btn
                    size="sm"
                    variant="wa"
                    onClick={() => setWa({ phone: c.phone, text: fillTemplate(s.templates.greeting, { name: c.name, shop: s.shop.name }), title: 'Send wishes' })}
                  >
                    <MessageCircle size={16} /> Wish
                  </Btn>
                </Card>
              ))}
            </div>
          </>
        )}
      </Page>
      <WaSheet open={!!wa} onClose={() => setWa(null)} {...(wa || {})} />
    </>
  );
}
