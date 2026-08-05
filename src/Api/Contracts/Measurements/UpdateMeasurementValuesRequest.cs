namespace MathilensERP.Api.Contracts.Measurements;

public sealed record UpdateMeasurementValuesRequest(IReadOnlyDictionary<string, decimal> Values);
