using MathilensERP.Domain.Settings;
using MathilensERP.Shared.Pagination;

namespace MathilensERP.Application.Settings;

/// <summary>Repository port for <see cref="Setting"/> (01_ARCHITECTURE.md § 25.1 Repository Pattern) — keyed by <see cref="Setting.Key"/>, its natural identifier.</summary>
public interface ISettingRepository
{
    Task<Setting?> GetByKeyAsync(string key, CancellationToken cancellationToken);

    Task<PagedResult<Setting>> ListAsync(int page, int pageSize, CancellationToken cancellationToken);

    void Add(Setting setting);

    void Remove(Setting setting);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
