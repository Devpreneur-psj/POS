import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ReceiptPayload } from "../types";

interface ReceiptModalProps {
  open: boolean;
  receipt?: ReceiptPayload;
  onClose: () => void;
}

export function ReceiptModal({ open, receipt, onClose }: ReceiptModalProps) {
  if (!receipt) return null;

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
          <div className="flex min-h-full items-end justify-center px-4 pb-20 pt-4 sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-white">영수증</Dialog.Title>
                <div className="mt-4 space-y-4 rounded-2xl bg-slate-950/60 p-6 text-sm text-slate-100">
                  <header className="text-center">
                    <p className="text-xs uppercase tracking-widest text-brand-accent">
                      {receipt.store_name}
                    </p>
                    <p className="text-lg font-semibold text-white">테이블: {receipt.table_name}</p>
                  </header>
                  <div className="space-y-2">
                    {receipt.items.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.quantity} × ₩{item.unit_price.toLocaleString()}
                          </p>
                        </div>
                        <span className="font-semibold text-brand-accent">
                          ₩{item.line_total.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 border-t border-dashed border-slate-700 pt-4 text-sm">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>총액</span>
                      <span className="text-lg font-semibold text-white">
                        ₩{receipt.total_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>지불 ({receipt.payment_method === "CASH" ? "현금" : "카드"})</span>
                      <span>₩{receipt.paid_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>거스름돈</span>
                      <span>₩{receipt.change_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  <footer className="text-center text-xs text-slate-500">
                    {receipt.thank_you_message}
                  </footer>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-brand-accent px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500"
                  >
                    닫기
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

