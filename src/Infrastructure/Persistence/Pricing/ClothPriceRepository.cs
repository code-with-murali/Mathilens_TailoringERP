using MathilensERP.Application.Pricing;
using MathilensERP.Domain.Pricing;
using MathilensERP.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace MathilensERP.Infrastructure.Persistence.Pricing;

public class ClothPriceRepository : IClothPriceRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ClothPriceRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<ClothPrice?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        _dbContext.ClothPrices.SingleOrDefaultAsync(c => c.Id == id, cancellationToken);

    public Task<ClothPrice?> GetByClothCodeAsync(string clothCode, CancellationToken cancellationToken) =>
        _dbContext.ClothPrices.SingleOrDefaultAsync(c => EF.Functions.ILike(c.ClothCode, clothCode), cancellationToken);

    public async Task<PagedResult<ClothPrice>> SearchAsync(string? searchTerm, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = _dbContext.ClothPrices.AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(c => EF.Functions.ILike(c.ClothCode, $"%{searchTerm}%"));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(c => c.ClothCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<ClothPrice>(items, page, pageSize, totalCount);
    }

    public async Task<IReadOnlyList<ClothPrice>> ListAllAsync(CancellationToken cancellationToken) =>
        await _dbContext.ClothPrices.OrderBy(c => c.ClothCode).ToListAsync(cancellationToken);

    public void Add(ClothPrice clothPrice) => _dbContext.ClothPrices.Add(clothPrice);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => _dbContext.SaveChangesAsync(cancellationToken);
}
