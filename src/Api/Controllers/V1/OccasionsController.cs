using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Api.Contracts.Occasions;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Occasions;
using MathilensERP.Application.Occasions.Commands.RecordContact;
using MathilensERP.Application.Occasions.Queries.Search;
using MathilensERP.Domain.Customers;
using MathilensERP.Shared.Authorization;
using MathilensERP.Shared.Constants;
using MathilensERP.Shared.Pagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>
/// Birthdays and wedding anniversaries coming up, and the shop's record of following them up.
///
/// Reads sit behind Reports.View, matching where these appear in the app. Recording a contact is
/// behind Customers.Manage instead: it writes to the customer relationship rather than to a report,
/// and reading a figure and acting on a customer are not the same privilege.
/// </summary>
[ApiController]
[Route("api/v1/occasions")]
[Authorize(Policy = Permissions.ReportsView)]
public sealed class OccasionsController : ApiControllerBase
{
    /// <summary>
    /// The shop asked for thirty days either way. Bounded rather than free: an unbounded window
    /// turns this into "every customer with a date on file", which is the customer list, not a
    /// call sheet.
    /// </summary>
    private const int DefaultWindowDays = 30;
    private const int MaxWindowDays = 365;

    private readonly ISender _sender;

    public OccasionsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Occasions inside the window — upcoming and not yet contacted, or already contacted.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<OccasionRowDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] OccasionType occasion,
        [FromQuery] OccasionScope scope = OccasionScope.Upcoming,
        [FromQuery] int windowDays = DefaultWindowDays,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var window = Math.Clamp(windowDays, 1, MaxWindowDays);

        var result = await _sender.Send(new SearchOccasionsQuery(occasion, scope, window, page, pageSize), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Marks an occasion as followed up, or amends the remarks if it was already marked.</summary>
    [HttpPost("contacts")]
    [Authorize(Policy = Permissions.CustomersManage)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecordContact([FromBody] RecordOccasionContactRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(
            new RecordOccasionContactCommand(
                request.CustomerId,
                request.Occasion,
                request.OccasionYear,
                request.ContactedOn,
                request.Remarks),
            cancellationToken);

        return ToActionResult(result);
    }
}
