using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Commands.TransitionStatus;

public sealed record TransitionOrderStatusCommand(Guid OrderId, OrderStatus TargetStatus) : ICommand<Result<OrderDto>>;
