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
