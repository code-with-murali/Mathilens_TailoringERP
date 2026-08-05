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
        var employee = Employee.Create("Ravi Kumar", "Tailor", null, null);
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByIdAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(employee);
        var handler = new UpdateEmployeeCommandHandler(repository);
        var command = new UpdateEmployeeCommand(employee.Id, "Ravi K.", "Master Tailor", "+91 90000 00000", "ravi.k@example.com");

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
        var command = new UpdateEmployeeCommand(Guid.NewGuid(), "Ravi Kumar", null, null, null);

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.NotFound", result.Error.Code);
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
