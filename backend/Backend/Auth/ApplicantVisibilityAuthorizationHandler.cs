using System.Security.Claims;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Auth;

public class ApplicantVisibilityRequirement : IAuthorizationRequirement;

public class ApplicantVisibilityAuthorizationHandler : AuthorizationHandler<ApplicantVisibilityRequirement, Applicant>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        ApplicantVisibilityRequirement requirement,
        Applicant resource)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (context.User.IsInRole("Admin") || !resource.IsPrivate || resource.Id == userId)
            context.Succeed(requirement);
        
        return Task.CompletedTask;
    }
}