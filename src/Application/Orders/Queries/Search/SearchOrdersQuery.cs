using MathilensERP.Application.Common.Mediator;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Pagination;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Queries.Search;

/// <summary>
/// Filterable by customer and/or status (00_MASTER_SPEC.md § 8.4 Filtering) — the operational shape
/// 02_DATABASE.md § 10.7's composite status+due-date index exists for.
/// </summary>
/// <param name="SearchTerm">
/// One box matching the order number, the customer's name or their phone number. One rather than
/// three, because the person at the counter has been told one thing — a number off a receipt, or a
/// name, or a phone — and should not have to know which box the shop files it under.
/// </param>
public sealed record SearchOrdersQuery(Guid? CustomerId, OrderStatus? Status, string? SearchTerm, int Page, int PageSize)
    : IQuery<Result<PagedResult<OrderDto>>>;
