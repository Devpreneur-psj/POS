import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";

interface CashPaymentModalProps {
  open: boolean;
  total: number;
  onSubmit: (amount: number) => void;
  onClose: () => void;
}

export function CashPaymentModal({ open, total, onSubmit, onClose }: CashPaymentModalProps) {
  const [amount, setAmount] = useState(total);

  useEffect(() => {
    if (open) {
      setAmount(total);
    }
  }, [total, open]);

  const change = Math.max(amount - total, 0);

  const handleSubmit = () => {
    if (amount < total) return;
    onSubmit(amount);
    onClose();
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center px-4 pb-20 pt-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 text-left shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-white">현금 결제</Dialog.Title>
                <div className="mt-4 space-y-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>결제 금액</span>
                    <span className="text-xl font-semibold text-brand-accent">
                      ₩{total.toLocaleString()}
                    </span>
                  </div>
                  <label className="block text-sm">
                    <span className="text-slate-400">받은 금액</span>
                    <input
                      type="number"
                      min={total}
                      value={amount}
                      onChange={(event) => setAmount(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                    />
                  </label>
                  <div className="flex items-center justify-between">
                    <span>거스름돈</span>
                    <span className="text-lg font-semibold text-emerald-400">
                      ₩{change.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={amount < total}
                    onClick={handleSubmit}
                    className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    결제 완료
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

