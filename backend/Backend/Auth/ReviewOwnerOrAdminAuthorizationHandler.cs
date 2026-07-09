using System.Security.Claims;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Auth;

public class ReviewOwnerOrAdminRequirement : IAuthorizationRequirement;

public class ReviewOwnerOrAdminAuthorizationHandler : AuthorizationHandler<ReviewOwnerOrAdminRequirement, Review>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        ReviewOwnerOrAdminRequirement requirement,
        Review resource)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (context.User.IsInRole("Admin") || resource.ReviewerId == userId)
            context.Succeed(requirement);
        
        return Task.CompletedTask;
    }
}