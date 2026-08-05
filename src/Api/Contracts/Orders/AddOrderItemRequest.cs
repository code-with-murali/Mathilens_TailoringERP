using MathilensERP.Domain.Measurements;

namespace MathilensERP.Api.Contracts.Orders;

public sealed record AddOrderItemRequest(GarmentType GarmentType, int Quantity, decimal UnitPrice);
