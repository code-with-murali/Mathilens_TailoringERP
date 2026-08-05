using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Customers;
using MathilensERP.Shared.Constants;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Customers.Commands.Delete;

public sealed class DeleteCustomerCommandHandler : ICommandHandler<DeleteCustomerCommand, Result>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteCustomerCommandHandler(ICustomerRepository customerRepository, ICurrentUserService currentUserService)
    {
        _customerRepository = customerRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(DeleteCustomerCommand command, CancellationToken cancellationToken)
    {
        var customer = await _customerRepository.GetByIdAsync(command.Id, cancellationToken);
        if (customer is null)
        {
            return Result.Failure(
                Error.NotFound("Customer.NotFound", $"No customer was found with id '{command.Id}'."));
        }

        var deletedBy = _currentUserService.UserId ?? SystemUsers.SystemUserId;
        customer.SoftDelete(deletedBy, DateTime.UtcNow);

        await _customerRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
