import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { Employee, PayrollRow } from "../types";

interface EmployeePanelProps {
  employees: Employee[];
  payroll: PayrollRow[];
  onRefresh: () => void;
}

export function EmployeePanel({ employees, payroll, onRefresh }: EmployeePanelProps) {
  const [loadingIds, setLoadingIds] = useState<number[]>([]);

  const payrollMap = useMemo(() => {
    const map = new Map<number, PayrollRow>();
    payroll.forEach((row) => map.set(row.employee_id, row));
    return map;
  }, [payroll]);

  const handleStart = async (employeeId: number) => {
    setLoadingIds((prev) => [...prev, employeeId]);
    try {
      await api.startShift({ employee_id: employeeId });
      onRefresh();
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== employeeId));
    }
  };

  const handleEnd = async (employeeId: number) => {
    setLoadingIds((prev) => [...prev, employeeId]);
    try {
      await api.endShift({ employee_id: employeeId });
      onRefresh();
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== employeeId));
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/50 p-6">
      <header>
        <h3 className="text-lg font-semibold text-white">직원 근무 관리</h3>
        <p className="text-xs text-slate-500">근무 시작/종료를 기록하고 급여를 확인하세요.</p>
      </header>
      <div className="space-y-3">
        {employees.map((employee) => {
          const payrollRow = payrollMap.get(employee.id);
          const isLoading = loadingIds.includes(employee.id);
          return (
            <div
              key={employee.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-800/70 px-4 py-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-semibold text-white">
                  {employee.name}{" "}
                  <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                    {employee.role === "OWNER" ? "사장" : "알바"}
                  </span>
                </p>
                <p className="text-xs text-slate-500">시급 ₩{employee.hourly_wage.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStart(employee.id)}
                  disabled={isLoading}
                  className="rounded-full border border-slate-700 px-4 py-1 text-xs text-slate-300 hover:border-brand-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  근무 시작
                </button>
                <button
                  type="button"
                  onClick={() => handleEnd(employee.id)}
                  disabled={isLoading}
                  className="rounded-full bg-brand-accent px-4 py-1 text-xs font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  근무 종료
                </button>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>누적 근무시간: {payrollRow ? `${payrollRow.total_hours}h` : "-"}</p>
                <p>누적 급여: ₩{payrollRow ? payrollRow.total_pay.toLocaleString() : "0"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

