using MathilensERP.Application.Employees;
using MathilensERP.Application.Employees.Commands.Create;
using MathilensERP.Domain.Employees;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Employees.Commands.Create;

public class CreateEmployeeCommandHandlerTests
{
    [Fact]
    public async Task Handle_WithValidCommand_AddsEmployeeAndSavesChanges()
    {
        var repository = Substitute.For<IEmployeeRepository>();
        var handler = new CreateEmployeeCommandHandler(repository);
        var command = new CreateEmployeeCommand("EMP-001", "Ravi Kumar", "Master Tailor", "+91 98765 43210", "ravi@example.com");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Ravi Kumar", result.Value.FullName);
        Assert.Equal("Master Tailor", result.Value.JobTitle);
        repository.Received(1).Add(Arg.Any<Employee>());
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithEmployeeCodeAlreadyUsed_ReturnsConflictAndSavesNothing()
    {
        var existing = Employee.Create("EMP-001", "Ravi Kumar", null, null, null);
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByEmployeeCodeAsync("EMP-001", Arg.Any<CancellationToken>()).Returns(existing);
        var handler = new CreateEmployeeCommandHandler(repository);

        var result = await handler.Handle(
            new CreateEmployeeCommand("EMP-001", "Someone Else", null, null, null), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.DuplicateEmployeeCode", result.Error.Code);
        repository.DidNotReceive().Add(Arg.Any<Employee>());
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithPhoneNumberAlreadyUsed_ReturnsConflictAndSavesNothing()
    {
        var existing = Employee.Create("EMP-001", "Ravi Kumar", null, "+91 98765 43210", null);
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByPhoneNumberAsync("+91 98765 43210", Arg.Any<CancellationToken>()).Returns(existing);
        var handler = new CreateEmployeeCommandHandler(repository);

        var result = await handler.Handle(
            new CreateEmployeeCommand("EMP-002", "Someone Else", null, "+91 98765 43210", null), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.DuplicatePhoneNumber", result.Error.Code);
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithNoPhoneNumber_DoesNotLookForAPhoneClash()
    {
        var repository = Substitute.For<IEmployeeRepository>();
        var handler = new CreateEmployeeCommandHandler(repository);

        // "No phone recorded" is a state several employees may equally be in, so it must not be
        // compared at all — otherwise the second phone-less employee could never be added.
        var result = await handler.Handle(
            new CreateEmployeeCommand("EMP-002", "Meera S", null, null, null), CancellationToken.None);

        Assert.True(result.IsSuccess);
        await repository.DidNotReceive().GetByPhoneNumberAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
