using MathilensERP.Application.Employees;
using MathilensERP.Domain.Employees;
using MathilensERP.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace MathilensERP.Infrastructure.Persistence.Employees;

public class EmployeeRepository : IEmployeeRepository
{
    private readonly ApplicationDbContext _dbContext;

    public EmployeeRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Employee?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        _dbContext.Employees.SingleOrDefaultAsync(e => e.Id == id, cancellationToken);

    public async Task<PagedResult<Employee>> SearchAsync(string? searchTerm, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _dbContext.Employees.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(e =>
                EF.Functions.ILike(e.FullName, $"%{searchTerm}%") ||
                (e.PhoneNumber != null && EF.Functions.ILike(e.PhoneNumber, $"%{searchTerm}%")));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(e => e.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Employee>(items, page, pageSize, totalCount);
    }

    public void Add(Employee employee) => _dbContext.Employees.Add(employee);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => _dbContext.SaveChangesAsync(cancellationToken);
}
