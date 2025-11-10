import { useCallback, useEffect, useMemo, useState } from "react";
import { EmployeePanel } from "../components/EmployeePanel";
import { usePolling } from "../hooks/usePolling";
import { api } from "../lib/api";
import {
  Employee,
  InventoryItem,
  MenuItem,
  PayrollRow
} from "../types";

interface InventoryDraft extends InventoryItem {
  draftQuantity: number;
  draftThreshold: number;
}

export function AdminDashboard() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [inventory, setInventory] = useState<InventoryDraft[]>([]);
  const [alerts, setAlerts] = useState<{ id: number; message: string; inventory_id: number }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMenu = useCallback(async () => {
    const data = await api.getMenu();
    setMenu(
      data.map((item: MenuItem) => ({
        ...item,
        base_price: Number(item.base_price)
      }))
    );
  }, []);

  const fetchInventory = useCallback(async () => {
    const data: InventoryItem[] = await api.getInventory();
    setInventory(
      data.map((item) => ({
        ...item,
        draftQuantity: item.quantity,
        draftThreshold: item.threshold
      }))
    );
    const alertData = await api.getInventoryAlerts();
    setAlerts(alertData);
  }, []);

  const fetchEmployees = useCallback(async () => {
    const [employeeList, payrollData] = await Promise.all([api.getEmployees(), api.getPayroll()]);
    setEmployees(
      employeeList.map((employee: Employee) => ({
        ...employee,
        hourly_wage: Number(employee.hourly_wage)
      }))
    );
    setPayroll(
      payrollData.map((row: PayrollRow) => ({
        ...row,
        total_pay: Number(row.total_pay)
      }))
    );
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchMenu(), fetchInventory(), fetchEmployees()]);
  }, [fetchEmployees, fetchInventory, fetchMenu]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  usePolling(() => {
    void fetchInventory();
    void fetchEmployees();
  }, 30_000, []);

  const handleInventoryChange = (id: number, field: "draftQuantity" | "draftThreshold", value: number) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveInventory = async (item: InventoryDraft) => {
    setIsSaving(true);
    try {
      await api.updateInventory({
        inventory_id: item.id,
        quantity: item.draftQuantity,
        threshold: item.draftThreshold
      });
      await fetchInventory();
    } finally {
      setIsSaving(false);
    }
  };

  const inventorySummary = useMemo(() => {
    const totalItems = inventory.length;
    const lowStock = alerts.length;
    return { totalItems, lowStock };
  }, [alerts.length, inventory.length]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm text-slate-400">메뉴 수</h3>
          <p className="mt-2 text-3xl font-semibold text-white">{menu.length}</p>
          <p className="text-xs text-slate-500">활성화된 판매 메뉴 전체 수량</p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm text-slate-400">재고 품목</h3>
          <p className="mt-2 text-3xl font-semibold text-white">{inventorySummary.totalItems}</p>
          <p className="text-xs text-slate-500">관리 중인 원재료 품목 수</p>
        </article>
        <article className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 className="text-sm text-slate-400">재고 경고</h3>
          <p className="mt-2 text-3xl font-semibold text-brand-accent">{inventorySummary.lowStock}</p>
          <p className="text-xs text-slate-500">임계값 이하 재고 수량</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">재고 관리</h2>
          {isSaving && <span className="text-xs text-slate-500">저장 중...</span>}
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-slate-500">
                <th className="px-4 py-2">품목</th>
                <th className="px-4 py-2">보유량</th>
                <th className="px-4 py-2">임계값</th>
                <th className="px-4 py-2">연결 메뉴</th>
                <th className="px-4 py-2 text-right">저장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {inventory.map((item) => (
                <tr key={item.id} className="text-slate-200">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.unit ?? "unit"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.draftQuantity}
                      onChange={(event) =>
                        handleInventoryChange(item.id, "draftQuantity", Number(event.target.value))
                      }
                      className="w-24 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs focus:border-brand-accent focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.draftThreshold}
                      onChange={(event) =>
                        handleInventoryChange(item.id, "draftThreshold", Number(event.target.value))
                      }
                      className="w-24 rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs focus:border-brand-accent focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {menu.find((menuItem) => menuItem.id === item.menu_item_id)?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSaveInventory(item)}
                      className="rounded-full bg-brand-accent px-4 py-1 text-xs font-semibold text-white hover:bg-orange-500"
                    >
                      저장
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {alerts.length > 0 && (
          <div className="mt-4 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-sm text-orange-200">
            <h3 className="text-sm font-semibold text-orange-300">재고 경고</h3>
            <ul className="mt-2 space-y-1 text-xs">
              {alerts.map((alert) => (
                <li key={alert.id}>• {alert.message}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <EmployeePanel employees={employees} payroll={payroll} onRefresh={fetchEmployees} />
      </section>
    </div>
  );
}

