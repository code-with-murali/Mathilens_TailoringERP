using MathilensERP.Domain.Common;
using MathilensERP.Domain.Measurements;
using MathilensERP.Shared.Guards;

namespace MathilensERP.Domain.Orders;

/// <summary>
/// A single garment line item within an <see cref="Order"/> (02_DATABASE.md § 10.8). Only
/// ever created or modified through its owning <see cref="Order"/>, never independently.
/// </summary>
public sealed class OrderItem : AuditableEntity
{
    public Guid OrderId { get; private set; }

    public GarmentType GarmentType { get; private set; }

    public int Quantity { get; private set; }

    public decimal UnitPrice { get; private set; }

    public FabricDetails? Fabric { get; private set; }

    private OrderItem()
    {
        // Reserved for EF Core materialization.
    }

    private OrderItem(Guid id)
        : base(id)
    {
    }

    internal static OrderItem Create(Guid orderId, GarmentType garmentType, int quantity, decimal unitPrice)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), quantity, "Quantity must be greater than zero.");
        }

        var item = new OrderItem(Guid.NewGuid())
        {
            OrderId = Guard.AgainstEmpty(orderId, nameof(orderId)),
            GarmentType = garmentType,
            Quantity = quantity,
            UnitPrice = Guard.AgainstNegativeOrZero(unitPrice, nameof(unitPrice)),
        };

        return item;
    }

    /// <summary>Sets (or replaces) this item's fabric details (02_DATABASE.md § 10.11).</summary>
    internal void SetFabric(string fabricType, FabricSource source, string? color, decimal quantity) =>
        Fabric = FabricDetails.Create(Id, fabricType, source, color, quantity);
}
