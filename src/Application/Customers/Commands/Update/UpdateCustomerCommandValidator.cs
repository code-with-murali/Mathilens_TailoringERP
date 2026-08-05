using FluentValidation;

namespace MathilensERP.Application.Customers.Commands.Update;

public sealed class UpdateCustomerCommandValidator : AbstractValidator<UpdateCustomerCommand>
{
    public UpdateCustomerCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .Matches(@"^[0-9+\-\s()]{7,20}$")
            .WithMessage("Phone number must be 7-20 characters and contain only digits, spaces, and + - ( ).");

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Address)
            .MaximumLength(500);

        RuleFor(x => x.Notes)
            .MaximumLength(2000);
    }
}
