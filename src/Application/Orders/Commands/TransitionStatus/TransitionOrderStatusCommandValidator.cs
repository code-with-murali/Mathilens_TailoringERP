using FluentValidation;

namespace MathilensERP.Application.Orders.Commands.TransitionStatus;

public sealed class TransitionOrderStatusCommandValidator : AbstractValidator<TransitionOrderStatusCommand>
{
    public TransitionOrderStatusCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty();

        RuleFor(x => x.TargetStatus)
            .IsInEnum();
    }
}
