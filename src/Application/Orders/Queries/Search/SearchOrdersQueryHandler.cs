using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Shared.Pagination;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Queries.Search;

public sealed class SearchOrdersQueryHandler : IQueryHandler<SearchOrdersQuery, Result<PagedResult<OrderDto>>>
{
    private readonly IOrderRepository _orderRepository;

    public SearchOrdersQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<Result<PagedResult<OrderDto>>> Handle(SearchOrdersQuery query, CancellationToken cancellationToken)
    {
        var page = await _orderRepository.SearchAsync(query.CustomerId, query.Status, query.Page, query.PageSize, cancellationToken);

        var items = page.Items.Select(o => o.ToDto()).ToList();

        return new PagedResult<OrderDto>(items, page.Page, page.PageSize, page.TotalCount);
    }
}
