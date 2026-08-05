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
        var command = new CreateEmployeeCommand("Ravi Kumar", "Master Tailor", "+91 98765 43210", "ravi@example.com");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Ravi Kumar", result.Value.FullName);
        Assert.Equal("Master Tailor", result.Value.JobTitle);
        repository.Received(1).Add(Arg.Any<Employee>());
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
