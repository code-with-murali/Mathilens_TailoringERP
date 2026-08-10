using FluentValidation;
using MathilensERP.Application.Common;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Employees.Commands.Create;
using MathilensERP.Domain.Employees;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees.Commands.Import;

/// <summary>
/// Upserts a sheet of employees. Unlike customers, an employee's phone number is optional, so
/// a row without one has no natural key to match on and is always treated as a new employee —
/// re-importing such a file would duplicate them. Round-tripping through the export (which
/// carries the Id column) is the reliable way to edit phone-less staff in bulk.
/// </summary>
public sealed class ImportEmployeesCommandHandler : ICommandHandler<ImportEmployeesCommand, Result<ImportResultDto>>
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IValidator<CreateEmployeeCommand> _rowValidator;

    public ImportEmployeesCommandHandler(IEmployeeRepository employeeRepository, IValidator<CreateEmployeeCommand> rowValidator)
    {
        _employeeRepository = employeeRepository;
        _rowValidator = rowValidator;
    }

    public async Task<Result<ImportResultDto>> Handle(ImportEmployeesCommand command, CancellationToken cancellationToken)
    {
        var errors = new List<ImportRowErrorDto>();
        var created = 0;
        var updated = 0;

        // Rows added in this batch aren't visible to a repository query until SaveChanges.
        var addedThisBatch = new Dictionary<string, Employee>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in command.Rows)
        {
            // Reuses the create command's rules so the spreadsheet and the form can never drift apart.
            var candidate = new CreateEmployeeCommand(row.FullName, row.JobTitle, row.PhoneNumber, row.Email);
            var validation = await _rowValidator.ValidateAsync(candidate, cancellationToken);
            if (!validation.IsValid)
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, string.Join(" ", validation.Errors.Select(e => e.ErrorMessage))));
                continue;
            }

            try
            {
                var existing = await FindExistingAsync(row, addedThisBatch, cancellationToken);

                if (existing is null)
                {
                    var employee = Employee.Create(row.FullName, row.JobTitle, row.PhoneNumber, row.Email);
                    _employeeRepository.Add(employee);
                    if (!string.IsNullOrWhiteSpace(row.PhoneNumber))
                    {
                        addedThisBatch[row.PhoneNumber] = employee;
                    }

                    created++;
                }
                else
                {
                    existing.UpdateDetails(row.FullName, row.JobTitle, row.PhoneNumber, row.Email);
                    updated++;
                }
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, ex.Message));
            }
        }

        if (created > 0 || updated > 0)
        {
            await _employeeRepository.SaveChangesAsync(cancellationToken);
        }

        return Result.Success(new ImportResultDto(created, updated, errors));
    }

    private async Task<Employee?> FindExistingAsync(
        EmployeeImportRow row,
        Dictionary<string, Employee> addedThisBatch,
        CancellationToken cancellationToken)
    {
        // An id that no longer resolves (stale export, since-deleted record) falls through to
        // the phone number rather than failing the row.
        if (row.Id is { } id && await _employeeRepository.GetByIdAsync(id, cancellationToken) is { } byId)
        {
            return byId;
        }

        if (string.IsNullOrWhiteSpace(row.PhoneNumber))
        {
            return null;
        }

        return addedThisBatch.TryGetValue(row.PhoneNumber, out var pending)
            ? pending
            : await _employeeRepository.GetByPhoneNumberAsync(row.PhoneNumber, cancellationToken);
    }
}
