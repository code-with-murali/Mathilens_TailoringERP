namespace MathilensERP.Api.Contracts.Employees;

public sealed record CreateEmployeeRequest(string FullName, string? JobTitle, string? PhoneNumber, string? Email);
