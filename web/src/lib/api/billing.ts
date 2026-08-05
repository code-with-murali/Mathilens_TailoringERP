import { apiGet, apiGetPaged, apiPost, apiPostNoContent } from "@/lib/api-client";

export const INVOICE_STATUSES = ["Unpaid", "PartiallyPaid", "Paid", "Void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ["Cash", "Card", "Upi", "BankTransfer", "Other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type Payment = {
  id: string;
  amount: number;
  method: PaymentMethod;
  createdAtUtc: string;
};

export type Invoice = {
  id: string;
  orderId: string;
  customerId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  remainingBalance: number;
  status: InvoiceStatus;
  createdAtUtc: string;
  payments: Payment[];
};

export function searchInvoices(
  customerId: string | null,
  status: InvoiceStatus | null,
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
  return apiGetPaged<Invoice>(`/api/v1/invoices?${params}`, token);
}

export function getInvoice(id: string, token: string | null) {
  return apiGet<Invoice>(`/api/v1/invoices/${id}`, token);
}

export function createInvoice(orderId: string, taxAmount: number, discountAmount: number, token: string | null) {
  return apiPost<Invoice>("/api/v1/invoices", { orderId, taxAmount, discountAmount }, token);
}

export function recordPayment(invoiceId: string, amount: number, method: PaymentMethod, token: string | null) {
  return apiPost<Invoice>(`/api/v1/invoices/${invoiceId}/payments`, { amount, method }, token);
}

export function voidInvoice(invoiceId: string, token: string | null): Promise<void> {
  return apiPostNoContent(`/api/v1/invoices/${invoiceId}/void`, {}, token);
}
