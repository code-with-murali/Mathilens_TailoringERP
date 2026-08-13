using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Customers;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Customers.Commands.Update;

public sealed class UpdateCustomerCommandHandler : ICommandHandler<UpdateCustomerCommand, Result<CustomerDto>>
{
    private readonly ICustomerRepository _customerRepository;

    public UpdateCustomerCommandHandler(ICustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<Result<CustomerDto>> Handle(UpdateCustomerCommand command, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(command.Id, cancellationToken);
        if (customer is null)
        {
            return Result.Failure<CustomerDto>(
                Error.NotFound("Customer.NotFound", $"No customer was found with id '{command.Id}'."));
        }

        // Same uniqueness rule as create — but the customer's own current number is not a clash.
        var duplicate = await _customerRepository.GetByPhoneNumberAsync(command.PhoneNumber, cancellationToken);
        if (duplicate is not null && duplicate.Id != command.Id)
        {
            return Result.Failure<CustomerDto>(Error.Conflict(
                "Customer.DuplicatePhoneNumber",
                $"A customer with mobile number '{command.PhoneNumber}' already exists ({duplicate.FullName})."));
        }

        customer.UpdateDetails(
            command.FullName,
            command.PhoneNumber,
            command.Email,
            command.Address,
            command.Notes,
            command.Gender,
            command.Religion,
            command.DateOfBirth,
            command.WeddingDate);
        await _customerRepository.SaveChangesAsync(cancellationToken);

        return customer.ToDto();
    }
}
