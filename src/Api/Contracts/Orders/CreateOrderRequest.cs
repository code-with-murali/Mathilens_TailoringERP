using MathilensERP.Domain.Inventory;
using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Orders;

namespace MathilensERP.Api.Contracts.Orders;

public sealed record CreateOrderRequest(Guid CustomerId, Guid? EmployeeId, DateTime DueAtUtc, IReadOnlyList<CreateOrderItemRequest> Items, string? Notes = null);

public sealed record CreateOrderItemRequest(GarmentType GarmentType, int Quantity, decimal UnitPrice, CreateOrderItemFabricRequest? Fabric);

/// <summary><c>ClothCode</c> is resolved against the price list; a match is what lets stock fall.</summary>
public sealed record CreateOrderItemFabricRequest(
    string FabricType,
    FabricSource Source,
    string? Color,
    decimal Quantity,
    string? ClothCode = null,
    ClothUnit Unit = ClothUnit.Metres);
