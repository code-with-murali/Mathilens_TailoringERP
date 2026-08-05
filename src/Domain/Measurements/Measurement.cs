using System.Text.Json;
using MathilensERP.Domain.Common;
using MathilensERP.Shared.Guards;

namespace MathilensERP.Domain.Measurements;

/// <summary>
/// The current, active set of measurements for a customer for a given garment type
/// (02_DATABASE.md § 10.4) — "the latest known truth" staff reference when creating orders.
///
/// Measurement points are a flexible name/value set (persisted as JSON) rather than fixed
/// per-garment-type columns: 02_DATABASE.md § 10.4 Future Expansion explicitly scopes
/// "garment-type-specific measurement templates" as future work, so a rigid Version 1 schema
/// per garment type would be exactly the speculative complexity YAGNI (00_MASTER_SPEC.md § 4.5)
/// rules out. Values are centimeters by shop convention; a per-record unit is future work.
/// </summary>
public sealed class Measurement : AuditableEntity
{
    public Guid CustomerId { get; private set; }

    public GarmentType GarmentType { get; private set; }

    /// <summary>Persisted form of <see cref="Values"/> — an ordinary JSON-text column, not a
    /// provider-specific JSON column type, to keep the mapping simple and dependable.</summary>
    public string ValuesJson { get; private set; } = "{}";

    public IReadOnlyDictionary<string, decimal> Values =>
        JsonSerializer.Deserialize<Dictionary<string, decimal>>(ValuesJson) ?? [];

    private Measurement()
    {
        // Reserved for EF Core materialization.
    }

    private Measurement(Guid id)
        : base(id)
    {
    }

    public static Measurement Create(Guid customerId, GarmentType garmentType, IReadOnlyDictionary<string, decimal> values)
    {
        var measurement = new Measurement(Guid.NewGuid())
        {
            CustomerId = Guard.AgainstEmpty(customerId, nameof(customerId)),
            GarmentType = garmentType,
        };

        measurement.SetValues(values);

        return measurement;
    }

    public void UpdateValues(IReadOnlyDictionary<string, decimal> values) => SetValues(values);

    private void SetValues(IReadOnlyDictionary<string, decimal> values)
    {
        Guard.AgainstNull(values, nameof(values));

        if (values.Count == 0)
        {
            throw new ArgumentException("At least one measurement value is required.", nameof(values));
        }

        foreach (var (point, value) in values)
        {
            Guard.AgainstNullOrWhiteSpace(point, nameof(values));
            Guard.AgainstNegativeOrZero(value, nameof(values));
        }

        ValuesJson = JsonSerializer.Serialize(values);
    }
}
