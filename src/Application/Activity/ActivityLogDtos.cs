namespace MathilensERP.Application.Activity;

public sealed record ActivityLogDto(
    Guid Id,
    Guid? UserId,
    string? UserName,
    string Screen,
    string Action,
    string RequestName,
    DateTime OccurredAtUtc);

/// <summary>The values actually present in the log, so the filters only ever offer what will return something.</summary>
public sealed record ActivityLogFiltersDto(IReadOnlyList<string> Screens, IReadOnlyList<ActivityLogUserDto> Users);

public sealed record ActivityLogUserDto(Guid UserId, string UserName);
