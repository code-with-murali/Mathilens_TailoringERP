using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Customers;
using MathilensERP.Application.Employees;
using MathilensERP.Application.Orders;
using MathilensERP.Application.Pricing;
using MathilensERP.Domain.Orders;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Orders.Commands.Create;

public sealed class CreateOrderCommandHandler : ICommandHandler<CreateOrderCommand, Result<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IClothPriceRepository _clothPriceRepository;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IEmployeeRepository employeeRepository,
        IClothPriceRepository clothPriceRepository)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _employeeRepository = employeeRepository;
        _clothPriceRepository = clothPriceRepository;
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

        var order = Order.Create(command.CustomerId, command.DueAtUtc, command.EmployeeId, command.Notes);

        foreach (var itemInput in command.Items)
        {
            var item = order.AddItem(itemInput.GarmentType, itemInput.Quantity, itemInput.UnitPrice);

            if (itemInput.Fabric is { } fabric)
            {
                // Resolved here, not trusted from the request: the id decides whether this cloth
                // comes off stock, so it has to come from the shop's own catalogue. An unmatched
                // code is kept as typed rather than refused — the field has always taken free text.
                var clothPrice = string.IsNullOrWhiteSpace(fabric.ClothCode)
                    ? null
                    : await _clothPriceRepository.GetByClothCodeAsync(fabric.ClothCode.Trim(), cancellationToken);

                order.SetItemFabric(
                    item.Id,
                    fabric.FabricType,
                    fabric.Source,
                    fabric.Color,
                    fabric.Quantity,
                    clothPrice?.Id,
                    fabric.ClothCode,
                    fabric.Unit);
            }
        }

        _orderRepository.Add(order);
        await _orderRepository.SaveChangesAsync(cancellationToken);

        return order.ToDto();
    }
}
