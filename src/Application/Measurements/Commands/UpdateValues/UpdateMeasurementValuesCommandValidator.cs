using FluentValidation;

namespace MathilensERP.Application.Measurements.Commands.UpdateValues;

public sealed class UpdateMeasurementValuesCommandValidator : AbstractValidator<UpdateMeasurementValuesCommand>
{
    public UpdateMeasurementValuesCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.Values)
            .NotEmpty()
            .WithMessage("At least one measurement value is required.");

        RuleForEach(x => x.Values)
            .Must(point => !string.IsNullOrWhiteSpace(point.Key))
            .WithMessage("Measurement point names cannot be blank.")
            .Must(point => point.Value > 0)
            .WithMessage("Measurement values must be greater than zero.");
    }
}
