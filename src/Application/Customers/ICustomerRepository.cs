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

    Task<PagedResult<Customer>> SearchAsync(string? searchTerm, Religion? religion, int page, int pageSize, CancellationToken cancellationToken);

    /// <summary>Every customer, unpaginated — for spreadsheet export, which has no page to scroll.</summary>
    Task<IReadOnlyList<Customer>> ListAllAsync(CancellationToken cancellationToken);

    /// <summary>Exact match on the phone number, the natural key spreadsheet imports upsert against.</summary>
    Task<Customer?> GetByPhoneNumberAsync(string phoneNumber, CancellationToken cancellationToken);

    void Add(Customer customer);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
