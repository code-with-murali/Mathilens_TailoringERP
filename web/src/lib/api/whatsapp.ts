import { apiGet, apiGetPaged, apiPost } from "@/lib/api-client";

export const WHATSAPP_MESSAGE_TYPES = ["OrderStatusUpdate", "DeliveryReminder", "Custom"] as const;
export type WhatsAppMessageType = (typeof WHATSAPP_MESSAGE_TYPES)[number];

export const WHATSAPP_MESSAGE_STATUSES = ["Pending", "Sent", "Failed"] as const;
export type WhatsAppMessageStatus = (typeof WHATSAPP_MESSAGE_STATUSES)[number];

export type WhatsAppMessage = {
  id: string;
  customerId: string;
  orderId: string | null;
  messageType: WhatsAppMessageType;
  content: string;
  status: WhatsAppMessageStatus;
  providerMessageId: string | null;
  failureReason: string | null;
  createdAtUtc: string;
};

export function searchWhatsAppMessages(
  customerId: string | null,
  orderId: string | null,
  status: WhatsAppMessageStatus | null,
  page: number,
  pageSize: number,
  token: string | null,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (customerId) {
    params.set("customerId", customerId);
  }
  if (orderId) {
    params.set("orderId", orderId);
  }
  if (status) {
    params.set("status", status);
  }
  return apiGetPaged<WhatsAppMessage>(`/api/v1/whatsapp-messages?${params}`, token);
}

export function getWhatsAppMessage(id: string, token: string | null) {
  return apiGet<WhatsAppMessage>(`/api/v1/whatsapp-messages/${id}`, token);
}

export function sendWhatsAppMessage(
  customerId: string,
  orderId: string | null,
  messageType: WhatsAppMessageType,
  content: string,
  token: string | null,
) {
  return apiPost<WhatsAppMessage>("/api/v1/whatsapp-messages", { customerId, orderId, messageType, content }, token);
}
