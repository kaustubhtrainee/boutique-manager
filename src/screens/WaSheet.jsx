import React, { useEffect, useState } from 'react';
import { MessageCircle, Copy } from 'lucide-react';
import { Sheet, Btn, Textarea, Field, Input } from '../ui';
import { waUrl } from '../data';
import { useStore } from '../store';

// Shows the ready-made message so the owner can check/edit it, then opens WhatsApp with it typed.
export default function WaSheet({ open, onClose, phone, text, title = 'Send on WhatsApp' }) {
  const { s, notify } = useStore();
  const [msg, setMsg] = useState(text);
  const [ph, setPh] = useState(phone || '');
  useEffect(() => {
    if (open) {
      setMsg(text);
      setPh(phone || '');
    }
  }, [open, text, phone]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg);
      notify('Message copied');
    } catch (e) {
      notify('Could not copy');
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-2">
          <Btn variant="outline" onClick={copy} className="flex-none">
            <Copy size={18} />
          </Btn>
          <a
            href={ph ? waUrl(ph, msg, s.shop.countryCode) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { if (!ph) { e.preventDefault(); return; } setTimeout(onClose, 300); }}
            className={'flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl font-medium bg-[#1f9d55] text-white active:bg-[#178246]' + (ph ? '' : ' opacity-40')}
          >
            <MessageCircle size={18} /> Open WhatsApp
          </a>
        </div>
      }
    >
      <Field label="WhatsApp number" className="mb-3">
        <Input value={ph} onChange={(e) => setPh(e.target.value)} inputMode="tel" placeholder="10-digit mobile" />
      </Field>
      <Field label="Message (you can edit before sending)">
        <Textarea rows={11} value={msg} onChange={(e) => setMsg(e.target.value)} />
      </Field>
    </Sheet>
  );
}
