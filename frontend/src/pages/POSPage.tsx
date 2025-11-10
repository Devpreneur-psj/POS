import { useEffect, useMemo, useState } from "react";
import { MenuList } from "../components/MenuList";
import { OrderTable } from "../components/OrderTable";
import { CashPaymentModal } from "../components/CashPaymentModal";
import { ReceiptModal } from "../components/ReceiptModal";
import { api } from "../lib/api";
import { MenuItem, OrderItem, PaymentMethod, ReceiptPayload } from "../types";

const TABLES = [
  { id: 1, label: "1번" },
  { id: 2, label: "2번" },
  { id: 3, label: "3번" },
  { id: 4, label: "4번" },
  { id: 5, label: "5번" },
  { id: 6, label: "6번" }
];

export function POSPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [rating, setRating] = useState<number | undefined>();
  const [comment, setComment] = useState("");
  const [receipt, setReceipt] = useState<ReceiptPayload | undefined>();
  const [showCashModal, setShowCashModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const data = await api.getMenu();
        setMenu(
          data.map((item: MenuItem) => ({
            ...item,
            base_price: Number(item.base_price)
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const totalAmount = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.line_total, 0),
    [orderItems]
  );

  const handleAddItem = (item: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((it) => it.menu_item_id === item.id);
      const unitPrice = item.base_price;
      if (existing) {
        return prev.map((it) =>
          it.menu_item_id === item.id
            ? {
                ...it,
                quantity: it.quantity + 1,
                line_total: unitPrice * (it.quantity + 1)
              }
            : it
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          menu_name: item.name,
          quantity: 1,
          unit_price: unitPrice,
          line_total: unitPrice
        }
      ];
    });
  };

  const handleQuantityChange = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(menuItemId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) =>
        item.menu_item_id === menuItemId
          ? {
              ...item,
              quantity,
              line_total: item.unit_price * quantity
            }
          : item
      )
    );
  };

  const handleRemoveItem = (menuItemId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.menu_item_id !== menuItemId));
  };

  const handleClear = () => {
    setOrderItems([]);
    setRating(undefined);
    setComment("");
  };

  const submitOrder = async (method: PaymentMethod, paidAmount?: number) => {
    if (orderItems.length === 0) return;
    const payload = {
      table_id: selectedTable,
      status: "PENDING",
      items: orderItems.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity
      })),
      payment_method: method,
      paid_amount: paidAmount ?? totalAmount,
      change_amount: paidAmount ? Math.max(paidAmount - totalAmount, 0) : 0,
      rating,
      comment: comment || undefined
    };
    const order = await api.createOrder(payload);
    if (order?.id) {
      try {
        const receiptData = await api.getReceipt(order.id);
        setReceipt(normalizeReceipt(receiptData));
        setShowReceipt(true);
      } catch (error) {
        console.warn("영수증 생성 실패", error);
      }
    }
    handleClear();
  };

  const handleCardPay = () => submitOrder("CARD", totalAmount);
  const handleCashPay = (amount: number) => submitOrder("CASH", amount);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">테이블 선택</h2>
              <p className="text-xs text-slate-500">현재 선택된 테이블: {selectedTable}번</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TABLES.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedTable(table.id)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    selectedTable === table.id
                      ? "bg-brand-accent text-white shadow-pos"
                      : "border border-slate-700 text-slate-300 hover:border-brand-accent"
                  }`}
                >
                  {table.label}
                </button>
              ))}
            </div>
          </header>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">메뉴</h2>
            {loading && <span className="text-xs text-slate-500">불러오는 중...</span>}
          </div>
          <MenuList items={menu} onAdd={handleAddItem} />
        </div>
      </section>
      <section className="space-y-6">
        <OrderTable
          items={orderItems}
          onClear={handleClear}
          onQuantityChange={handleQuantityChange}
          onRemove={handleRemoveItem}
        />
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div>
            <label className="flex items-center justify-between text-sm text-slate-300">
              손님 만족도
              <select
                value={rating ?? ""}
                onChange={(event) => setRating(event.target.value ? Number(event.target.value) : undefined)}
                className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs focus:border-brand-accent focus:outline-none"
              >
                <option value="">선택</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score}점
                  </option>
                ))}
              </select>
            </label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="손님 코멘트를 기록하세요."
              className="mt-3 h-24 w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 focus:border-brand-accent focus:outline-none"
            />
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>결제 방법</span>
              <div className="flex gap-2">
                {(["CARD", "CASH"] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-full px-4 py-1 text-xs ${
                      paymentMethod === method
                        ? "bg-brand-accent text-white"
                        : "border border-slate-700 text-slate-300 hover:border-brand-accent"
                    }`}
                  >
                    {method === "CARD" ? "카드" : "현금"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-slate-200">
              <span>결제 금액</span>
              <span className="text-lg font-semibold text-brand-accent">
                ₩{totalAmount.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              disabled={orderItems.length === 0}
              onClick={() => {
                if (paymentMethod === "CASH") {
                  setShowCashModal(true);
                } else {
                  handleCardPay();
                }
              }}
              className="mt-2 w-full rounded-full bg-brand-accent py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {paymentMethod === "CARD" ? "카드 결제" : "현금 결제"}
            </button>
          </div>
        </div>
      </section>
      <CashPaymentModal
        open={showCashModal}
        total={totalAmount}
        onSubmit={handleCashPay}
        onClose={() => setShowCashModal(false)}
      />
      <ReceiptModal open={showReceipt} receipt={receipt} onClose={() => setShowReceipt(false)} />
    </div>
  );
}

function normalizeReceipt(data: any): ReceiptPayload {
  return {
    store_name: data.store_name,
    table_name: data.table_name,
    items: data.items.map((item: any) => ({
      name: item.name,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total)
    })),
    total_amount: Number(data.total_amount),
    payment_method: data.payment_method,
    paid_amount: Number(data.paid_amount),
    change_amount: Number(data.change_amount),
    thank_you_message: data.thank_you_message
  };
}

