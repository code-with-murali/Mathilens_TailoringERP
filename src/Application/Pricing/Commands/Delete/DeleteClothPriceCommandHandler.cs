using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Common.Mediator;
using MathilensERP.Application.Pricing;
using MathilensERP.Shared.Constants;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Pricing.Commands.Delete;

public sealed class DeleteClothPriceCommandHandler : ICommandHandler<DeleteClothPriceCommand, Result>
{
    private readonly IClothPriceRepository _clothPriceRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteClothPriceCommandHandler(IClothPriceRepository clothPriceRepository, ICurrentUserService currentUserService)
    {
        _clothPriceRepository = clothPriceRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(DeleteClothPriceCommand command, CancellationToken cancellationToken)
    {
        var clothPrice = await _clothPriceRepository.GetByIdAsync(command.Id, cancellationToken);
        if (clothPrice is null)
        {
            return Result.Failure(
                Error.NotFound("ClothPrice.NotFound", $"No price was found with id '{command.Id}'."));
        }

        var deletedBy = _currentUserService.UserId ?? SystemUsers.SystemUserId;
        clothPrice.SoftDelete(deletedBy, DateTime.UtcNow);

        await _clothPriceRepository.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
