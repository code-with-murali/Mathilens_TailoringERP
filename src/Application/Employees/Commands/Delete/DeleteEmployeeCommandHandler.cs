using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Employees;
using MathilensERP.Shared.Constants;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees.Commands.Delete;

public sealed class DeleteEmployeeCommandHandler : ICommandHandler<DeleteEmployeeCommand, Result>
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteEmployeeCommandHandler(IEmployeeRepository employeeRepository, ICurrentUserService currentUserService)
    {
        _employeeRepository = employeeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(DeleteEmployeeCommand command, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepository.GetByIdAsync(command.Id, cancellationToken);
        if (employee is null)
        {
            return Result.Failure(
                Error.NotFound("Employee.NotFound", $"No employee was found with id '{command.Id}'."));
        }

        var deletedBy = _currentUserService.UserId ?? SystemUsers.SystemUserId;
        employee.SoftDelete(deletedBy, DateTime.UtcNow);

        await _employeeRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
