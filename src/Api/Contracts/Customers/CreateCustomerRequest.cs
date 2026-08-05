namespace MathilensERP.Api.Contracts.Customers;

public sealed record CreateCustomerRequest(string FullName, string PhoneNumber, string? Email, string? Address, string? Notes);
