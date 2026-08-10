using MathilensERP.Domain.Measurements;

namespace MathilensERP.Api.Contracts.Orders;

public sealed record UpdateOrderItemRequest(GarmentType GarmentType, int Quantity, decimal UnitPrice);
