using FluentValidation;

namespace MathilensERP.Application.Measurements.Commands.Create;

public sealed class CreateMeasurementCommandValidator : AbstractValidator<CreateMeasurementCommand>
{
    public CreateMeasurementCommandValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty();

        RuleFor(x => x.GarmentType)
            .IsInEnum();

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
