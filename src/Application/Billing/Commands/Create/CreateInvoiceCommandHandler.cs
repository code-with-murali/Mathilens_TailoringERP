using MathilensERP.Application.Billing;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Orders;
using MathilensERP.Domain.Billing;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Billing.Commands.Create;

/// <summary>
/// Deliberately explicit rather than automatic-on-delivery: this product has no domain-event
/// dispatch mechanism wired up yet (01_ARCHITECTURE.md § 26 Future Event-Driven Architecture
/// is exactly that — future), so invoicing is a staff (or future automation) action, not an
/// implicit side effect of an order's status changing.
/// </summary>
public sealed class CreateInvoiceCommandHandler : ICommandHandler<CreateInvoiceCommand, Result<InvoiceDto>>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IOrderRepository _orderRepository;

    public CreateInvoiceCommandHandler(IInvoiceRepository invoiceRepository, IOrderRepository orderRepository)
    {
        _invoiceRepository = invoiceRepository;
        _orderRepository = orderRepository;
    }

    public async Task<Result<InvoiceDto>> Handle(CreateInvoiceCommand command, CancellationToken cancellationToken)
    {
        var order = await _orderRepository.GetByIdAsync(command.OrderId, cancellationToken);
        if (order is null)
        {
            return Result.Failure<InvoiceDto>(Error.NotFound("Order.NotFound", $"No order was found with id '{command.OrderId}'."));
        }

        if (order.Items.Count == 0)
        {
            return Result.Failure<InvoiceDto>(Error.Conflict("Order.NoItems", "Cannot invoice an order with no items."));
        }

        var subtotal = order.Items.Sum(i => i.Quantity * i.UnitPrice);

        if (subtotal - command.DiscountAmount + command.TaxAmount <= 0)
        {
            return Result.Failure<InvoiceDto>(Error.Conflict(
                "Invoice.InvalidTotal", "The discount cannot bring the invoice total to zero or below."));
        }

        var invoice = Invoice.Create(order.Id, order.CustomerId, subtotal, command.TaxAmount, command.DiscountAmount);

        _invoiceRepository.Add(invoice);
        await _invoiceRepository.SaveChangesAsync(cancellationToken);

        return invoice.ToDto();
    }
}
