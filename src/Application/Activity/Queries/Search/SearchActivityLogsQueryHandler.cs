using MathilensERP.Application.Common.Mediator;
using MathilensERP.Shared.Pagination;
using MathilensERP.Shared.Results;

namespace MathilensERP.Application.Activity.Queries.Search;

public sealed class SearchActivityLogsQueryHandler : IQueryHandler<SearchActivityLogsQuery, Result<PagedResult<ActivityLogDto>>>
{
    private readonly IActivityLogRepository _activityLogRepository;

    public SearchActivityLogsQueryHandler(IActivityLogRepository activityLogRepository)
    {
        _activityLogRepository = activityLogRepository;
    }

    public async Task<Result<PagedResult<ActivityLogDto>>> Handle(SearchActivityLogsQuery query, CancellationToken cancellationToken)
    {
        var page = await _activityLogRepository.SearchAsync(
            query.FromUtc, query.ToUtc, query.UserId, query.Screen, query.Page, query.PageSize, cancellationToken);

        var items = page.Items
            .Select(a => new ActivityLogDto(a.Id, a.UserId, a.UserName, a.Screen, a.Action, a.RequestName, a.Description, a.OccurredAtUtc))
            .ToList();

        return new PagedResult<ActivityLogDto>(items, page.Page, page.PageSize, page.TotalCount);
    }
}
