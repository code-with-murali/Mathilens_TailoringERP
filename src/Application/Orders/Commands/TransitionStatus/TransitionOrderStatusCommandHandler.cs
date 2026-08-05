using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Commands.TransitionStatus;

/// <summary>Order status transitions are validated against <see cref="Domain.Orders.Order.CanTransitionTo"/> here — never left to bubble up as an unhandled exception (01_ARCHITECTURE.md § 13 Exception Strategy).</summary>
public sealed class TransitionOrderStatusCommandHandler : ICommandHandler<TransitionOrderStatusCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;

    public TransitionOrderStatusCommandHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<Result<OrderDto>> Handle(TransitionOrderStatusCommand command, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(command.OrderId, cancellationToken);
        if (order is null)
        {
            return Result.Failure<OrderDto>(Error.NotFound("Order.NotFound", $"No order was found with id '{command.OrderId}'."));
        }

        if (!order.CanTransitionTo(command.TargetStatus))
        {
            return Result.Failure<OrderDto>(Error.Conflict(
                "Order.InvalidStatusTransition", $"Cannot transition an order from '{order.Status}' to '{command.TargetStatus}'."));
        }

        order.TransitionTo(command.TargetStatus);
        await _orderRepository.SaveChangesAsync(cancellationToken);

        return order.ToDto();
    }
}
