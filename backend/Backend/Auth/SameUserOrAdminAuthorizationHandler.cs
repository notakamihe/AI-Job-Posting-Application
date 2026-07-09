using System.Security.Claims;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Auth;

public class SameUserOrAdminRequirement : IAuthorizationRequirement;

public class SameUserOrAdminAuthorizationHandler : AuthorizationHandler<SameUserOrAdminRequirement, User>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        SameUserOrAdminRequirement requirement, 
        User resource)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (context.User.IsInRole("Admin") || resource.Id == userId)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}