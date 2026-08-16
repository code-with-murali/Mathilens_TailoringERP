using MathilensERP.Domain.Measurements;

namespace MathilensERP.Application.Measurements.Templates;

/// <summary>
/// The measurement points a shop takes for each garment type, in the order the tailor calls them
/// out, before anyone has customised anything. Every recognised <see cref="GarmentType"/> has one
/// — previously only Shirt and Trousers did, so every other garment showed "no template
/// configured" and could not be measured at all.
///
/// These are starting points, not rules: a shop edits the list and the order per garment type
/// from Settings, and the stored template then wins (see <see cref="MeasurementTemplateKeys"/>).
/// Values are centimetres by shop convention, matching <see cref="Domain.Measurements.Measurement"/>.
/// </summary>
public static class MeasurementTemplateDefaults
{
    // Case-insensitive: garment names are the shop's own text now, so "shirt" typed into the
    // garment master has to find the standard shirt points rather than starting blank.
    private static readonly IReadOnlyDictionary<string, IReadOnlyList<string>> ByGarmentType =
        new Dictionary<string, IReadOnlyList<string>>(StringComparer.OrdinalIgnoreCase)
        {
            [GarmentTypes.Shirt] =
            [
                "Neck", "Shoulder width", "Chest", "Waist", "Hip",
                "Sleeve length", "Bicep", "Wrist", "Shirt length",
            ],
            [GarmentTypes.Trousers] =
            [
                "Waist", "Hip/Seat", "Thigh", "Knee", "Calf",
                "Inseam (inside leg)", "Outseam (waist to ankle)", "Rise (front & back)",
                "Bottom opening (ankle width)",
            ],
            [GarmentTypes.Suit] =
            [
                "Neck", "Shoulder width", "Chest", "Waist", "Hip/Seat",
                "Sleeve length", "Bicep", "Cuff", "Back width", "Jacket length",
                "Trouser waist", "Thigh", "Inseam (inside leg)", "Outseam (waist to ankle)",
                "Bottom opening (ankle width)",
            ],
            [GarmentTypes.Blazer] =
            [
                "Neck", "Shoulder width", "Chest", "Waist", "Hip/Seat",
                "Sleeve length", "Bicep", "Cuff", "Back width", "Armhole",
                "Blazer length", "Lapel width",
            ],
            [GarmentTypes.Kurta] =
            [
                "Neck", "Shoulder width", "Chest", "Waist", "Hip",
                "Sleeve length", "Bicep", "Armhole", "Kurta length", "Bottom opening",
            ],
            [GarmentTypes.Blouse] =
            [
                "Neck depth (front)", "Neck depth (back)", "Shoulder width", "Bust/Chest",
                "Under-bust", "Waist", "Sleeve length", "Arm round", "Armhole", "Blouse length",
            ],
            [GarmentTypes.Dress] =
            [
                "Neck", "Shoulder width", "Bust/Chest", "Under-bust", "Waist", "Hip",
                "Sleeve length", "Arm round", "Armhole", "Shoulder to waist",
                "Waist to hem", "Full length",
            ],
            // "Other" is whatever the shop is asked to make this once, so it starts generic on
            // purpose rather than guessing at a garment nobody named.
            [GarmentTypes.Other] = ["Length", "Width", "Chest", "Waist", "Hip"],
        };

    /// <summary>
    /// The standard points for a garment, or none for one the shop invented.
    ///
    /// A garment this system never shipped — a Chudidhar, a Lehenga — has no standard anybody could
    /// have written down, so it starts empty and the shop fills the list in from the Measurement
    /// screen. Guessing at points for it would be worse than an empty list: nobody would know which
    /// of them were real.
    /// </summary>
    public static IReadOnlyList<string> For(string garmentType) =>
        ByGarmentType.TryGetValue(GarmentTypes.Normalise(garmentType), out var points) ? points : [];
}
