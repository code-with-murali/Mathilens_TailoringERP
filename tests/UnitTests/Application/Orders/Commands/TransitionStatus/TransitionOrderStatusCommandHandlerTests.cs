using MathilensERP.Application.Orders;
using MathilensERP.Application.Orders.Commands.TransitionStatus;
using MathilensERP.Domain.Orders;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Orders.Commands.TransitionStatus;

public class TransitionOrderStatusCommandHandlerTests
{
    [Fact]
    public async Task Handle_WithValidTransition_UpdatesStatus()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);
        var repository = Substitute.For<IOrderRepository>();
        repository.GetByIdAsync(order.Id, Arg.Any<CancellationToken>()).Returns(order);
        var handler = new TransitionOrderStatusCommandHandler(repository);

        var result = await handler.Handle(new TransitionOrderStatusCommand(order.Id, OrderStatus.InProgress), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.InProgress, result.Value.Status);
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithInvalidTransition_ReturnsConflict()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);
        var repository = Substitute.For<IOrderRepository>();
        repository.GetByIdAsync(order.Id, Arg.Any<CancellationToken>()).Returns(order);
        var handler = new TransitionOrderStatusCommandHandler(repository);

        var result = await handler.Handle(new TransitionOrderStatusCommand(order.Id, OrderStatus.Delivered), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.InvalidStatusTransition", result.Error.Code);
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithUnknownOrder_ReturnsNotFound()
    {
        var repository = Substitute.For<IOrderRepository>();
        repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Order?)null);
        var handler = new TransitionOrderStatusCommandHandler(repository);

        var result = await handler.Handle(new TransitionOrderStatusCommand(Guid.NewGuid(), OrderStatus.InProgress), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.NotFound", result.Error.Code);
    }
}
