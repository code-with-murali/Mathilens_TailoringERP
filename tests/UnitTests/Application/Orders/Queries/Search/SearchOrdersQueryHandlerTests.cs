using MathilensERP.Application.Orders;
using MathilensERP.Application.Orders.Queries.Search;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Pagination;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Orders.Queries.Search;

public class SearchOrdersQueryHandlerTests
{
    [Fact]
    public async Task Handle_MapsPagedOrdersToDtos()
    {
        var customerId = Guid.NewGuid();
        var order = Order.Create(customerId, DateTime.UtcNow, null);
        var repository = Substitute.For<IOrderRepository>();
        repository.SearchAsync(customerId, OrderStatus.Received, 1, 20, Arg.Any<CancellationToken>())
            .Returns(new PagedResult<Order>([order], 1, 20, 1));
        var handler = new SearchOrdersQueryHandler(repository);

        var result = await handler.Handle(new SearchOrdersQuery(customerId, OrderStatus.Received, 1, 20), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value.Items);
        Assert.Equal(order.Id, result.Value.Items[0].Id);
    }
}
