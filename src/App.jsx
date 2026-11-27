import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Home as HomeIcon, ClipboardList, Columns3, Users, Menu } from 'lucide-react';
import { useStore } from './store';
import { cx } from './ui';
import Home from './screens/Home';
import { CustomerList, CustomerDetail, CustomerForm, MeasurementForm } from './screens/Customers';
import { OrderList, OrderDetail, NewOrder, Invoice } from './screens/Orders';
import Board from './screens/Board';
import { More, Reports, Dues, Settings, Onboarding } from './screens/More';

const NavCtx = createContext(null);
export const useNav = () => useContext(NavCtx);

const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'board', label: 'Work', icon: Columns3 },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'more', label: 'More', icon: Menu },
];

const SCREENS = {
  home: Home,
  orders: OrderList,
  board: Board,
  customers: CustomerList,
  more: More,
  customer: CustomerDetail,
  customerForm: CustomerForm,
  measurement: MeasurementForm,
  order: OrderDetail,
  newOrder: NewOrder,
  invoice: Invoice,
  reports: Reports,
  dues: Dues,
  settings: Settings,
};

export default function App() {
  const { s } = useStore();
  const [stack, setStack] = useState([{ name: 'home', params: {} }]);

  const go = useCallback((name, params = {}) => {
    setStack((st) => [...st, { name, params }]);
    window.scrollTo(0, 0);
  }, []);
  const back = useCallback(() => {
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
    window.scrollTo(0, 0);
  }, []);
  const replace = useCallback((name, params = {}) => {
    setStack((st) => [...st.slice(0, -1), { name, params }]);
    window.scrollTo(0, 0);
  }, []);
  const tab = useCallback((name) => {
    setStack([{ name, params: {} }]);
    window.scrollTo(0, 0);
  }, []);

  // Android hardware back button (inside the APK)
  useEffect(() => {
    let sub;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { App: CapApp } = await import('@capacitor/app');
        sub = await CapApp.addListener('backButton', () => {
          setStack((st) => {
            if (st.length > 1) return st.slice(0, -1);
            if (st[0].name !== 'home') return [{ name: 'home', params: {} }];
            CapApp.exitApp();
            return st;
          });
        });
      } catch (e) {
        /* not native */
      }
    })();
    return () => sub && sub.remove();
  }, []);

  if (!s.onboarded) return <Onboarding />;

  const cur = stack[stack.length - 1];
  const Screen = SCREENS[cur.name] || Home;
  const rootTab = stack[0].name;
  const showTabs = stack.length === 1 || !['newOrder', 'customerForm', 'measurement', 'invoice'].includes(cur.name);

  return (
    <NavCtx.Provider value={{ go, back, replace, tab, depth: stack.length }}>
      <div className="min-h-full bg-cream">
        <Screen key={stack.length + cur.name + JSON.stringify(cur.params)} {...cur.params} />
      </div>
      {showTabs && (
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line pb-[env(safe-area-inset-bottom)] print:hidden">
          <div className="max-w-3xl mx-auto grid grid-cols-5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = rootTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => tab(t.id)}
                  className={cx('h-16 flex flex-col items-center justify-center gap-0.5 text-[11px]', on ? 'text-plum-700' : 'text-muted')}
                >
                  <span className={cx('px-4 py-1 rounded-full', on && 'bg-plum-50')}>
                    <Icon size={21} strokeWidth={on ? 2.4 : 1.8} />
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </NavCtx.Provider>
  );
}
