using MathilensERP.Api.Common;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Api.Contracts.Pricing;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Pricing;
using MathilensERP.Application.Pricing.Commands.Create;
using MathilensERP.Application.Pricing.Commands.Delete;
using MathilensERP.Application.Pricing.Commands.Update;
using MathilensERP.Application.Pricing.Queries.GetById;
using MathilensERP.Application.Pricing.Queries.Search;
using MathilensERP.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>Price list endpoints — one unit price per cloth code, looked up on the New Order screen. URL-segment versioned per 00_MASTER_SPEC.md § 8.2.</summary>
[ApiController]
[Route("api/v1/cloth-prices")]
[Authorize]
public sealed class ClothPricesController : ApiControllerBase
{
    private readonly ISender _sender;

    public ClothPricesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Creates a new cloth price entry.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ClothPriceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateClothPriceRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateClothPriceCommand(request.ClothCode, request.ClothName, request.CostPrice, request.SellingPrice);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Returns a single cloth price entry by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ClothPriceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetClothPriceByIdQuery(id), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Searches cloth prices by code, paginated (00_MASTER_SPEC.md § 8.3).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ClothPriceDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? search,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new SearchClothPricesQuery(search, page, pageSize), cancellationToken);
        return ToPagedActionResult(result);
    }

    /// <summary>Updates an existing cloth price entry.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<ClothPriceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClothPriceRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateClothPriceCommand(id, request.ClothCode, request.ClothName, request.CostPrice, request.SellingPrice);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Soft-deletes a cloth price entry.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteClothPriceCommand(id), cancellationToken);
        return ToActionResult(result);
    }
}
