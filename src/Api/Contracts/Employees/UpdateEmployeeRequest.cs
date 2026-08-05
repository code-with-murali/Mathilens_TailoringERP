namespace MathilensERP.Api.Contracts.Employees;

public sealed record UpdateEmployeeRequest(string FullName, string? JobTitle, string? PhoneNumber, string? Email);
