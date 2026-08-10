using MathilensERP.Api.Common;
using MathilensERP.Api.Common.Excel;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Api.Contracts.Customers;
using MathilensERP.Application.Common;
using MathilensERP.Application.Customers;
using MathilensERP.Application.Customers.Commands.Create;
using MathilensERP.Application.Customers.Commands.Delete;
using MathilensERP.Application.Customers.Commands.Import;
using MathilensERP.Application.Customers.Commands.Update;
using MathilensERP.Application.Customers.Queries.GetById;
using MathilensERP.Application.Customers.Queries.ListAll;
using MathilensERP.Application.Customers.Queries.Search;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Shared.Constants;
using MathilensERP.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>Customer management endpoints (00_MASTER_SPEC.md § 3, 02_DATABASE.md § 10.3). URL-segment versioned per § 8.2.</summary>
[ApiController]
[Route("api/v1/customers")]
[Authorize]
public sealed class CustomersController : ApiControllerBase
{
    private readonly ISender _sender;

    public CustomersController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Creates a new customer.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateCustomerCommand(request.FullName, request.PhoneNumber, request.Email, request.Address, request.Notes);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Returns a single customer by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetCustomerByIdQuery(id), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Searches customers by name/phone number, paginated (00_MASTER_SPEC.md § 8.3).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<CustomerDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? search,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new SearchCustomersQuery(search, page, pageSize), cancellationToken);
        return ToPagedActionResult(result);
    }

    /// <summary>Downloads every customer as an .xlsx sheet. The Id column round-trips back through <see cref="Import"/> as the match key.</summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Export(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListAllCustomersQuery(), cancellationToken);
        if (result.IsFailure)
        {
            return ToActionResult(result);
        }

        var content = ExcelSheet.Write(
            "Customers",
            CustomerSheet.Headers,
            result.Value.Select(c => new object?[] { c.Id, c.FullName, c.PhoneNumber, c.Email, c.Address, c.Notes }));

        return File(content, ExcelSheet.ContentType, "customers.xlsx");
    }

    /// <summary>
    /// Upserts customers from an .xlsx sheet — matched on Id, else phone number. Partial success:
    /// valid rows are saved and invalid ones come back listed by their row number.
    /// </summary>
    [HttpPost("import")]
    [RequestSizeLimit(ImportLimits.MaxFileBytes)]
    [ProducesResponseType(typeof(ApiResponse<ImportResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Import(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return ToActionResult(Result.Failure<ImportResultDto>(
                Error.Validation("Import.NoFile", "Select an .xlsx file to import.")));
        }

        IReadOnlyList<ExcelRow> rows;
        try
        {
            await using var stream = file.OpenReadStream();
            rows = ExcelSheet.Read(stream);
        }
        catch (InvalidDataException ex)
        {
            return ToActionResult(Result.Failure<ImportResultDto>(Error.Validation("Import.InvalidFile", ex.Message)));
        }

        var command = new ImportCustomersCommand(rows
            .Select(r => new CustomerImportRow(
                r.RowNumber,
                r.GetGuid(CustomerSheet.Id),
                r.GetRequiredString(CustomerSheet.FullName),
                r.GetRequiredString(CustomerSheet.PhoneNumber),
                r.GetString(CustomerSheet.Email),
                r.GetString(CustomerSheet.Address),
                r.GetString(CustomerSheet.Notes)))
            .ToList());

        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Updates an existing customer's details.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateCustomerCommand(id, request.FullName, request.PhoneNumber, request.Email, request.Address, request.Notes);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Soft-deletes a customer.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteCustomerCommand(id), cancellationToken);
        return ToActionResult(result);
    }
}
