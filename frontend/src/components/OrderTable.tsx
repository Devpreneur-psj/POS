import classNames from "classnames";
import { OrderItem } from "../types";

interface OrderTableProps {
  items: OrderItem[];
  onQuantityChange: (menuItemId: number, quantity: number) => void;
  onRemove: (menuItemId: number) => void;
  onClear: () => void;
}

export function OrderTable({ items, onQuantityChange, onRemove, onClear }: OrderTableProps) {
  const total = items.reduce((sum, item) => sum + item.line_total, 0);
  const hasItems = items.length > 0;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">주문 내역</h2>
          <p className="text-xs text-slate-500">메뉴 수량을 조절하거나 삭제할 수 있어요.</p>
        </div>
        <button
          type="button"
          disabled={!hasItems}
          onClick={onClear}
          className={classNames(
            "rounded-full px-4 py-1 text-xs font-medium transition",
            hasItems
              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
              : "cursor-not-allowed bg-slate-900 text-slate-600"
          )}
        >
          전체 취소
        </button>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {hasItems ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.menu_item_id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/50 px-4 py-3 text-sm text-slate-200"
              >
                <div>
                  <p className="font-medium text-white">{item.menu_name}</p>
                  <p className="text-xs text-slate-500">
                    ₩{item.unit_price.toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(item.menu_item_id, item.quantity - 1)}
                    className="rounded-full bg-slate-800 px-2 py-1 text-xs text-white hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-white">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(item.menu_item_id, item.quantity + 1)}
                    className="rounded-full bg-slate-800 px-2 py-1 text-xs text-white hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-right text-sm font-semibold text-brand-accent">
                    ₩{item.line_total.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(item.menu_item_id)}
                    className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
            <p>선택된 메뉴가 없습니다.</p>
            <p className="text-xs">좌측에서 메뉴를 추가해보세요.</p>
          </div>
        )}
      </div>
      <footer className="border-t border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>총액</span>
          <span className="text-xl font-semibold text-brand-accent">
            ₩{total.toLocaleString()}
          </span>
        </div>
      </footer>
    </div>
  );
}

