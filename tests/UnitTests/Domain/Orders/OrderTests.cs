using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Orders;

namespace MathilensERP.UnitTests.Domain.Orders;

public class OrderTests
{
    [Fact]
    public void Create_WithValidInputs_StartsInReceivedStatusWithNoItems()
    {
        var customerId = Guid.NewGuid();
        var dueAtUtc = DateTime.UtcNow.AddDays(7);

        var order = Order.Create(customerId, dueAtUtc, null);

        Assert.NotEqual(Guid.Empty, order.Id);
        Assert.Equal(customerId, order.CustomerId);
        Assert.Null(order.EmployeeId);
        Assert.Equal(dueAtUtc, order.DueAtUtc);
        Assert.Equal(OrderStatus.Received, order.Status);
        Assert.Empty(order.Items);
    }

    [Fact]
    public void Create_WithEmptyCustomerId_Throws()
    {
        Assert.Throws<ArgumentException>(() => Order.Create(Guid.Empty, DateTime.UtcNow, null));
    }

    [Fact]
    public void AddItem_WithValidInputs_AddsItemToOrder()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);

        var item = order.AddItem(GarmentType.Shirt, 2, 500m);

        Assert.Single(order.Items);
        Assert.Equal(GarmentType.Shirt, item.GarmentType);
        Assert.Equal(2, item.Quantity);
        Assert.Equal(500m, item.UnitPrice);
        Assert.Null(item.Fabric);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void AddItem_WithNonPositiveQuantity_Throws(int quantity)
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);

        Assert.Throws<ArgumentOutOfRangeException>(() => order.AddItem(GarmentType.Shirt, quantity, 500m));
    }

    [Fact]
    public void AddItem_WithNonPositiveUnitPrice_Throws()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);

        Assert.Throws<ArgumentOutOfRangeException>(() => order.AddItem(GarmentType.Shirt, 1, 0m));
    }

    [Fact]
    public void SetItemFabric_WithExistingItem_SetsFabric()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);
        var item = order.AddItem(GarmentType.Shirt, 1, 500m);

        order.SetItemFabric(item.Id, "Cotton", FabricSource.ShopSupplied, "Blue", 2.5m);

        Assert.NotNull(item.Fabric);
        Assert.Equal("Cotton", item.Fabric.FabricType);
        Assert.Equal(FabricSource.ShopSupplied, item.Fabric.Source);
        Assert.Equal("Blue", item.Fabric.Color);
        Assert.Equal(2.5m, item.Fabric.Quantity);
    }

    [Fact]
    public void SetItemFabric_WithUnknownItemId_Throws()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);

        Assert.Throws<InvalidOperationException>(() =>
            order.SetItemFabric(Guid.NewGuid(), "Cotton", FabricSource.ShopSupplied, null, 2m));
    }

    [Fact]
    public void AssignEmployee_SetsEmployeeId()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);
        var employeeId = Guid.NewGuid();

        order.AssignEmployee(employeeId);

        Assert.Equal(employeeId, order.EmployeeId);
    }

    [Theory]
    [InlineData(OrderStatus.Received, OrderStatus.InProgress, true)]
    [InlineData(OrderStatus.Received, OrderStatus.Cancelled, true)]
    [InlineData(OrderStatus.Received, OrderStatus.ReadyForDelivery, false)]
    [InlineData(OrderStatus.Received, OrderStatus.Delivered, false)]
    [InlineData(OrderStatus.InProgress, OrderStatus.ReadyForDelivery, true)]
    [InlineData(OrderStatus.InProgress, OrderStatus.Delivered, false)]
    [InlineData(OrderStatus.ReadyForDelivery, OrderStatus.Delivered, true)]
    [InlineData(OrderStatus.Delivered, OrderStatus.Cancelled, false)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.InProgress, false)]
    public void CanTransitionTo_ReflectsTheEnforcedLifecycle(OrderStatus from, OrderStatus to, bool expected)
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);
        AdvanceTo(order, from);

        Assert.Equal(expected, order.CanTransitionTo(to));
    }

    [Fact]
    public void TransitionTo_WithValidTransition_UpdatesStatus()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);

        order.TransitionTo(OrderStatus.InProgress);

        Assert.Equal(OrderStatus.InProgress, order.Status);
    }

    [Fact]
    public void TransitionTo_WithInvalidTransition_Throws()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);

        Assert.Throws<InvalidOperationException>(() => order.TransitionTo(OrderStatus.Delivered));
    }

    [Fact]
    public void CanModifyItems_IsFalseOnceDelivered()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);
        AdvanceTo(order, OrderStatus.Delivered);

        Assert.False(order.CanModifyItems);
    }

    [Fact]
    public void AddItem_OnDeliveredOrder_Throws()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);
        AdvanceTo(order, OrderStatus.Delivered);

        Assert.Throws<InvalidOperationException>(() => order.AddItem(GarmentType.Shirt, 1, 100m));
    }

    private static void AdvanceTo(Order order, OrderStatus target)
    {
        if (target == OrderStatus.Received)
        {
            return;
        }

        if (target == OrderStatus.Cancelled)
        {
            order.TransitionTo(OrderStatus.Cancelled);
            return;
        }

        order.TransitionTo(OrderStatus.InProgress);
        if (target == OrderStatus.InProgress)
        {
            return;
        }

        order.TransitionTo(OrderStatus.ReadyForDelivery);
        if (target == OrderStatus.ReadyForDelivery)
        {
            return;
        }

        order.TransitionTo(OrderStatus.Delivered);
    }
}
