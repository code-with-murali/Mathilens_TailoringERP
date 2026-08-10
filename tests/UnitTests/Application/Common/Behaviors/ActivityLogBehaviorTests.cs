using MathilensERP.Application.Activity;
using MathilensERP.Application.Common.Behaviors;
using MathilensERP.Application.Common.Interfaces;
using MathilensERP.Application.Customers;
using MathilensERP.Application.Customers.Commands.Create;
using MathilensERP.Application.Customers.Queries.Search;
using MathilensERP.Domain.Activity;
using MathilensERP.Shared.Pagination;
using MathilensERP.Shared.Results;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace MathilensERP.UnitTests.Application.Common.Behaviors;

public class ActivityLogBehaviorTests
{
    private readonly IActivityLogRepository _repository = Substitute.For<IActivityLogRepository>();
    private readonly ICurrentUserService _currentUserService = Substitute.For<ICurrentUserService>();

    private static CreateCustomerCommand Command() => new("Asha Rao", "+91 98765 43210", null, null, null);

    private ActivityLogBehavior<TRequest, TResponse> Behavior<TRequest, TResponse>()
        where TResponse : Result =>
        new(_repository, _currentUserService, NullLogger<ActivityLogBehavior<TRequest, TResponse>>.Instance);

    [Fact]
    public async Task Handle_WithASuccessfulCommand_RecordsWhoDidWhat()
    {
        var userId = Guid.NewGuid();
        _currentUserService.UserId.Returns(userId);
        _currentUserService.UserName.Returns("asha@shop.example");
        var behavior = Behavior<CreateCustomerCommand, Result<CustomerDto>>();

        await behavior.Handle(
            Command(),
            () => Task.FromResult(Result.Success(new CustomerDto(
                Guid.NewGuid(), "Asha Rao", "+91 98765 43210", null, null, null, null, null, null, null, DateTime.UtcNow))),
            CancellationToken.None);

        await _repository.Received(1).AddAsync(
            Arg.Is<ActivityLog>(a =>
                a.UserId == userId
                && a.UserName == "asha@shop.example"
                && a.Screen == "Customers"
                && a.Action == "Create Customer"),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithAFailedCommand_RecordsNothing()
    {
        var behavior = Behavior<CreateCustomerCommand, Result<CustomerDto>>();

        await behavior.Handle(
            Command(),
            () => Task.FromResult(Result.Failure<CustomerDto>(Error.Validation("VALIDATION_ERROR", "Nope."))),
            CancellationToken.None);

        // A refused command changed nothing, so logging it would describe an action that never happened.
        await _repository.DidNotReceive().AddAsync(Arg.Any<ActivityLog>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithAQuery_RecordsNothing()
    {
        var behavior = Behavior<SearchCustomersQuery, Result<PagedResult<CustomerDto>>>();

        await behavior.Handle(
            new SearchCustomersQuery(null, null, 1, 20),
            () => Task.FromResult(Result.Success(new PagedResult<CustomerDto>([], 1, 20, 0))),
            CancellationToken.None);

        await _repository.DidNotReceive().AddAsync(Arg.Any<ActivityLog>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenRecordingFails_StillReturnsTheCommandsResult()
    {
        _repository.AddAsync(Arg.Any<ActivityLog>(), Arg.Any<CancellationToken>())
            .Returns<Task>(_ => throw new InvalidOperationException("audit table unavailable"));
        var behavior = Behavior<CreateCustomerCommand, Result<CustomerDto>>();

        var expected = Result.Success(new CustomerDto(
            Guid.NewGuid(), "Asha Rao", "+91 98765 43210", null, null, null, null, null, null, null, DateTime.UtcNow));

        // The command already committed — reporting an error now would tempt the user to repeat work
        // that actually succeeded.
        var result = await behavior.Handle(Command(), () => Task.FromResult(expected), CancellationToken.None);

        Assert.True(result.IsSuccess);
    }
}
