using MathilensERP.Application.Orders;
using MathilensERP.Application.Orders.Queries.GetById;
using MathilensERP.Domain.Orders;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Orders.Queries.GetById;

public class GetOrderByIdQueryHandlerTests
{
    [Fact]
    public async Task Handle_WithExistingOrder_ReturnsDto()
    {
        var order = Order.Create(Guid.NewGuid(), DateTime.UtcNow, null);
        var repository = Substitute.For<IOrderRepository>();
        repository.GetByIdAsync(order.Id, Arg.Any<CancellationToken>()).Returns(order);
        var handler = new GetOrderByIdQueryHandler(repository);

        var result = await handler.Handle(new GetOrderByIdQuery(order.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(order.Id, result.Value.Id);
    }

    [Fact]
    public async Task Handle_WithUnknownOrder_ReturnsNotFound()
    {
        var repository = Substitute.For<IOrderRepository>();
        repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Order?)null);
        var handler = new GetOrderByIdQueryHandler(repository);

        var result = await handler.Handle(new GetOrderByIdQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Order.NotFound", result.Error.Code);
    }
}
