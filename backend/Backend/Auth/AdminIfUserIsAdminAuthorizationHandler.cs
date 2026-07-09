using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace Backend.Auth;

public class AdminIfUserIsAdminRequirement : IAuthorizationRequirement;

public class AdminIfUserIsAdminAuthorizationHandler : AuthorizationHandler<AdminIfUserIsAdminRequirement, User>
{
    private readonly UserManager<User> _userManager;
    
    public AdminIfUserIsAdminAuthorizationHandler(UserManager<User> userManager)
    {
        _userManager = userManager;
    }
    
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        AdminIfUserIsAdminRequirement requirement, 
        User resource)
    {
        if (await _userManager.IsInRoleAsync(resource, "Admin"))
        {
            if (context.User.IsInRole("Admin"))
                context.Succeed(requirement);
        }
        else 
        {
            context.Succeed(requirement);
        }
    }
}