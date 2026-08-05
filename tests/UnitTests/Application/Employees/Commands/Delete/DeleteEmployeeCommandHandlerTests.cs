using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Employees;
using MathilensERP.Application.Employees.Commands.Delete;
using MathilensERP.Domain.Employees;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Employees.Commands.Delete;

public class DeleteEmployeeCommandHandlerTests
{
    [Fact]
    public async Task Handle_WithExistingEmployee_SoftDeletesAndSavesChanges()
    {
        var employee = Employee.Create("Ravi Kumar", null, null, null);
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByIdAsync(employee.Id, Arg.Any<CancellationToken>()).Returns(employee);
        var currentUserService = Substitute.For<ICurrentUserService>();
        var callerId = Guid.NewGuid();
        currentUserService.UserId.Returns(callerId);
        var handler = new DeleteEmployeeCommandHandler(repository, currentUserService);

        var result = await handler.Handle(new DeleteEmployeeCommand(employee.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(employee.IsDeleted);
        Assert.Equal(callerId, employee.DeletedBy);
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithUnknownEmployee_ReturnsNotFound()
    {
        var repository = Substitute.For<IEmployeeRepository>();
        repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Employee?)null);
        var currentUserService = Substitute.For<ICurrentUserService>();
        var handler = new DeleteEmployeeCommandHandler(repository, currentUserService);

        var result = await handler.Handle(new DeleteEmployeeCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.NotFound", result.Error.Code);
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
