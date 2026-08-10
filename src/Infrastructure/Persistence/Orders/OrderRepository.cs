using MathilensERP.Application.Orders;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace MathilensERP.Infrastructure.Persistence.Orders;

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _dbContext;

    public OrderRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        Include(_dbContext.Orders).SingleOrDefaultAsync(o => o.Id == id, cancellationToken);

    public async Task<PagedResult<Order>> SearchAsync(Guid? customerId, OrderStatus? status, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = Include(_dbContext.Orders);

        if (customerId is { } id)
        {
            query = query.Where(o => o.CustomerId == id);
        }

        if (status is { } s)
        {
            query = query.Where(o => o.Status == s);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Order>(items, page, pageSize, totalCount);
    }

    public Task<bool> ExistsForCustomerAsync(Guid customerId, CancellationToken cancellationToken) =>
        _dbContext.Orders.AnyAsync(o => o.CustomerId == customerId, cancellationToken);

    public Task<bool> ExistsForEmployeeAsync(Guid employeeId, CancellationToken cancellationToken) =>
        _dbContext.Orders.AnyAsync(o => o.EmployeeId == employeeId, cancellationToken);

    /// <summary>Joins through Customers on the phone number, so orders placed under a duplicate customer record are found too.</summary>
    public async Task<IReadOnlyList<Order>> GetByCustomerPhoneAsync(string phoneNumber, Guid excludingOrderId, CancellationToken cancellationToken) =>
        await Include(_dbContext.Orders)
            .Where(o => o.Id != excludingOrderId
                && _dbContext.Customers.Any(c => c.Id == o.CustomerId && c.PhoneNumber == phoneNumber))
            .OrderByDescending(o => o.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public void Add(Order order) => _dbContext.Orders.Add(order);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => _dbContext.SaveChangesAsync(cancellationToken);

    private static IQueryable<Order> Include(IQueryable<Order> query) =>
        query.Include(o => o.Items).ThenInclude(i => i.Fabric);
}
