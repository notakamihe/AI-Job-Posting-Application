using System.Security.Claims;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Auth;

public class PostOwnerOrAdminRequirement : IAuthorizationRequirement;

public class PostOwnerOrAdminAuthorizationHandler : AuthorizationHandler<PostOwnerOrAdminRequirement, JobPost>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        PostOwnerOrAdminRequirement requirement,
        JobPost resource)
    {   
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (context.User.IsInRole("Admin") || resource.EmployerId == userId)
            context.Succeed(requirement);
        
        return Task.CompletedTask;
    }
}