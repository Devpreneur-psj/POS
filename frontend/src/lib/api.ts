import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 10_000
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "[API_ERROR]",
        error.response.status,
        error.response.config?.url,
        error.response.data
      );
    }
    return Promise.reject(error);
  }
);

export const api = {
  getMenu: () => client.get("/menu").then((res) => res.data),
  createOrder: (payload: unknown) => client.post("/order", payload).then((res) => res.data),
  updateOrder: (id: number, payload: unknown) =>
    client.put(`/order/${id}`, payload).then((res) => res.data),
  deleteOrder: (id: number) => client.delete(`/order/${id}`),
  getOrders: () => client.get("/orders").then((res) => res.data),
  getInventory: () => client.get("/inventory").then((res) => res.data),
  getInventoryAlerts: () => client.get("/inventory/alerts").then((res) => res.data),
  updateInventory: (payload: unknown) =>
    client.put("/inventory/update", payload).then((res) => res.data),
  getEmployees: () => client.get("/employees").then((res) => res.data),
  startShift: (payload: unknown) => client.post("/employee/start", payload).then((res) => res.data),
  endShift: (payload: unknown) => client.post("/employee/end", payload).then((res) => res.data),
  getPayroll: () => client.get("/employee/payroll").then((res) => res.data),
  getSalesSummary: (period = "DAILY") =>
    client.get("/sales/summary", { params: { period } }).then((res) => res.data),
  getReceipt: (orderId: number) =>
    client.get(`/order/${orderId}/receipt`).then((res) => res.data)
};

export type Api = typeof api;

