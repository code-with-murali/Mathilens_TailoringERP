namespace MathilensERP.Application.Customers;

public sealed record CustomerDto(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? Email,
    string? Address,
    string? Notes,
    DateTime CreatedAtUtc);
