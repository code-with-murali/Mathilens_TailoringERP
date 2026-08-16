using MathilensERP.Domain.Measurements;

namespace MathilensERP.Api.Contracts.Measurements;

public sealed record CreateMeasurementRequest(string GarmentType, IReadOnlyDictionary<string, decimal> Values);
