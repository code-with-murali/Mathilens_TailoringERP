using MathilensERP.Application.Customers;
using MathilensERP.Application.Customers.Commands.Create;
using MathilensERP.Domain.Customers;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Customers.Commands.Create;

public class CreateCustomerCommandHandlerTests
{
    [Fact]
    public async Task Handle_WithValidCommand_AddsCustomerAndSavesChanges()
    {
        var repository = Substitute.For<ICustomerRepository>();
        var handler = new CreateCustomerCommandHandler(repository);
        var command = new CreateCustomerCommand("Asha Rao", "+91 98765 43210", "asha@example.com", "12 MG Road", "Prefers cotton");

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Asha Rao", result.Value.FullName);
        Assert.Equal("+91 98765 43210", result.Value.PhoneNumber);
        repository.Received(1).Add(Arg.Any<Customer>());
        await repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
