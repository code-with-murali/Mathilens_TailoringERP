using FluentValidation;
using MathilensERP.Application.Common;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Customers.Commands.Create;
using MathilensERP.Domain.Customers;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Customers.Commands.Import;

/// <summary>
/// Upserts a sheet of customers: a row is matched on its <c>Id</c> when the file came from an
/// export, otherwise on phone number — the same natural key the shop already treats as unique.
///
/// Every row is attempted; invalid ones are collected against their spreadsheet row number
/// rather than aborting the upload, so a 500-row file with three typos still lands 497 records
/// and hands back a short, actionable list.
/// </summary>
public sealed class ImportCustomersCommandHandler : ICommandHandler<ImportCustomersCommand, Result<ImportResultDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IValidator<CreateCustomerCommand> _rowValidator;

    public ImportCustomersCommandHandler(ICustomerRepository customerRepository, IValidator<CreateCustomerCommand> rowValidator)
    {
        _customerRepository = customerRepository;
        _rowValidator = rowValidator;
    }

    public async Task<Result<ImportResultDto>> Handle(ImportCustomersCommand command, CancellationToken cancellationToken)
    {
        var errors = new List<ImportRowErrorDto>();
        var created = 0;
        var updated = 0;

        // Rows added in this batch aren't visible to a repository query until SaveChanges, so
        // without this a file listing the same phone number twice would insert it twice.
        var addedThisBatch = new Dictionary<string, Customer>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in command.Rows)
        {
            // Reuses the create command's rules so the spreadsheet and the form can never drift apart.
            var candidate = new CreateCustomerCommand(row.FullName, row.PhoneNumber, row.Email, row.Address, row.Notes);
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
                    var customer = Customer.Create(row.FullName, row.PhoneNumber, row.Email, row.Address, row.Notes);
                    _customerRepository.Add(customer);
                    addedThisBatch[row.PhoneNumber] = customer;
                    created++;
                }
                else
                {
                    existing.UpdateDetails(row.FullName, row.PhoneNumber, row.Email, row.Address, row.Notes);
                    updated++;
                }
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
                // A domain guard the row validator doesn't cover. One bad row is a row error,
                // not a failed upload.
                errors.Add(new ImportRowErrorDto(row.RowNumber, ex.Message));
            }
        }

        if (created > 0 || updated > 0)
        {
            await _customerRepository.SaveChangesAsync(cancellationToken);
        }

        return Result.Success(new ImportResultDto(created, updated, errors));
    }

    private async Task<Customer?> FindExistingAsync(
        CustomerImportRow row,
        Dictionary<string, Customer> addedThisBatch,
        CancellationToken cancellationToken)
    {
        // An id that no longer resolves (stale export, since-deleted record) falls through to
        // the phone number rather than failing the row.
        if (row.Id is { } id && await _customerRepository.GetByIdAsync(id, cancellationToken) is { } byId)
        {
            return byId;
        }

        return addedThisBatch.TryGetValue(row.PhoneNumber, out var pending)
            ? pending
            : await _customerRepository.GetByPhoneNumberAsync(row.PhoneNumber, cancellationToken);
    }
}
