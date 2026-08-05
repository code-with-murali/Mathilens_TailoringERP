using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Customers;
using MathilensERP.Application.Customers.Commands.Delete;
using MathilensERP.Domain.Customers;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Customers.Commands.Delete;

public class DeleteCustomerCommandHandlerTests
{
    [Fact]
    public async Task Handle_WithExistingCustomer_SoftDeletesAndSavesChanges()
    {
        var customer = Customer.Create("Asha Rao", "+91 98765 43210", null, null, null);
        var repository = Substitute.For<ICustomerRepository>();
        repository.GetByIdAsync(customer.Id, Arg.Any<CancellationToken>()).Returns(customer);
        var currentUserService = Substitute.For<ICurrentUserService>();
        var callerId = Guid.NewGuid();
        currentUserService.UserId.Returns(callerId);
        var handler = new DeleteCustomerCommandHandler(repository, currentUserService);

        var result = await handler.Handle(new DeleteCustomerCommand(customer.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(customer.IsDeleted);
        Assert.Equal(callerId, customer.DeletedBy);
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithUnknownCustomer_ReturnsNotFound()
    {
        var repository = Substitute.For<ICustomerRepository>();
        repository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Customer?)null);
        var currentUserService = Substitute.For<ICurrentUserService>();
        var handler = new DeleteCustomerCommandHandler(repository, currentUserService);

        var result = await handler.Handle(new DeleteCustomerCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Customer.NotFound", result.Error.Code);
        await repository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
