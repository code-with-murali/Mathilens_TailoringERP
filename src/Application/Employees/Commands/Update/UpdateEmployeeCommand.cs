using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Employees;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees.Commands.Update;

public sealed record UpdateEmployeeCommand(Guid Id, string FullName, string? JobTitle, string? PhoneNumber, string? Email) : ICommand<Result<EmployeeDto>>;
