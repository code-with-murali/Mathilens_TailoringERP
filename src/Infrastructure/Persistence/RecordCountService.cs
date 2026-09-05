using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace MathilensERP.Infrastructure.Persistence;

/// <summary>
/// Counts straight off the context, one query per requested key.
///
/// <para>Only the keys the caller asked for are counted. The controller drops the ones the user has
/// no right to see before calling, so a count that will not be shown is never even run — which
/// keeps this cheap for a Tailor, whose menu is four items long.</para>
///
/// <para>Every count goes through the global soft-delete filter, so these agree with what the list
/// screens themselves show. That is the whole requirement: a badge that disagrees with the page it
/// points at is worse than no badge.</para>
/// </summary>
public sealed class RecordCountService : IRecordCountService
{
    private readonly ApplicationDbContext _dbContext;

    public RecordCountService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyDictionary<string, int>> GetCountsAsync(
        IReadOnlyCollection<string> keys,
        CancellationToken cancellationToken)
    {
        var counts = new Dictionary<string, int>(StringComparer.Ordinal);

        foreach (var key in keys)
        {
            // Sequential rather than concurrent: a DbContext is not thread-safe, and running these
            // in parallel on one context is the classic way to get "a second operation was started
            // on this context" in production and never in testing.
            var count = key switch
            {
                RecordCountKeys.Orders => await _dbContext.Orders.CountAsync(cancellationToken),
                RecordCountKeys.Customers => await _dbContext.Customers.CountAsync(cancellationToken),
                RecordCountKeys.Invoices => await _dbContext.Invoices.CountAsync(cancellationToken),
                RecordCountKeys.FabricPrices => await _dbContext.ClothPrices.CountAsync(cancellationToken),
                RecordCountKeys.ClothReceipts => await _dbContext.ClothReceipts.CountAsync(cancellationToken),
                RecordCountKeys.Employees => await _dbContext.Employees.CountAsync(cancellationToken),
                RecordCountKeys.Users => await _dbContext.Set<ApplicationUser>().CountAsync(cancellationToken),
                // An unknown key is ignored rather than thrown: this list comes from the menu, and a
                // screen added there before a count exists for it should render without a badge, not
                // take the whole menu down.
                _ => -1,
            };

            if (count >= 0)
            {
                counts[key] = count;
            }
        }

        return counts;
    }
}
