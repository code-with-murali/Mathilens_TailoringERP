using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Customers;
using MathilensERP.Application.Employees;
using MathilensERP.Application.Orders;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Commands.Create;

public sealed class CreateOrderCommandHandler : ICommandHandler<CreateOrderCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IEmployeeRepository _employeeRepository;

    public CreateOrderCommandHandler(IOrderRepository orderRepository, ICustomerRepository customerRepository, IEmployeeRepository employeeRepository)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _employeeRepository = employeeRepository;
    }

    public async Task<Result<OrderDto>> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(command.CustomerId, cancellationToken);
        if (customer is null)
        {
            return Result.Failure<OrderDto>(
                Error.NotFound("Customer.NotFound", $"No customer was found with id '{command.CustomerId}'."));
        }

        if (command.EmployeeId is { } employeeId)
        {
            var employee = await _employeeRepository.GetByIdAsync(employeeId, cancellationToken);
            if (employee is null)
            {
                return Result.Failure<OrderDto>(
                    Error.NotFound("Employee.NotFound", $"No employee was found with id '{employeeId}'."));
            }
        }

        var order = Order.Create(command.CustomerId, command.DueAtUtc, command.EmployeeId);

        foreach (var itemInput in command.Items)
        {
            var item = order.AddItem(itemInput.GarmentType, itemInput.Quantity, itemInput.UnitPrice);

            if (itemInput.Fabric is { } fabric)
            {
                order.SetItemFabric(item.Id, fabric.FabricType, fabric.Source, fabric.Color, fabric.Quantity);
            }
        }

        _orderRepository.Add(order);
        await _orderRepository.SaveChangesAsync(cancellationToken);

        return order.ToDto();
    }
}
