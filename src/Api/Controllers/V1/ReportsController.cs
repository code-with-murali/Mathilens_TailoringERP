using MathilensERP.Api.Common;
using MathilensERP.Shared.Authorization;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Reports;
using MathilensERP.Application.Reports.Queries.OrderCollections;
using MathilensERP.Application.Reports.Queries.OrderStatusSummary;
using MathilensERP.Application.Reports.Queries.OutstandingInvoices;
using MathilensERP.Application.Reports.Queries.Revenue;
using MathilensERP.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>Operational and business reporting endpoints (00_MASTER_SPEC.md § 3, 01_ARCHITECTURE.md § 20). URL-segment versioned per § 8.2.</summary>
[ApiController]
[Route("api/v1/reports")]
[Authorize(Policy = Permissions.ReportsView)]
public sealed class ReportsController : ApiControllerBase
{
    private readonly ISender _sender;

    public ReportsController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Total invoiced, collected, and outstanding amounts for invoices created within a date range.</summary>
    [HttpGet("revenue")]
    [ProducesResponseType(typeof(ApiResponse<RevenueReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Revenue([FromQuery] DateTime fromUtc, [FromQuery] DateTime toUtc, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetRevenueReportQuery(fromUtc, toUtc), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>
    /// The money position on orders booked within a date range — order value, delivered value,
    /// collected, still pending, cancelled value and discounts given. Unlike <see cref="Revenue"/>
    /// this counts order value rather than invoiced value, so work that was never billed is included.
    /// </summary>
    [HttpGet("order-collections")]
    [ProducesResponseType(typeof(ApiResponse<OrderCollectionsReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> OrderCollections([FromQuery] DateTime fromUtc, [FromQuery] DateTime toUtc, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetOrderCollectionsReportQuery(fromUtc, toUtc), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Order counts by status for orders created within a date range.</summary>
    [HttpGet("order-status-summary")]
    [ProducesResponseType(typeof(ApiResponse<OrderStatusSummaryReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> OrderStatusSummary([FromQuery] DateTime fromUtc, [FromQuery] DateTime toUtc, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetOrderStatusSummaryReportQuery(fromUtc, toUtc), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Unpaid/partially-paid invoices, oldest first, paginated (00_MASTER_SPEC.md § 8.3).</summary>
    [HttpGet("outstanding-invoices")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OutstandingInvoiceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> OutstandingInvoices(
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetOutstandingInvoicesReportQuery(page, pageSize), cancellationToken);
        return ToPagedActionResult(result);
    }
}
