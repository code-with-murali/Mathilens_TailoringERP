using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Customers;
using MathilensERP.Domain.Customers;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Customers.Commands.Create;

public sealed class CreateCustomerCommandHandler : ICommandHandler<CreateCustomerCommand, Result<CustomerDto>>
{
    private readonly ICustomerRepository _customerRepository;

    public CreateCustomerCommandHandler(ICustomerRepository customerRepository)
    {
        _customerRepository = customerRepository;
    }

    public async Task<Result<CustomerDto>> Handle(CreateCustomerCommand command, CancellationToken cancellationToken)
    {
        // The phone number identifies a customer at the counter and is what the WhatsApp module
        // and spreadsheet import both correlate on — two customers sharing one would make all
        // three ambiguous. Soft-deleted customers are outside the query filter, so a number
        // belonging only to a deleted record is free to reuse.
        var existing = await _customerRepository.GetByPhoneNumberAsync(command.PhoneNumber, cancellationToken);
        if (existing is not null)
        {
            return Result.Failure<CustomerDto>(Error.Conflict(
                "Customer.DuplicatePhoneNumber",
                $"A customer with mobile number '{command.PhoneNumber}' already exists ({existing.FullName})."));
        }

        var customer = Customer.Create(
            command.FullName,
            command.PhoneNumber,
            command.Email,
            command.Address,
            command.Notes,
            command.Gender,
            command.Religion,
            command.DateOfBirth,
            command.WeddingDate);

        _customerRepository.Add(customer);
        await _customerRepository.SaveChangesAsync(cancellationToken);

        return customer.ToDto();
    }
}
