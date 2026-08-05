using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Employees;
using MathilensERP.Domain.Employees;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees.Commands.Create;

public sealed class CreateEmployeeCommandHandler : ICommandHandler<CreateEmployeeCommand, Result<EmployeeDto>>
{
    private readonly IEmployeeRepository _employeeRepository;

    public CreateEmployeeCommandHandler(IEmployeeRepository employeeRepository)
    {
        _employeeRepository = employeeRepository;
    }

    public async Task<Result<EmployeeDto>> Handle(CreateEmployeeCommand command, CancellationToken cancellationToken)
    {
        var employee = Employee.Create(command.FullName, command.JobTitle, command.PhoneNumber, command.Email);

        _employeeRepository.Add(employee);
        await _employeeRepository.SaveChangesAsync(cancellationToken);

        return employee.ToDto();
    }
}
