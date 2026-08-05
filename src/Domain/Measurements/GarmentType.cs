namespace MathilensERP.Domain.Measurements;

/// <summary>
/// Recognized garment types (02_DATABASE.md § 10.4 Validation Rules: "garment type is
/// required and must be a recognized type"). Deliberately a fixed enum rather than free
/// text so an order/measurement can never reference an unrecognized garment.
/// </summary>
public enum GarmentType
{
    Shirt,
    Trousers,
    Suit,
    Blazer,
    Kurta,
    Blouse,
    Dress,
    Other
}
