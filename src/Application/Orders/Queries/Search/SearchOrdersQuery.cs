using MathilensERP.Application.Common.Mediator;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Pagination;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Queries.Search;

/// <summary>Filterable by customer and/or status (00_MASTER_SPEC.md § 8.4 Filtering) — the operational shape 02_DATABASE.md § 10.7's composite status+due-date index exists for.</summary>
public sealed record SearchOrdersQuery(Guid? CustomerId, OrderStatus? Status, int Page, int PageSize) : IQuery<Result<PagedResult<OrderDto>>>;
