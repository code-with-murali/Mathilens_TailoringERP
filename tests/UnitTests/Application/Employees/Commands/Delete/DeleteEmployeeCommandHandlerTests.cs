using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Employees;
using MathilensERP.Application.Employees.Commands.Delete;
using MathilensERP.Application.Orders;
using MathilensERP.Domain.Employees;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Employees.Commands.Delete;

public class DeleteEmployeeCommandHandlerTests
{
    private readonly IEmployeeRepository _employeeRepository = Substitute.For<IEmployeeRepository>();
    private readonly IOrderRepository _orderRepository = Substitute.For<IOrderRepository>();
    private readonly ICurrentUserService _currentUserService = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task Handle_WithExistingEmployee_SoftDeletesAndSavesChanges()
    {
        var employee = Employee.Create("EMP-001", "Ravi Kumar", null, null, null);
        _employeeRepository.GetByIdAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(employee);
        _orderRepository.ExistsForEmployeeAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(false);
        var callerId = Guid.NewGuid();
        _currentUserService.UserId.Returns(callerId);
        var handler = new DeleteEmployeeCommandHandler(_employeeRepository, _orderRepository, _currentUserService);

        var result = await handler.Handle(new DeleteEmployeeCommand(employee.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(employee.IsDeleted);
        Assert.Equal(callerId, employee.DeletedBy);
        await _employeeRepository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithUnknownEmployee_ReturnsNotFound()
    {
        _employeeRepository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Employee?)null);
        var handler = new DeleteEmployeeCommandHandler(_employeeRepository, _orderRepository, _currentUserService);

        var result = await handler.Handle(new DeleteEmployeeCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.NotFound", result.Error.Code);
        await _employeeRepository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithOrdersAssigned_RefusesAndLeavesTheEmployeeIntact()
    {
        var employee = Employee.Create("EMP-001", "Ravi Kumar", null, null, null);
        _employeeRepository.GetByIdAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(employee);
        _orderRepository.ExistsForEmployeeAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(true);
        var handler = new DeleteEmployeeCommandHandler(_employeeRepository, _orderRepository, _currentUserService);

        var result = await handler.Handle(new DeleteEmployeeCommand(employee.Id), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.AssignedToOrders", result.Error.Code);
        Assert.Equal("Employee is assigned to Orders.", result.Error.Message);
        Assert.False(employee.IsDeleted);
        await _employeeRepository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
