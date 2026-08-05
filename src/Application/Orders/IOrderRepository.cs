using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Pagination;

namespace MathilensERP.Application.Orders;

/// <summary>Repository port for the <see cref="Order"/> aggregate (01_ARCHITECTURE.md § 25.1 Repository Pattern) — includes its Items/Fabric on every read.</summary>
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<PagedResult<Order>> SearchAsync(Guid? customerId, OrderStatus? status, int page, int pageSize, CancellationToken cancellationToken);

    void Add(Order order);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
