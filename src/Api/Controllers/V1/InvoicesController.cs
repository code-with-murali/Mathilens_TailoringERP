using MathilensERP.Api.Common;
using MathilensERP.Shared.Authorization;
using MathilensERP.Api.Contracts.Billing;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Application.Billing;
using MathilensERP.Application.Billing.Commands.Create;
using MathilensERP.Application.Billing.Commands.RecordPayment;
using MathilensERP.Application.Billing.Commands.Void;
using MathilensERP.Application.Billing.Queries.GetById;
using MathilensERP.Application.Billing.Queries.Search;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Domain.Billing;
using MathilensERP.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>Billing endpoints (00_MASTER_SPEC.md § 3, 02_DATABASE.md §§ 10.9-10.10). URL-segment versioned per § 8.2.</summary>
[ApiController]
[Route("api/v1/invoices")]
[Authorize(Policy = Permissions.InvoicesView)]
public sealed class InvoicesController : ApiControllerBase
{
    private readonly ISender _sender;

    public InvoicesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Issues a new invoice for an order.</summary>
    [HttpPost]
    [Authorize(Policy = Permissions.InvoicesManage)]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new CreateInvoiceCommand(request.OrderId, request.TaxAmount, request.DiscountAmount), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Returns a single invoice, with its payments, by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetInvoiceByIdQuery(id), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Searches invoices by customer and/or status, paginated (00_MASTER_SPEC.md § 8.3).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<InvoiceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] Guid? customerId,
        [FromQuery] InvoiceStatus? status,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new SearchInvoicesQuery(customerId, status, page, pageSize), cancellationToken);
        return ToPagedActionResult(result);
    }

    /// <summary>Records a payment against an invoice, supporting partial and multiple payments.</summary>
    [HttpPost("{id:guid}/payments")]
    [Authorize(Policy = Permissions.InvoicesManage)]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RecordPayment(Guid id, [FromBody] RecordPaymentRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new RecordPaymentCommand(id, request.Amount, request.Method), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Voids an unpaid invoice with no recorded payments.</summary>
    [HttpPost("{id:guid}/void")]
    [Authorize(Policy = Permissions.InvoicesManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Void(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new VoidInvoiceCommand(id), cancellationToken);
        return ToActionResult(result);
    }
}
