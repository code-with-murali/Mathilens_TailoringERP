using System.Security.Claims;
using MathilensERP.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace MathilensERP.Infrastructure.Services;

/// <summary>Reads the authenticated caller's id from the current HTTP request's JWT claims.</summary>
public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }
}
