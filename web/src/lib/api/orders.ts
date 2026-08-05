import { apiGet, apiGetPaged, apiPost, apiPut } from "@/lib/api-client";
import type { GarmentType } from "./measurements";

export const ORDER_STATUSES = ["Received", "InProgress", "ReadyForDelivery", "Delivered", "Cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FABRIC_SOURCES = ["CustomerSupplied", "ShopSupplied"] as const;
export type FabricSource = (typeof FABRIC_SOURCES)[number];

export type FabricDetails = {
  fabricType: string;
  source: FabricSource;
  color: string | null;
  quantity: number;
};

export type OrderItem = {
  id: string;
  garmentType: GarmentType;
  quantity: number;
  unitPrice: number;
  fabric: FabricDetails | null;
};

export type Order = {
  id: string;
  customerId: string;
  employeeId: string | null;
  status: OrderStatus;
  dueAtUtc: string;
  createdAtUtc: string;
  items: OrderItem[];
};

export type CreateOrderItemFabricInput = { fabricType: string; source: FabricSource; color: string | null; quantity: number };
export type CreateOrderItemInput = { garmentType: GarmentType; quantity: number; unitPrice: number; fabric: CreateOrderItemFabricInput | null };
export type CreateOrderInput = { customerId: string; employeeId: string | null; dueAtUtc: string; items: CreateOrderItemInput[] };

export function searchOrders(
  customerId: string | null,
  status: OrderStatus | null,
  page: number,
  pageSize: number,
  token: string | null,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (customerId) {
    params.set("customerId", customerId);
  }
  if (status) {
    params.set("status", status);
  }
  return apiGetPaged<Order>(`/api/v1/orders?${params}`, token);
}

export function getOrder(id: string, token: string | null) {
  return apiGet<Order>(`/api/v1/orders/${id}`, token);
}

export function createOrder(input: CreateOrderInput, token: string | null) {
  return apiPost<Order>("/api/v1/orders", input, token);
}

export function addOrderItem(orderId: string, garmentType: GarmentType, quantity: number, unitPrice: number, token: string | null) {
  return apiPost<Order>(`/api/v1/orders/${orderId}/items`, { garmentType, quantity, unitPrice }, token);
}

export function setOrderItemFabric(
  orderId: string,
  itemId: string,
  fabricType: string,
  source: FabricSource,
  color: string | null,
  quantity: number,
  token: string | null,
) {
  return apiPut<Order>(`/api/v1/orders/${orderId}/items/${itemId}/fabric`, { fabricType, source, color, quantity }, token);
}

export function transitionOrderStatus(orderId: string, targetStatus: OrderStatus, token: string | null) {
  return apiPut<Order>(`/api/v1/orders/${orderId}/status`, { targetStatus }, token);
}

export function assignOrderEmployee(orderId: string, employeeId: string, token: string | null) {
  return apiPut<Order>(`/api/v1/orders/${orderId}/employee`, { employeeId }, token);
}
