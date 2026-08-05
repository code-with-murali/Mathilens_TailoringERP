namespace MathilensERP.Api.Contracts.Customers;

public sealed record UpdateCustomerRequest(string FullName, string PhoneNumber, string? Email, string? Address, string? Notes);
