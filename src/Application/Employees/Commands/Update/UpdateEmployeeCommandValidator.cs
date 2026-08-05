using FluentValidation;

namespace MathilensERP.Application.Employees.Commands.Update;

public sealed class UpdateEmployeeCommandValidator : AbstractValidator<UpdateEmployeeCommand>
{
    public UpdateEmployeeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();

        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.JobTitle)
            .MaximumLength(100);

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^[0-9+\-\s()]{7,20}$")
            .WithMessage("Phone number must be 7-20 characters and contain only digits, spaces, and + - ( ).")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}
