namespace MathilensERP.Application.Common.Interfaces;

/// <summary>
/// How many records each list-backed screen holds, for the badges on the menu.
///
/// <para>One call rather than a count per screen: the menu is drawn once on every page, and seven
/// separate round trips to render seven numbers would cost more than the numbers are worth.</para>
///
/// <para>Counts respect the soft-delete filter, like every other read — a deleted customer is not
/// one the shop has.</para>
/// </summary>
public interface IRecordCountService
{
    /// <summary>
    /// Every count, keyed by the screen it belongs to — see <see cref="RecordCountKeys"/>.
    ///
    /// A dictionary rather than a property each, so a screen added to the menu later needs a key
    /// here and nothing else: no contract change, no frontend type change, no migration.
    /// </summary>
    Task<IReadOnlyDictionary<string, int>> GetCountsAsync(
        IReadOnlyCollection<string> keys,
        CancellationToken cancellationToken);
}

/// <summary>
/// The keys a count can be asked for. Shared so the controller, the service and the frontend all
/// spell them the same way — a typo here is a badge that silently never appears.
/// </summary>
public static class RecordCountKeys
{
    public const string Orders = "orders";
    public const string Customers = "customers";
    public const string Invoices = "invoices";
    public const string FabricPrices = "fabricPrices";
    public const string ClothReceipts = "clothReceipts";
    public const string Employees = "employees";
    public const string Users = "users";

    public static readonly IReadOnlyList<string> All =
        [Orders, Customers, Invoices, FabricPrices, ClothReceipts, Employees, Users];
}
