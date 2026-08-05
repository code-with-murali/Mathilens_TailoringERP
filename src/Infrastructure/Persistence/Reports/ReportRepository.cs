using MathilensERP.Application.Reports;
using MathilensERP.Domain.Billing;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace MathilensERP.Infrastructure.Persistence.Reports;

/// <summary>
/// Projects directly from persistence rather than materializing <see cref="Invoice"/>/
/// <see cref="Order"/> aggregates (01_ARCHITECTURE.md § 20 Reporting Strategy).
/// </summary>
public class ReportRepository : IReportRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ReportRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RevenueReportDto> GetRevenueAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken)
    {
        var invoicesInRange = _dbContext.Invoices.Where(i => i.CreatedAtUtc >= fromUtc && i.CreatedAtUtc <= toUtc);

        var totals = await invoicesInRange
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Count = g.Count(),
                TotalInvoiced = g.Sum(i => i.TotalAmount),
                TotalCollected = g.Sum(i => i.AmountPaid),
            })
            .SingleOrDefaultAsync(cancellationToken);

        var invoiceCount = totals?.Count ?? 0;
        var totalInvoiced = totals?.TotalInvoiced ?? 0m;
        var totalCollected = totals?.TotalCollected ?? 0m;

        return new RevenueReportDto(fromUtc, toUtc, invoiceCount, totalInvoiced, totalCollected, totalInvoiced - totalCollected);
    }

    public async Task<IReadOnlyList<OrderStatusCountDto>> GetOrderStatusSummaryAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken)
    {
        var counts = await _dbContext.Orders
            .Where(o => o.CreatedAtUtc >= fromUtc && o.CreatedAtUtc <= toUtc)
            .GroupBy(o => o.Status)
            .Select(g => new OrderStatusCountDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        // Every status appears, even with a zero count, so dashboard/report consumers never
        // have to treat "absent" and "zero" as different cases.
        var byStatus = counts.ToDictionary(c => c.Status);
        return Enum.GetValues<OrderStatus>()
            .Select(status => byStatus.TryGetValue(status, out var count) ? count : new OrderStatusCountDto(status, 0))
            .ToList();
    }

    public async Task<PagedResult<OutstandingInvoiceDto>> GetOutstandingInvoicesAsync(int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _dbContext.Invoices.Where(i => i.Status == InvoiceStatus.Unpaid || i.Status == InvoiceStatus.PartiallyPaid);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(i => i.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new OutstandingInvoiceDto(i.Id, i.CustomerId, i.TotalAmount, i.AmountPaid, i.TotalAmount - i.AmountPaid, i.Status, i.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new PagedResult<OutstandingInvoiceDto>(items, page, pageSize, totalCount);
    }
}
