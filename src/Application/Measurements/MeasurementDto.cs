using MathilensERP.Domain.Measurements;

namespace MathilensERP.Application.Measurements;

public sealed record MeasurementDto(
    Guid Id,
    Guid CustomerId,
    string GarmentType,
    IReadOnlyDictionary<string, decimal> Values,
    DateTime CreatedAtUtc);

public sealed record MeasurementHistoryDto(
    Guid Id,
    Guid MeasurementId,
    string GarmentType,
    IReadOnlyDictionary<string, decimal> Values,
    DateTime CreatedAtUtc);
