using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees;

/// <summary>
/// The "one code, one phone, one person" rule, shared by the create and update handlers so the
/// two can't drift apart. Returns the <see cref="Error"/> to fail with, or <c>null</c> when the
/// details are free to use.
/// </summary>
internal static class EmployeeUniqueness
{
    public static async Task<Error?> FindConflictAsync(
        IEmployeeRepository employeeRepository,
        string employeeCode,
        string? phoneNumber,
        Guid? excludeId,
        CancellationToken cancellationToken)
    {
        var code = employeeCode?.Trim() ?? string.Empty;
        if (code.Length > 0)
        {
            var byCode = await employeeRepository.GetByEmployeeCodeAsync(code, cancellationToken);
            if (byCode is not null && byCode.Id != excludeId)
            {
                return Error.Conflict(
                    "Employee.DuplicateEmployeeCode",
                    $"Employee code '{code}' is already used by {byCode.FullName}.");
            }
        }

        // A blank phone number means "not recorded", which several employees may equally share.
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            return null;
        }

        var byPhone = await employeeRepository.GetByPhoneNumberAsync(phoneNumber.Trim(), cancellationToken);
        if (byPhone is not null && byPhone.Id != excludeId)
        {
            return Error.Conflict(
                "Employee.DuplicatePhoneNumber",
                $"An employee with mobile number '{phoneNumber.Trim()}' already exists ({byPhone.FullName}).");
        }

        return null;
    }
}
