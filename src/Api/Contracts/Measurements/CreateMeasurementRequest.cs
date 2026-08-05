using MathilensERP.Domain.Measurements;

namespace MathilensERP.Api.Contracts.Measurements;

public sealed record CreateMeasurementRequest(GarmentType GarmentType, IReadOnlyDictionary<string, decimal> Values);
