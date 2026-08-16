using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Domain.Inventory;
using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Commands.Create;

public sealed record CreateOrderCommand(
    Guid CustomerId,
    Guid? EmployeeId,
    DateTime DueAtUtc,
    IReadOnlyList<CreateOrderItemInput> Items,
    string? Notes = null) : ICommand<Result<OrderDto>>;

public sealed record CreateOrderItemInput(string GarmentType, int Quantity, decimal UnitPrice, CreateOrderItemFabricInput? Fabric);

/// <param name="ClothCode">
/// The cloth code staff typed. Resolved against the price list when the order is saved: a match
/// links the fabric to that catalogue entry so stock falls by <paramref name="Quantity"/>, and no
/// match is kept as free text, exactly as the field has always behaved.
/// </param>
public sealed record CreateOrderItemFabricInput(
    string FabricType,
    FabricSource Source,
    string? Color,
    decimal Quantity,
    string? ClothCode = null,
    ClothUnit Unit = ClothUnit.Metres);
