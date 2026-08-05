using MathilensERP.Domain.Orders;

namespace MathilensERP.Application.Orders;

internal static class OrderMapper
{
    public static OrderDto ToDto(this Order order) =>
        new(order.Id, order.CustomerId, order.EmployeeId, order.Status, order.DueAtUtc, order.CreatedAtUtc, order.Items.Select(i => i.ToDto()).ToList());

    private static OrderItemDto ToDto(this OrderItem item) =>
        new(item.Id, item.GarmentType, item.Quantity, item.UnitPrice, item.Fabric?.ToDto());

    private static FabricDetailsDto ToDto(this FabricDetails fabric) =>
        new(fabric.FabricType, fabric.Source, fabric.Color, fabric.Quantity);
}
