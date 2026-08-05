using MathilensERP.Domain.Common;
using MathilensERP.Shared.Guards;

namespace MathilensERP.Domain.Orders;

/// <summary>
/// The fabric/material details for one <see cref="OrderItem"/> (02_DATABASE.md § 10.11) —
/// what fabric was used, and whether it was customer- or shop-supplied. Only ever created or
/// replaced through its owning <see cref="OrderItem"/>, never independently.
/// </summary>
public sealed class FabricDetails : AuditableEntity
{
    public Guid OrderItemId { get; private set; }

    public string FabricType { get; private set; } = string.Empty;

    public FabricSource Source { get; private set; }

    public string? Color { get; private set; }

    public decimal Quantity { get; private set; }

    private FabricDetails()
    {
        // Reserved for EF Core materialization.
    }

    private FabricDetails(Guid id)
        : base(id)
    {
    }

    internal static FabricDetails Create(Guid orderItemId, string fabricType, FabricSource source, string? color, decimal quantity)
    {
        var fabric = new FabricDetails(Guid.NewGuid())
        {
            OrderItemId = Guard.AgainstEmpty(orderItemId, nameof(orderItemId)),
            FabricType = Guard.AgainstNullOrWhiteSpace(fabricType, nameof(fabricType)),
            Source = source,
            Color = color,
            Quantity = Guard.AgainstNegativeOrZero(quantity, nameof(quantity)),
        };

        return fabric;
    }
}
