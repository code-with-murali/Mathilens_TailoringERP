using MathilensERP.Domain.Employees;
using MathilensERP.Shared.Pagination;

namespace MathilensERP.Application.Employees;

/// <summary>Repository port for the <see cref="Employee"/> aggregate (01_ARCHITECTURE.md § 25.1 Repository Pattern).</summary>
public interface IEmployeeRepository
{
    Task<Employee?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<PagedResult<Employee>> SearchAsync(string? searchTerm, int page, int pageSize, CancellationToken cancellationToken);

    void Add(Employee employee);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
