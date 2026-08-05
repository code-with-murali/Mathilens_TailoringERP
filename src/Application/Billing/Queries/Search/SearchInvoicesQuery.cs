using MathilensERP.Application.Common.Mediator;
using MathilensERP.Domain.Billing;
using MathilensERP.Shared.Pagination;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Billing.Queries.Search;

/// <summary>Filterable by customer and/or status (00_MASTER_SPEC.md § 8.4) — the operational shape 02_DATABASE.md § 10.9's composite status+date index exists for.</summary>
public sealed record SearchInvoicesQuery(Guid? CustomerId, InvoiceStatus? Status, int Page, int PageSize) : IQuery<Result<PagedResult<InvoiceDto>>>;
