using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Customers;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Customers.Commands.Create;

public sealed record CreateCustomerCommand(
    string FullName,
    string PhoneNumber,
    string? Email,
    string? Address,
    string? Notes) : ICommand<Result<CustomerDto>>;
