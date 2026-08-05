using MathilensERP.Domain.Orders;

namespace MathilensERP.Api.Contracts.Orders;

public sealed record TransitionOrderStatusRequest(OrderStatus TargetStatus);
