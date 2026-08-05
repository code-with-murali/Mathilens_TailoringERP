using MathilensERP.Domain.Customers;
using MathilensERP.Shared.Pagination;

namespace MathilensERP.Application.Customers;

/// <summary>
/// Repository port for the <see cref="Customer"/> aggregate (01_ARCHITECTURE.md § 25.1
/// Repository Pattern), implemented in Infrastructure against EF Core/PostgreSQL.
/// Exposes <see cref="SaveChangesAsync"/> directly rather than a separate Unit of Work
/// abstraction, per 01_ARCHITECTURE.md § 25.7 — one command handler, one commit.
/// </summary>
public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<PagedResult<Customer>> SearchAsync(string? searchTerm, int page, int pageSize, CancellationToken cancellationToken);

    void Add(Customer customer);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
