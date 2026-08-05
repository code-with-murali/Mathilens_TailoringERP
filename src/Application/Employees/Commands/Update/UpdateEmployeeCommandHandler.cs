using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Employees;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees.Commands.Update;

public sealed class UpdateEmployeeCommandHandler : ICommandHandler<UpdateEmployeeCommand, Result<EmployeeDto>>
{
    private readonly IEmployeeRepository _employeeRepository;

    public UpdateEmployeeCommandHandler(IEmployeeRepository employeeRepository)
    {
        _employeeRepository = employeeRepository;
    }

    public async Task<Result<EmployeeDto>> Handle(UpdateEmployeeCommand command, CancellationToken cancellationToken)
    {
        var employee = await _employeeRepository.GetByIdAsync(command.Id, cancellationToken);
        if (employee is null)
        {
            return Result.Failure<EmployeeDto>(
                Error.NotFound("Employee.NotFound", $"No employee was found with id '{command.Id}'."));
        }

        employee.UpdateDetails(command.FullName, command.JobTitle, command.PhoneNumber, command.Email);
        await _employeeRepository.SaveChangesAsync(cancellationToken);

        return employee.ToDto();
    }
}
