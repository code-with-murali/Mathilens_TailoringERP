using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Orders;

namespace MathilensERP.Application.Orders;

public sealed record OrderDto(
    Guid Id,
    Guid CustomerId,
    Guid? EmployeeId,
    OrderStatus Status,
    DateTime DueAtUtc,
    DateTime? DeliveredAtUtc,
    string? Notes,
    DateTime CreatedAtUtc,
    IReadOnlyList<OrderItemDto> Items);

public sealed record OrderItemDto(
    Guid Id,
    GarmentType GarmentType,
    int Quantity,
    decimal UnitPrice,
    FabricDetailsDto? Fabric);

public sealed record FabricDetailsDto(
    string FabricType,
    FabricSource Source,
    string? Color,
    decimal Quantity);
