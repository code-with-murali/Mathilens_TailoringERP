using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Commands.SetItemFabric;

public sealed record SetOrderItemFabricCommand(
    Guid OrderId,
    Guid OrderItemId,
    string FabricType,
    FabricSource Source,
    string? Color,
    decimal Quantity) : ICommand<Result<OrderDto>>;
