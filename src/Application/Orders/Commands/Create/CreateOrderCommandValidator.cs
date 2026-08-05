using FluentValidation;

namespace MathilensERP.Application.Orders.Commands.Create;

public sealed class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty();

        RuleFor(x => x.EmployeeId)
            .NotEqual(Guid.Empty)
            .When(x => x.EmployeeId.HasValue);

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("An order must have at least one item.");

        RuleForEach(x => x.Items).SetValidator(new CreateOrderItemInputValidator());
    }
}

public sealed class CreateOrderItemInputValidator : AbstractValidator<CreateOrderItemInput>
{
    public CreateOrderItemInputValidator()
    {
        RuleFor(x => x.GarmentType)
            .IsInEnum();

        RuleFor(x => x.Quantity)
            .GreaterThan(0);

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0);

        // FluentValidation's SetValidator is invariant on nullability annotations even though
        // there's only one validator type at runtime — the null-forgiving operator here is the
        // documented workaround, not a real nullability risk (the .When() guards the null case).
        RuleFor(x => x.Fabric)
            .SetValidator(new CreateOrderItemFabricInputValidator()!)
            .When(x => x.Fabric is not null);
    }
}

public sealed class CreateOrderItemFabricInputValidator : AbstractValidator<CreateOrderItemFabricInput>
{
    public CreateOrderItemFabricInputValidator()
    {
        RuleFor(x => x.FabricType)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Source)
            .IsInEnum();

        RuleFor(x => x.Color)
            .MaximumLength(50);

        RuleFor(x => x.Quantity)
            .GreaterThan(0);
    }
}
