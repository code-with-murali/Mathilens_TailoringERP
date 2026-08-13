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
    private static readonly IReadOnlyDictionary<GarmentType, IReadOnlyList<string>> ByGarmentType =
        new Dictionary<GarmentType, IReadOnlyList<string>>
        {
            [GarmentType.Shirt] =
            [
                "Neck", "Shoulder width", "Chest", "Waist", "Hip",
                "Sleeve length", "Bicep", "Wrist", "Shirt length",
            ],
            [GarmentType.Trousers] =
            [
                "Waist", "Hip/Seat", "Thigh", "Knee", "Calf",
                "Inseam (inside leg)", "Outseam (waist to ankle)", "Rise (front & back)",
                "Bottom opening (ankle width)",
            ],
            [GarmentType.Suit] =
            [
                "Neck", "Shoulder width", "Chest", "Waist", "Hip/Seat",
                "Sleeve length", "Bicep", "Cuff", "Back width", "Jacket length",
                "Trouser waist", "Thigh", "Inseam (inside leg)", "Outseam (waist to ankle)",
                "Bottom opening (ankle width)",
            ],
            [GarmentType.Blazer] =
            [
                "Neck", "Shoulder width", "Chest", "Waist", "Hip/Seat",
                "Sleeve length", "Bicep", "Cuff", "Back width", "Armhole",
                "Blazer length", "Lapel width",
            ],
            [GarmentType.Kurta] =
            [
                "Neck", "Shoulder width", "Chest", "Waist", "Hip",
                "Sleeve length", "Bicep", "Armhole", "Kurta length", "Bottom opening",
            ],
            [GarmentType.Blouse] =
            [
                "Neck depth (front)", "Neck depth (back)", "Shoulder width", "Bust/Chest",
                "Under-bust", "Waist", "Sleeve length", "Arm round", "Armhole", "Blouse length",
            ],
            [GarmentType.Dress] =
            [
                "Neck", "Shoulder width", "Bust/Chest", "Under-bust", "Waist", "Hip",
                "Sleeve length", "Arm round", "Armhole", "Shoulder to waist",
                "Waist to hem", "Full length",
            ],
            // "Other" is whatever the shop is asked to make this once, so it starts generic on
            // purpose rather than guessing at a garment nobody named.
            [GarmentType.Other] = ["Length", "Width", "Chest", "Waist", "Hip"],
        };

    public static IReadOnlyList<string> For(GarmentType garmentType) =>
        ByGarmentType.TryGetValue(garmentType, out var points) ? points : [];
}
