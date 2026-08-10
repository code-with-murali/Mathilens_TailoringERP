using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Employees;
using MathilensERP.Application.Orders;
using MathilensERP.Shared.Constants;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Employees.Commands.Delete;

/// <summary>
/// An employee assigned to any order is part of that order's record — who did the work. Deleting
/// them would leave orders pointing at nobody, so a staff member who has left is kept rather than
/// removed.
/// </summary>
public sealed class DeleteEmployeeCommandHandler : ICommandHandler<DeleteEmployeeCommand, Result>
{
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteEmployeeCommandHandler(
        IEmployeeRepository employeeRepository,
        IOrderRepository orderRepository,
        ICurrentUserService currentUserService)
    {
        _employeeRepository = employeeRepository;
        _orderRepository = orderRepository;
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

        if (await _orderRepository.ExistsForEmployeeAsync(command.Id, cancellationToken))
        {
            return Result.Failure(Error.Conflict("Employee.AssignedToOrders", "Employee is assigned to Orders."));
        }

        var deletedBy = _currentUserService.UserId ?? SystemUsers.SystemUserId;
        employee.SoftDelete(deletedBy, DateTime.UtcNow);

        await _employeeRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
