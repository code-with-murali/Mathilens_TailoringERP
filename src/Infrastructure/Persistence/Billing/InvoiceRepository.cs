using MathilensERP.Application.Billing;
using MathilensERP.Domain.Billing;
using MathilensERP.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace MathilensERP.Infrastructure.Persistence.Billing;

public class InvoiceRepository : IInvoiceRepository
{
    private readonly ApplicationDbContext _dbContext;

    public InvoiceRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        _dbContext.Invoices.Include(i => i.Payments).SingleOrDefaultAsync(i => i.Id == id, cancellationToken);

    public async Task<PagedResult<Invoice>> SearchAsync(Guid? customerId, InvoiceStatus? status, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _dbContext.Invoices.Include(i => i.Payments).AsQueryable();

        if (customerId is { } id)
        {
            query = query.Where(i => i.CustomerId == id);
        }

        if (status is { } s)
        {
            query = query.Where(i => i.Status == s);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(i => i.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Invoice>(items, page, pageSize, totalCount);
    }

    public void Add(Invoice invoice) => _dbContext.Invoices.Add(invoice);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => _dbContext.SaveChangesAsync(cancellationToken);
}
