export type PaymentMethod = "CASH" | "CARD";

export interface MenuItem {
  id: number;
  name: string;
  base_price: number;
  category: string;
  description?: string;
  is_active: boolean;
}

export interface OrderItem {
  id?: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: number;
  table_id: number;
  status: string;
  total_amount: number;
  payment_method?: PaymentMethod;
  paid_amount?: number;
  change_amount?: number;
  created_at: string;
  items: OrderItem[];
  rating?: number;
  comment?: string;
}

export interface ReceiptLine {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface ReceiptPayload {
  store_name: string;
  table_name: string;
  items: ReceiptLine[];
  total_amount: number;
  payment_method: PaymentMethod;
  paid_amount: number;
  change_amount: number;
  thank_you_message: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  unit?: string;
  quantity: number;
  threshold: number;
  menu_item_id?: number;
}

export interface Employee {
  id: number;
  name: string;
  role: "OWNER" | "STAFF";
  hourly_wage: number;
  is_active: boolean;
}

export interface ClockResponse {
  shift_id: number;
  employee_id: number;
  status: "IN_PROGRESS" | "COMPLETED";
  clock_in: string;
  clock_out?: string;
}

export interface PayrollRow {
  employee_id: number;
  employee_name: string;
  total_hours: number;
  total_pay: number;
}

export interface SalesTrendPoint {
  label: string;
  value: number;
}

export interface SalesSummary {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  average_rating?: number;
  period: string;
  top_menu_items: { name: string; revenue: number }[];
}

export interface SalesDashboardResponse {
  summary: SalesSummary;
  daily: SalesTrendPoint[];
  weekly: SalesTrendPoint[];
  monthly: SalesTrendPoint[];
  yearly: SalesTrendPoint[];
}

