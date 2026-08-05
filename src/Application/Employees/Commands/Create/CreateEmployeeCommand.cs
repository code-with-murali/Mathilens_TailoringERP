using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Employees;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees.Commands.Create;

public sealed record CreateEmployeeCommand(string FullName, string? JobTitle, string? PhoneNumber, string? Email) : ICommand<Result<EmployeeDto>>;
