using System.Security.Claims;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;

public class ChatMessageSenderRequirement : IAuthorizationRequirement;

public class ChatMessageSenderAuthorizationHandler : AuthorizationHandler<ChatMessageSenderRequirement, ChatMessage>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        ChatMessageSenderRequirement requirement, 
        ChatMessage resource)
    {
        if (resource.SentById == context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}