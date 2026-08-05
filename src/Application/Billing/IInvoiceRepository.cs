using MathilensERP.Domain.Billing;
using MathilensERP.Shared.Pagination;

namespace MathilensERP.Application.Billing;

/// <summary>Repository port for the <see cref="Invoice"/> aggregate (01_ARCHITECTURE.md § 25.1 Repository Pattern) — includes its Payments on every read.</summary>
public interface IInvoiceRepository
{
    Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<PagedResult<Invoice>> SearchAsync(Guid? customerId, InvoiceStatus? status, int page, int pageSize, CancellationToken cancellationToken);

    void Add(Invoice invoice);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
