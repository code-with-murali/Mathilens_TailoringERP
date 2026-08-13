using MathilensERP.Application.Activity;
using MathilensERP.Application.Auth.Commands.Login;
using MathilensERP.Application.Auth.Commands.RefreshAccessToken;
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
    public async Task Handle_WithAnUnloggedCommand_RecordsNothing()
    {
        // The browser redeems a refresh token on its own whenever the access token lapses. Logging
        // it filled the trail with entries no person performed, drowning the ones that matter.
        var behavior = Behavior<RefreshAccessTokenCommand, Result<AuthTokensDto>>();

        await behavior.Handle(
            new RefreshAccessTokenCommand("a-refresh-token"),
            () => Task.FromResult(Result.Success(new AuthTokensDto("access", "refresh", DateTime.UtcNow.AddMinutes(15)))),
            CancellationToken.None);

        await _repository.DidNotReceive().AddAsync(Arg.Any<ActivityLog>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithASignIn_StillRecordsIt()
    {
        _currentUserService.UserName.Returns("asha@shop.example");
        var behavior = Behavior<LoginCommand, Result<AuthTokensDto>>();

        await behavior.Handle(
            new LoginCommand("asha@shop.example", "Passw0rd123"),
            () => Task.FromResult(Result.Success(new AuthTokensDto("access", "refresh", DateTime.UtcNow.AddMinutes(15)))),
            CancellationToken.None);

        // Exempting the automatic refresh must not quietly exempt sign-in, which is a real event
        // with a person behind it and the first thing anyone looks for in an audit trail.
        await _repository.Received(1).AddAsync(
            Arg.Is<ActivityLog>(a => a != null && a.Screen == "Auth" && a.Action == "Login"),
            Arg.Any<CancellationToken>());
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
