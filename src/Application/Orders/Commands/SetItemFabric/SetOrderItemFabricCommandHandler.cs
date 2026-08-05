using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Commands.SetItemFabric;

public sealed class SetOrderItemFabricCommandHandler : ICommandHandler<SetOrderItemFabricCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;

    public SetOrderItemFabricCommandHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<Result<OrderDto>> Handle(SetOrderItemFabricCommand command, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(command.OrderId, cancellationToken);
        if (order is null)
        {
            return Result.Failure<OrderDto>(Error.NotFound("Order.NotFound", $"No order was found with id '{command.OrderId}'."));
        }

        if (order.Items.All(i => i.Id != command.OrderItemId))
        {
            return Result.Failure<OrderDto>(Error.NotFound(
                "OrderItem.NotFound", $"No item with id '{command.OrderItemId}' was found on this order."));
        }

        if (!order.CanModifyItems)
        {
            return Result.Failure<OrderDto>(Error.Conflict(
                "Order.NotModifiable", $"Cannot modify items on an order that is '{order.Status}'."));
        }

        order.SetItemFabric(command.OrderItemId, command.FabricType, command.Source, command.Color, command.Quantity);
        await _orderRepository.SaveChangesAsync(cancellationToken);

        return order.ToDto();
    }
}
