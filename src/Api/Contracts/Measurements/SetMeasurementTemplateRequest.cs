namespace MathilensERP.Api.Contracts.Measurements;

/// <param name="Points">The measurement point names, in the order staff should be asked for them.</param>
public sealed record SetMeasurementTemplateRequest(IReadOnlyList<string> Points);
