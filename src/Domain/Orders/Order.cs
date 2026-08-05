using MathilensERP.Domain.Common;
using MathilensERP.Domain.Measurements;
using MathilensERP.Shared.Guards;

namespace MathilensERP.Domain.Orders;

/// <summary>
/// A tailoring order placed by a customer (02_DATABASE.md § 10.7) — the central operational
/// record of the business, and the aggregate root for its <see cref="OrderItem"/>s and their
/// <see cref="FabricDetails"/>.
/// </summary>
public sealed class Order : AuditableEntity
{
    /// <summary>Received → InProgress → ReadyForDelivery → Delivered; any non-terminal state → Cancelled.</summary>
    private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
    {
        [OrderStatus.Received] = [OrderStatus.InProgress, OrderStatus.Cancelled],
        [OrderStatus.InProgress] = [OrderStatus.ReadyForDelivery, OrderStatus.Cancelled],
        [OrderStatus.ReadyForDelivery] = [OrderStatus.Delivered, OrderStatus.Cancelled],
        [OrderStatus.Delivered] = [],
        [OrderStatus.Cancelled] = [],
    };

    private readonly List<OrderItem> _items = [];

    public Guid CustomerId { get; private set; }

    public Guid? EmployeeId { get; private set; }

    public OrderStatus Status { get; private set; }

    public DateTime DueAtUtc { get; private set; }

    public IReadOnlyList<OrderItem> Items => _items;

    /// <summary>An order's items/fabric can only be changed while it's still open — not once delivered or cancelled.</summary>
    public bool CanModifyItems => Status is not (OrderStatus.Delivered or OrderStatus.Cancelled);

    private Order()
    {
        // Reserved for EF Core materialization.
    }

    private Order(Guid id)
        : base(id)
    {
    }

    public static Order Create(Guid customerId, DateTime dueAtUtc, Guid? employeeId)
    {
        return new Order(Guid.NewGuid())
        {
            CustomerId = Guard.AgainstEmpty(customerId, nameof(customerId)),
            EmployeeId = employeeId,
            DueAtUtc = dueAtUtc,
            Status = OrderStatus.Received,
        };
    }

    /// <summary>Adds a garment line item. Callers should check <see cref="CanModifyItems"/> first — see 01_ARCHITECTURE.md § 11 Validation Strategy.</summary>
    public OrderItem AddItem(GarmentType garmentType, int quantity, decimal unitPrice)
    {
        EnsureItemsModifiable();

        var item = OrderItem.Create(Id, garmentType, quantity, unitPrice);
        _items.Add(item);
        return item;
    }

    /// <summary>Sets (or replaces) the fabric details for one of this order's items.</summary>
    public void SetItemFabric(Guid orderItemId, string fabricType, FabricSource source, string? color, decimal quantity)
    {
        EnsureItemsModifiable();

        var item = _items.SingleOrDefault(i => i.Id == orderItemId)
            ?? throw new InvalidOperationException($"Order item '{orderItemId}' does not belong to this order.");

        item.SetFabric(fabricType, source, color, quantity);
    }

    public void AssignEmployee(Guid employeeId) => EmployeeId = Guard.AgainstEmpty(employeeId, nameof(employeeId));

    /// <summary>Whether this order can move to <paramref name="target"/> from its current status. Callers should check this before calling <see cref="TransitionTo"/>.</summary>
    public bool CanTransitionTo(OrderStatus target) => AllowedTransitions[Status].Contains(target);

    public void TransitionTo(OrderStatus target)
    {
        if (!CanTransitionTo(target))
        {
            throw new InvalidOperationException($"Cannot transition an order from '{Status}' to '{target}'.");
        }

        Status = target;
    }

    private void EnsureItemsModifiable()
    {
        if (!CanModifyItems)
        {
            throw new InvalidOperationException($"Cannot modify items on an order that is '{Status}'.");
        }
    }
}
