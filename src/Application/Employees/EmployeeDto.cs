namespace MathilensERP.Application.Employees;

public sealed record EmployeeDto(
    Guid Id,
    string EmployeeCode,
    string FullName,
    string? JobTitle,
    string? PhoneNumber,
    string? Email,
    DateTime CreatedAtUtc);
