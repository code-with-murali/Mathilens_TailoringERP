using MathilensERP.Application.Common.Mediator;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees.Commands.Delete;

public sealed record DeleteEmployeeCommand(Guid Id) : ICommand<Result>;
