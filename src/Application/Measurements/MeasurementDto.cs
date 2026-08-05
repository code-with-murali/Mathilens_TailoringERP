using MathilensERP.Domain.Measurements;

namespace MathilensERP.Application.Measurements;

public sealed record MeasurementDto(
    Guid Id,
    Guid CustomerId,
    GarmentType GarmentType,
    IReadOnlyDictionary<string, decimal> Values,
    DateTime CreatedAtUtc);

public sealed record MeasurementHistoryDto(
    Guid Id,
    Guid MeasurementId,
    GarmentType GarmentType,
    IReadOnlyDictionary<string, decimal> Values,
    DateTime CreatedAtUtc);
