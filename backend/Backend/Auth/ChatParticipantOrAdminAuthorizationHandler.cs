using System.Security.Claims;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Auth;

public class ChatParticipantOrAdminRequirement : IAuthorizationRequirement;

public class ChatParticipantOrAdminAuthorizationHandler : AuthorizationHandler<ChatParticipantOrAdminRequirement, Chat>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        ChatParticipantOrAdminRequirement requirement,
        Chat resource)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (context.User.IsInRole("Admin") || resource.Users.Any(u => u.Id == userId))
            context.Succeed(requirement);
        
        return Task.CompletedTask;
    }
}