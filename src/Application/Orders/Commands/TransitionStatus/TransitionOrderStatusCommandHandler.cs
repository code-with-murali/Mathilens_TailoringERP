using MathilensERP.Application.Billing;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Commands.TransitionStatus;

/// <summary>
/// Order status transitions are validated against <see cref="Domain.Orders.Order.CanTransitionTo"/> here — never left to bubble up as an unhandled exception (01_ARCHITECTURE.md § 13 Exception Strategy).
///
/// Delivery carries one extra rule the lifecycle itself cannot express: the garment does not leave
/// the shop while money is still owed on it. That is a billing fact, so it is checked here — where
/// both aggregates are reachable — rather than inside <see cref="Domain.Orders.Order"/>.
/// </summary>
public sealed class TransitionOrderStatusCommandHandler : ICommandHandler<TransitionOrderStatusCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IInvoiceRepository _invoiceRepository;

    public TransitionOrderStatusCommandHandler(IOrderRepository orderRepository, IInvoiceRepository invoiceRepository)
    {
        _orderRepository = orderRepository;
        _invoiceRepository = invoiceRepository;
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

        if (command.TargetStatus == OrderStatus.Delivered)
        {
            var outstanding = await _invoiceRepository.GetOutstandingAmountForOrderAsync(command.OrderId, cancellationToken);
            if (outstanding > 0)
            {
                return Result.Failure<OrderDto>(Error.Conflict(
                    "Order.PaymentPending",
                    $"This order cannot be marked as delivered while {outstanding:0.##} is still outstanding — record the payment first."));
            }
        }

        order.TransitionTo(command.TargetStatus, command.DeliveredAtUtc);
        await _orderRepository.SaveChangesAsync(cancellationToken);

        return order.ToDto();
    }
}
