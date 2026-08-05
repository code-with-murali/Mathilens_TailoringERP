using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Api.Contracts.Orders;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Application.Orders.Commands.AddItem;
using MathilensERP.Application.Orders.Commands.AssignEmployee;
using MathilensERP.Application.Orders.Commands.Create;
using MathilensERP.Application.Orders.Commands.SetItemFabric;
using MathilensERP.Application.Orders.Commands.TransitionStatus;
using MathilensERP.Application.Orders.Queries.GetById;
using MathilensERP.Application.Orders.Queries.Search;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>Tailoring order endpoints (00_MASTER_SPEC.md § 3, 02_DATABASE.md §§ 10.7-10.8, 10.11). URL-segment versioned per § 8.2.</summary>
[ApiController]
[Route("api/v1/orders")]
[Authorize]
public sealed class OrdersController : ApiControllerBase
{
    private readonly ISender _sender;

    public OrdersController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Creates a new order with its initial garment items (and, optionally, their fabric details).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var items = request.Items
            .Select(i => new CreateOrderItemInput(
                i.GarmentType,
                i.Quantity,
                i.UnitPrice,
                i.Fabric is null ? null : new CreateOrderItemFabricInput(i.Fabric.FabricType, i.Fabric.Source, i.Fabric.Color, i.Fabric.Quantity)))
            .ToList();

        var command = new CreateOrderCommand(request.CustomerId, request.EmployeeId, request.DueAtUtc, items);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Returns a single order, with its items and their fabric details, by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetOrderByIdQuery(id), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Searches orders by customer and/or status, paginated (00_MASTER_SPEC.md § 8.3).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<OrderDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] Guid? customerId,
        [FromQuery] OrderStatus? status,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new SearchOrdersQuery(customerId, status, page, pageSize), cancellationToken);
        return ToPagedActionResult(result);
    }

    /// <summary>Adds a garment item to an existing (not yet delivered/cancelled) order.</summary>
    [HttpPost("{id:guid}/items")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddItem(Guid id, [FromBody] AddOrderItemRequest request, CancellationToken cancellationToken)
    {
        var command = new AddOrderItemCommand(id, request.GarmentType, request.Quantity, request.UnitPrice);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Sets (or replaces) the fabric details for one of an order's items.</summary>
    [HttpPut("{id:guid}/items/{itemId:guid}/fabric")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SetItemFabric(Guid id, Guid itemId, [FromBody] SetOrderItemFabricRequest request, CancellationToken cancellationToken)
    {
        var command = new SetOrderItemFabricCommand(id, itemId, request.FabricType, request.Source, request.Color, request.Quantity);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Advances an order's status (02_DATABASE.md § 10.7 — an enforced lifecycle; invalid transitions return 409).</summary>
    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> TransitionStatus(Guid id, [FromBody] TransitionOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new TransitionOrderStatusCommand(id, request.TargetStatus), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Assigns (or reassigns) the employee responsible for an order.</summary>
    [HttpPut("{id:guid}/employee")]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignEmployee(Guid id, [FromBody] AssignOrderEmployeeRequest request, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new AssignOrderEmployeeCommand(id, request.EmployeeId), cancellationToken);
        return ToActionResult(result);
    }
}
