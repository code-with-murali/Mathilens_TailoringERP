using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Customers;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Customers.Commands.Update;

public sealed record UpdateCustomerCommand(
    Guid Id,
    string FullName,
    string PhoneNumber,
    string? Email,
    string? Address,
    string? Notes) : ICommand<Result<CustomerDto>>;
