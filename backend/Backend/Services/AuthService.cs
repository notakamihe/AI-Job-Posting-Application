using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend.DTO;
using Backend.Exceptions;
using Backend.Models;
using Backend.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

public class AuthService : IAuthService
{
	private readonly IChatService _chatService;
	private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly UserManager<User> _userManager;
    private readonly IUserService _userService;
    private readonly IUnitOfWork _unitOfWork;

    public AuthService(
		IChatService chatService,
	    IConfiguration configuration,
	    IEmailService emailService,
	    IHttpContextAccessor httpContextAccessor, 
	    UserManager<User> userManager,
	    IUserService userService, 
	    IUnitOfWork unitOfWork)
    {
		_chatService = chatService;
	    _configuration = configuration;
	    _emailService = emailService;
	    _httpContextAccessor = httpContextAccessor;
	    _userManager = userManager;
	    _userService = userService;
	    _unitOfWork = unitOfWork;
    }

    public async Task ChangePasswordAsync(User user, string currentPassword, string newPassword)
    {
        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);

        if (!result.Succeeded)
	        throw new AccountActionFailureException(result.Errors);
    }

    public async Task<bool> DeleteAccountAsync(User user, string password)
    {
	    if (!await _userManager.CheckPasswordAsync(user, password))
		    return false;

	    await _userService.DeleteAsync(user);
	    return true;
    }

    private string GenerateAccessToken(IEnumerable<Claim> claims)
    {
	    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]!));
	    SigningCredentials credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

	    JwtSecurityToken tokenOptions = new JwtSecurityToken(
		    issuer: _configuration["JwtSettings:Issuer"],
		    audience: _configuration["JwtSettings:Audience"],
		    claims: claims,
			expires: DateTime.UtcNow.AddMinutes(15),
		    signingCredentials: credentials);

	    return new JwtSecurityTokenHandler().WriteToken(tokenOptions);
    }
    
    private string GenerateRefreshToken()
    {
	    var randomNumber = new byte[32];
	    using (var rng = RandomNumberGenerator.Create())
	    {
		    rng.GetBytes(randomNumber);
		    return Convert.ToBase64String(randomNumber);
	    }
    }

	public async Task<User?> GetCurrentUserAsync()
    {
	    var id = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return id is not null ? await _userService.GetByIdAsync(id) : null;
    }

    private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
	    var tokenValidationParameters = new TokenValidationParameters
	    {
			ValidateAudience = false,
			ValidateIssuer = false,
			ValidateIssuerSigningKey = true,
			IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]!)),
			ValidateLifetime = false
	    };

		ClaimsPrincipal? principal;
		SecurityToken? securityToken;
		
	    try
	    {
			var tokenHandler = new JwtSecurityTokenHandler();
		    principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
	    }
	    catch (Exception)
	    {
		    throw new SecurityTokenException("Token is invalid.");
	    }
	    
	    if (securityToken is not JwtSecurityToken jwtSecurityToken)
		    throw new SecurityTokenException("Token is not a valid JWT.");
        
        if (!jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
		    throw new SecurityTokenException("Token uses incorrect signing algorithm.");
		    
	    return principal;
    }

    public async Task<(string AccessToken, string RefreshToken)?> LoginAsync(string email, string password)
    {
	    var user = await _userService.GetByEmailAsync(email);

	    if (user is null)
		    return null;

	    var isPasswordCorrect = await _userManager.CheckPasswordAsync(user, password);

	    if (!isPasswordCorrect)
		    return null;

	    List<Claim> claims = [new(ClaimTypes.Name, user.Email!), new(ClaimTypes.NameIdentifier, user.Id)];
	    var roles = await _userManager.GetRolesAsync(user);
	    claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
	    
	    var accessToken = GenerateAccessToken(claims);
	    
	    user.RefreshToken = GenerateRefreshToken();
	    user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
		
	    await _unitOfWork.CompleteAsync();

		return (accessToken, user.RefreshToken);
    }

    public async Task<(string AccessToken, string RefreshToken)?> RefreshAsync(string accessToken, string refreshToken)
    {
		var principal = GetPrincipalFromExpiredToken(accessToken);
		var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
		var user = userId is not null ? await _userService.GetByIdAsync(userId) : null;

	    if (user is null || user.RefreshToken != refreshToken || user.RefreshTokenExpiry <= DateTime.UtcNow)
		    return null;
		    
	    var newAccessToken = GenerateAccessToken(principal.Claims);

	    user.RefreshToken = GenerateRefreshToken();
	    await _unitOfWork.CompleteAsync();

		return (newAccessToken, user.RefreshToken);
    }

    public async Task<(string AccessToken, string RefreshToken)> RegisterAsync(RegisterRequest request)
    {
        var user = await _userService.CreateAsync(request);
		await _userManager.AddToRoleAsync(user, "User");
		await _chatService.CreateWithChatbotAsync(user);

		List<Claim> claims = [new(ClaimTypes.Name, user.Email!), new(ClaimTypes.NameIdentifier, user.Id)];
	    var roles = await _userManager.GetRolesAsync(user);
	    claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
	    
	    var accessToken = GenerateAccessToken(claims);
	    
	    user.RefreshToken = GenerateRefreshToken();
	    user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
		
	    await _unitOfWork.CompleteAsync();

		return (accessToken, user.RefreshToken);
    }
    
	public async Task RequestPasswordResetAsync(User user)
    {
		if (await _userManager.IsInRoleAsync(user, "Admin"))
			throw new InvalidUserException("Admin cannot request for password reset.");
    
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
    	
		string escapedEmail = Uri.EscapeDataString(user.Email!);
		string encodedToken = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        string link = $"{_configuration["Frontend:Url"]}/reset-password?email={escapedEmail}&token={encodedToken}";

        string body = 
	        $"""
    		<!DOCTYPE html>
    		<html>
    		<head>
    			<title>Password Reset Confirmation</title>
    		</head>
    		<body>
    			<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    			    <p style="text-align: center; font-weight: 500; opacity: 0.75; font-size: 18px; font-style: italic; font-weight: 500;">
    					JOB POSTING APPLICATION
    			    </p>
    			    <div style="padding: 24px; border: 1px solid #0003; border-radius: 10px">
    					<h1 style="font-size: 24px; margin-top: 0; margin-bottom: 0px;">Password Reset</h1>
    					<p style="margin-top: 24px; font-size: 16px; font-weight: normal;">
    						Hello <a style="font-weight: bold; font-style: italic;">John</a>,
    				    </p>
    					<p style="margin-bottom: 0; font-size: 16px; font-weight: normal;">
    				        Your request to reset your password has been received. 
    				        Please click 
    				        <a href="{link}" style="font-weight: bold; color: #605dff;">this link</a> 
    				        to continue.
    					</p>
    			    </div>
    			    <p style="text-align: center; background-color: #0002; padding: 8px; font-size: 13px; border-radius: 7px; color: #000c; font-weight: normal;">
    					Sent by Job Posting Application
    			    </p>
    			</div>
    		</body>
    		</html>
    		""";

        await _emailService.SendEmailAsync(user.Email!, "Request for Password Reset", body);
    }

	public async Task ResetPasswordAsync(User user, string token, string newPassword)
    {
		if (await _userManager.IsInRoleAsync(user, "Admin"))
			throw new InvalidUserException("Admin cannot reset password.");
    
		var decoded = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
	    var result = await _userManager.ResetPasswordAsync(user, decoded, newPassword);

	    if (!result.Succeeded)
	    {
		    if (result.Errors.Any(e => e.Code == "InvalidToken"))
			    throw new AccountActionFailureException("Invalid password reset request.");
			
			throw new AccountActionFailureException(result.Errors);
	    }
    }

	public async Task<bool> RevokeAsync(string refreshToken)
	{
		var user = await _userService.GetByRefreshTokenAsync(refreshToken);
		
		if (user is null)
			return false;
		
		user.RefreshToken = null;
		user.RefreshTokenExpiry = DateTime.UtcNow;
		await _unitOfWork.CompleteAsync();
		
		return true;
	}
	
	public async Task<bool> VerifyResetPasswordTokenAsync(string email, string token)
	{
	    var user = await _userService.GetByEmailAsync(email);

	    if (user is null)
		    return false;

	    return await _userManager.VerifyUserTokenAsync(
		    user, 
		    _userManager.Options.Tokens.PasswordResetTokenProvider, 
		    "ResetPassword", 
		    Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token)));
	}
}