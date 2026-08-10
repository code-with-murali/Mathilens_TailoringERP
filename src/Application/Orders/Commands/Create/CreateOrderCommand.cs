using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
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

public sealed record CreateOrderItemInput(GarmentType GarmentType, int Quantity, decimal UnitPrice, CreateOrderItemFabricInput? Fabric);

public sealed record CreateOrderItemFabricInput(string FabricType, FabricSource Source, string? Color, decimal Quantity);
