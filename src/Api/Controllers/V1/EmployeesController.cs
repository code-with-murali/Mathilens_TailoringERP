using MathilensERP.Api.Common;
using MathilensERP.Shared.Authorization;
using MathilensERP.Api.Common.Excel;
using MathilensERP.Api.Contracts.Common;
using MathilensERP.Api.Contracts.Employees;
using MathilensERP.Application.Common;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Employees;
using MathilensERP.Application.Employees.Commands.Create;
using MathilensERP.Application.Employees.Commands.Delete;
using MathilensERP.Application.Employees.Commands.Import;
using MathilensERP.Application.Employees.Commands.Update;
using MathilensERP.Application.Employees.Queries.GetById;
using MathilensERP.Application.Employees.Queries.ListAll;
using MathilensERP.Application.Employees.Queries.Search;
using MathilensERP.Shared.Constants;
using MathilensERP.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MathilensERP.Api.Controllers.V1;

/// <summary>Employee management endpoints (00_MASTER_SPEC.md § 3, 02_DATABASE.md § 10.6). URL-segment versioned per § 8.2.</summary>
[ApiController]
[Route("api/v1/employees")]
[Authorize(Policy = Permissions.EmployeesView)]
public sealed class EmployeesController : ApiControllerBase
{
    private readonly ISender _sender;

    public EmployeesController(ISender sender)
    {
        _sender = sender;
    }

    /// <summary>Downloads every employee as an .xlsx sheet. The Id column round-trips back through <see cref="Import"/> as the match key.</summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> Export(CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new ListAllEmployeesQuery(), cancellationToken);
        if (result.IsFailure)
        {
            return ToActionResult(result);
        }

        var content = ExcelSheet.Write(
            "Employees",
            EmployeeSheet.Headers,
            result.Value.Select(e => new object?[] { e.Id, e.FullName, e.JobTitle, e.PhoneNumber, e.Email }));

        return File(content, ExcelSheet.ContentType, "employees.xlsx");
    }

    /// <summary>
    /// Upserts employees from an .xlsx sheet — matched on Id, else phone number. A row with no
    /// phone number and no Id has nothing to match on and is always inserted.
    /// </summary>
    [HttpPost("import")]
    [Authorize(Policy = Permissions.EmployeesManage)]
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

        var command = new ImportEmployeesCommand(rows
            .Select(r => new EmployeeImportRow(
                r.RowNumber,
                r.GetGuid(EmployeeSheet.Id),
                r.GetRequiredString(EmployeeSheet.FullName),
                r.GetString(EmployeeSheet.JobTitle),
                r.GetString(EmployeeSheet.PhoneNumber),
                r.GetString(EmployeeSheet.Email)))
            .ToList());

        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Creates a new employee.</summary>
    [HttpPost]
    [Authorize(Policy = Permissions.EmployeesManage)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateEmployeeCommand(request.FullName, request.JobTitle, request.PhoneNumber, request.Email);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Returns a single employee by id.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new GetEmployeeByIdQuery(id), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Searches employees by name/phone number, paginated (00_MASTER_SPEC.md § 8.3).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<EmployeeDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? search,
        [FromQuery] int page = PaginationDefaults.DefaultPage,
        [FromQuery] int pageSize = PaginationDefaults.DefaultPageSize,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new SearchEmployeesQuery(search, page, pageSize), cancellationToken);
        return ToPagedActionResult(result);
    }

    /// <summary>Updates an existing employee's details.</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.EmployeesManage)]
    [ProducesResponseType(typeof(ApiResponse<EmployeeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateEmployeeCommand(id, request.FullName, request.JobTitle, request.PhoneNumber, request.Email);
        var result = await _sender.Send(command, cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Soft-deletes an employee.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.EmployeesManage)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _sender.Send(new DeleteEmployeeCommand(id), cancellationToken);
        return ToActionResult(result);
    }
}
