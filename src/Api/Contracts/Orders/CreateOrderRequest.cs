using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Orders;

namespace MathilensERP.Api.Contracts.Orders;

public sealed record CreateOrderRequest(Guid CustomerId, Guid? EmployeeId, DateTime DueAtUtc, IReadOnlyList<CreateOrderItemRequest> Items, string? Notes = null);

public sealed record CreateOrderItemRequest(GarmentType GarmentType, int Quantity, decimal UnitPrice, CreateOrderItemFabricRequest? Fabric);

public sealed record CreateOrderItemFabricRequest(string FabricType, FabricSource Source, string? Color, decimal Quantity);
