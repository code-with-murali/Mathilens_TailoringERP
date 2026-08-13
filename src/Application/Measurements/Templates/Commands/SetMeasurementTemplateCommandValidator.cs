using FluentValidation;

namespace MathilensERP.Application.Measurements.Templates.Commands;

public sealed class SetMeasurementTemplateCommandValidator : AbstractValidator<SetMeasurementTemplateCommand>
{
    /// <summary>Keeps the serialized JSON comfortably inside the Settings value column's 4000 characters.</summary>
    private const int MaxPoints = 60;

    public SetMeasurementTemplateCommandValidator()
    {
        RuleFor(x => x.GarmentType)
            .IsInEnum();

        RuleFor(x => x.Points)
            .NotEmpty()
            .WithMessage("A garment type needs at least one measurement point.")
            .Must(points => points.Count <= MaxPoints)
            .WithMessage($"A garment type can have at most {MaxPoints} measurement points.");

        RuleForEach(x => x.Points)
            .NotEmpty()
            .WithMessage("A measurement point name cannot be blank.")
            .MaximumLength(60);

        // Values are stored keyed by point name, so two points sharing a name would silently
        // collapse into one on save.
        RuleFor(x => x.Points)
            .Must(points => points
                .Select(p => p?.Trim() ?? string.Empty)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Count() == points.Count)
            .WithMessage("Each measurement point must have a distinct name.")
            .When(x => x.Points is { Count: > 0 });
    }
}
