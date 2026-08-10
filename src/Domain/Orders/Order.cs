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

    /// <summary>When the garment actually changed hands. Null until the order reaches <see cref="OrderStatus.Delivered"/>.</summary>
    public DateTime? DeliveredAtUtc { get; private set; }

    public string? Notes { get; private set; }

    /// <summary>
    /// The order's live line items. Removed items are soft-deleted rather than dropped
    /// (02_DATABASE.md § 5), and stay in the backing field until the aggregate is reloaded —
    /// at which point EF's global soft-delete filter excludes them — so this view filters
    /// them out to keep the in-memory aggregate consistent with a freshly loaded one.
    /// </summary>
    public IReadOnlyList<OrderItem> Items => _items.Where(i => !i.IsDeleted).ToList();

    /// <summary>An order's details, items and fabric can only be changed while it's still open — not once delivered or cancelled.</summary>
    public bool IsOpen => Status is not (OrderStatus.Delivered or OrderStatus.Cancelled);

    private Order()
    {
        // Reserved for EF Core materialization.
    }

    private Order(Guid id)
        : base(id)
    {
    }

    public static Order Create(Guid customerId, DateTime dueAtUtc, Guid? employeeId, string? notes = null)
    {
        return new Order(Guid.NewGuid())
        {
            CustomerId = Guard.AgainstEmpty(customerId, nameof(customerId)),
            EmployeeId = employeeId,
            DueAtUtc = dueAtUtc,
            Notes = notes,
            Status = OrderStatus.Received,
        };
    }

    /// <summary>
    /// Corrects the order's header details — who it is for, who is working it, when it is due,
    /// and its notes. Guarded by <see cref="IsOpen"/> for the same reason the item
    /// methods are: a delivered or cancelled order is a closed record, not a draft.
    /// </summary>
    public void UpdateDetails(Guid customerId, Guid? employeeId, DateTime dueAtUtc, string? notes)
    {
        EnsureModifiable("update");

        CustomerId = Guard.AgainstEmpty(customerId, nameof(customerId));
        EmployeeId = employeeId;
        DueAtUtc = dueAtUtc;
        Notes = notes;
    }

    /// <summary>Adds a garment line item. Callers should check <see cref="IsOpen"/> first — see 01_ARCHITECTURE.md § 11 Validation Strategy.</summary>
    public OrderItem AddItem(GarmentType garmentType, int quantity, decimal unitPrice)
    {
        EnsureModifiable("add items to");

        var item = OrderItem.Create(Id, garmentType, quantity, unitPrice);
        _items.Add(item);
        return item;
    }

    /// <summary>Corrects one of this order's garment line items. Its fabric details are left untouched.</summary>
    public void UpdateItem(Guid orderItemId, GarmentType garmentType, int quantity, decimal unitPrice)
    {
        EnsureModifiable("update items on");

        RequireItem(orderItemId).UpdateDetails(garmentType, quantity, unitPrice);
    }

    /// <summary>
    /// Soft-deletes a garment line item. An order must keep at least one live item — an order
    /// that bills for nothing should be cancelled, not emptied.
    /// </summary>
    public void RemoveItem(Guid orderItemId, Guid removedBy, DateTime removedAtUtc)
    {
        EnsureModifiable("remove items from");

        var item = RequireItem(orderItemId);

        if (Items.Count == 1)
        {
            throw new InvalidOperationException("Cannot remove the last item from an order — cancel the order instead.");
        }

        item.SoftDelete(removedBy, removedAtUtc);
    }

    /// <summary>Sets (or replaces) the fabric details for one of this order's items.</summary>
    public void SetItemFabric(Guid orderItemId, string fabricType, FabricSource source, string? color, decimal quantity)
    {
        EnsureModifiable("set fabric on");

        RequireItem(orderItemId).SetFabric(fabricType, source, color, quantity);
    }

    public void AssignEmployee(Guid employeeId) => EmployeeId = Guard.AgainstEmpty(employeeId, nameof(employeeId));

    /// <summary>Whether this order can move to <paramref name="target"/> from its current status. Callers should check this before calling <see cref="TransitionTo"/>.</summary>
    public bool CanTransitionTo(OrderStatus target) => AllowedTransitions[Status].Contains(target);

    /// <summary>
    /// Moves the order to <paramref name="target"/>. Delivering also records when the garment was
    /// handed over — supplied by the caller rather than read off the clock, so a handover entered
    /// late is still dated the day it happened.
    /// </summary>
    public void TransitionTo(OrderStatus target, DateTime? deliveredAtUtc = null)
    {
        if (!CanTransitionTo(target))
        {
            throw new InvalidOperationException($"Cannot transition an order from '{Status}' to '{target}'.");
        }

        if (target == OrderStatus.Delivered)
        {
            DeliveredAtUtc = deliveredAtUtc
                ?? throw new ArgumentNullException(nameof(deliveredAtUtc), "Delivering an order requires the date it was handed over.");
        }

        Status = target;
    }

    private OrderItem RequireItem(Guid orderItemId) =>
        _items.SingleOrDefault(i => i.Id == orderItemId && !i.IsDeleted)
            ?? throw new InvalidOperationException($"Order item '{orderItemId}' does not belong to this order.");

    private void EnsureModifiable(string action)
    {
        if (!IsOpen)
        {
            throw new InvalidOperationException($"Cannot {action} an order that is '{Status}'.");
        }
    }
}
