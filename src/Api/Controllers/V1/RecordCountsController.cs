using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Shared.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>
/// The numbers on the menu badges.
/// </summary>
[ApiController]
[Route("api/v1/record-counts")]
[Authorize]
public sealed class RecordCountsController : ApiControllerBase
{
    /// <summary>
    /// Which right a count needs. A count is a fact about data, so seeing one requires the same
    /// permission as seeing the screen it counts — otherwise the badge tells a Tailor how many
    /// users exist, which is a thing the Users screen is careful not to tell them.
    /// </summary>
    private static readonly IReadOnlyList<(string Key, string Permission)> Guarded =
    [
        (RecordCountKeys.Orders, Permissions.OrdersView),
        (RecordCountKeys.Customers, Permissions.CustomersView),
        (RecordCountKeys.Invoices, Permissions.InvoicesView),
        (RecordCountKeys.FabricPrices, Permissions.PricingView),
        (RecordCountKeys.ClothReceipts, Permissions.InventoryView),
        (RecordCountKeys.Employees, Permissions.EmployeesView),
        (RecordCountKeys.Users, Permissions.UsersView),
    ];

    private readonly IRecordCountService _recordCounts;
    private readonly IAuthorizationService _authorization;

    public RecordCountsController(IRecordCountService recordCounts, IAuthorizationService authorization)
    {
        _recordCounts = recordCounts;
        _authorization = authorization;
    }

    /// <summary>
    /// How many records each list screen holds, for the menu badges — only for the screens this
    /// caller may open.
    ///
    /// <para>Needs no permission of its own beyond being signed in: it answers with nothing at all
    /// for someone who may see nothing, so a right to ask is a right to be told "no counts".</para>
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyDictionary<string, int>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var allowed = new List<string>(Guarded.Count);
        foreach (var (key, permission) in Guarded)
        {
            // Through the same policies the endpoints themselves are guarded by, rather than a
            // second copy of the rules — a permission renamed in one place would otherwise keep
            // answering here.
            var result = await _authorization.AuthorizeAsync(User, null, permission);
            if (result.Succeeded)
            {
                allowed.Add(key);
            }
        }

        var counts = await _recordCounts.GetCountsAsync(allowed, cancellationToken);
        return Ok(ApiResponse<IReadOnlyDictionary<string, int>>.Ok(counts));
    }
}
