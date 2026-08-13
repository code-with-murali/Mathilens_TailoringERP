using MathilensERP.Application.Customers;
using MathilensERP.Application.Employees;
using MathilensERP.Application.Orders;
using MathilensERP.Application.Orders.Commands.Create;
using MathilensERP.Application.Pricing;
using MathilensERP.Domain.Customers;
using MathilensERP.Domain.Employees;
using MathilensERP.Domain.Measurements;
using MathilensERP.Domain.Orders;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Orders.Commands.Create;

public class CreateOrderCommandHandlerTests
{
    private static readonly IReadOnlyList<CreateOrderItemInput> OneItem =
        [new CreateOrderItemInput(GarmentType.Shirt, 1, 500m, new CreateOrderItemFabricInput("Cotton", FabricSource.ShopSupplied, "Blue", 2m))];

    [Fact]
    public async Task Handle_WithExistingCustomer_CreatesOrderWithItemsAndFabric()
    {
        var customer = Customer.Create("Asha Rao", "+91 98765 43210", null, null, null);
        var customerRepository = Substitute.For<ICustomerRepository>();
        customerRepository.GetByIdAsync(customer.Id, Arg.Any<CancellationToken>()).Returns(customer);
        var employeeRepository = Substitute.For<IEmployeeRepository>();
        var orderRepository = Substitute.For<IOrderRepository>();
        var handler = new CreateOrderCommandHandler(
            orderRepository, customerRepository, employeeRepository, Substitute.For<IClothPriceRepository>());
        var dueAtUtc = DateTime.UtcNow.AddDays(7);

        var result = await handler.Handle(new CreateOrderCommand(customer.Id, null, dueAtUtc, OneItem), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(customer.Id, result.Value.CustomerId);
        Assert.Single(result.Value.Items);
        Assert.NotNull(result.Value.Items[0].Fabric);
        Assert.Equal("Cotton", result.Value.Items[0].Fabric!.FabricType);
        orderRepository.Received(1).Add(Arg.Any<Order>());
        await orderRepository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithUnknownCustomer_ReturnsNotFound()
    {
        var customerRepository = Substitute.For<ICustomerRepository>();
        customerRepository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Customer?)null);
        var employeeRepository = Substitute.For<IEmployeeRepository>();
        var orderRepository = Substitute.For<IOrderRepository>();
        var handler = new CreateOrderCommandHandler(
            orderRepository, customerRepository, employeeRepository, Substitute.For<IClothPriceRepository>());

        var result = await handler.Handle(new CreateOrderCommand(Guid.NewGuid(), null, DateTime.UtcNow, OneItem), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Customer.NotFound", result.Error.Code);
        await orderRepository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithUnknownEmployee_ReturnsNotFound()
    {
        var customer = Customer.Create("Asha Rao", "+91 98765 43210", null, null, null);
        var customerRepository = Substitute.For<ICustomerRepository>();
        customerRepository.GetByIdAsync(customer.Id, Arg.Any<CancellationToken>()).Returns(customer);
        var employeeRepository = Substitute.For<IEmployeeRepository>();
        employeeRepository.GetByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>()).Returns((Employee?)null);
        var orderRepository = Substitute.For<IOrderRepository>();
        var handler = new CreateOrderCommandHandler(
            orderRepository, customerRepository, employeeRepository, Substitute.For<IClothPriceRepository>());

        var result = await handler.Handle(
            new CreateOrderCommand(customer.Id, Guid.NewGuid(), DateTime.UtcNow, OneItem), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal("Employee.NotFound", result.Error.Code);
        await orderRepository.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
