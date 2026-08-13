using MathilensERP.Application.Employees;
using MathilensERP.Application.Employees.Commands.Update;
using MathilensERP.Domain.Employees;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Employees.Commands.Update;

public class UpdateEmployeeCommandHandlerTests
{
    [Fact]
    public async Task Handle_WithExistingEmployee_UpdatesAndSavesChanges()
    {
        var employee = Employee.Create("EMP-001", "Ravi Kumar", "Tailor", null, null);
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByIdAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(employee);
        var handler = new UpdateEmployeeCommandHandler(repository);
        var command = new UpdateEmployeeCommand(employee.Id, "EMP-001", "Ravi K.", "Master Tailor", "+91 90000 00000", "ravi.k@example.com");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Ravi K.", result.Value.FullName);
        Assert.Equal("Master Tailor", result.Value.JobTitle);
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithUnknownEmployee_ReturnsNotFound()
    {
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Employee?)null);
        var handler = new UpdateEmployeeCommandHandler(repository);
        var command = new UpdateEmployeeCommand(Guid.NewGuid(), "EMP-001", "Ravi Kumar", null, null, null);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.NotFound", result.Error.Code);
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithCodeBelongingToAnotherEmployee_ReturnsConflict()
    {
        var employee = Employee.Create("EMP-001", "Ravi Kumar", null, null, null);
        var other = Employee.Create("EMP-002", "Meera S", null, null, null);
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByIdAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(employee);
        repository.GetByEmployeeCodeAsync("EMP-002", Arg.Any<CancellationToken>()).Returns(other);
        var handler = new UpdateEmployeeCommandHandler(repository);

        var result = await handler.Handle(
            new UpdateEmployeeCommand(employee.Id, "EMP-002", "Ravi Kumar", null, null, null), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.DuplicateEmployeeCode", result.Error.Code);
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_KeepingItsOwnCodeAndPhoneNumber_IsNotTreatedAsADuplicate()
    {
        var employee = Employee.Create("EMP-001", "Ravi Kumar", null, "+91 98765 43210", null);
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByIdAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(employee);
        // Both lookups find the employee being edited — neither is a clash with itself.
        repository.GetByEmployeeCodeAsync("EMP-001", Arg.Any<CancellationToken>()).Returns(employee);
        repository.GetByPhoneNumberAsync("+91 98765 43210", Arg.Any<CancellationToken>()).Returns(employee);
        var handler = new UpdateEmployeeCommandHandler(repository);

        var result = await handler.Handle(
            new UpdateEmployeeCommand(employee.Id, "EMP-001", "Ravi K.", "Master Tailor", "+91 98765 43210", null),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Ravi K.", result.Value.FullName);
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
