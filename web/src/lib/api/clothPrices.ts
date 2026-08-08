import { apiDelete, apiGet, apiGetPaged, apiPost, apiPut } from "@/lib/api-client";

export type ClothPrice = {
  id: string;
  clothCode: string;
  clothName: string;
  costPrice: number;
  sellingPrice: number;
  createdAtUtc: string;
};

export type ClothPriceInput = {
  clothCode: string;
  clothName: string;
  costPrice: number;
  sellingPrice: number;
};

export function searchClothPrices(search: string, page: number, pageSize: number, token: string | null) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) {
    params.set("search", search);
  }
  return apiGetPaged<ClothPrice>(`/api/v1/cloth-prices?${params}`, token);
}

export function getClothPrice(id: string, token: string | null) {
  return apiGet<ClothPrice>(`/api/v1/cloth-prices/${id}`, token);
}

export function createClothPrice(input: ClothPriceInput, token: string | null) {
  return apiPost<ClothPrice>("/api/v1/cloth-prices", input, token);
}

export function updateClothPrice(id: string, input: ClothPriceInput, token: string | null) {
  return apiPut<ClothPrice>(`/api/v1/cloth-prices/${id}`, input, token);
}

export function deleteClothPrice(id: string, token: string | null) {
  return apiDelete(`/api/v1/cloth-prices/${id}`, token);
}
