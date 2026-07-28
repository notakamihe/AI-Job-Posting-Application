using Backend.DTO;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using RefreshRequest = Backend.DTO.RefreshRequest;
using RegisterRequest = Backend.DTO.RegisterRequest;
using ResetPasswordRequest = Microsoft.AspNetCore.Identity.Data.ResetPasswordRequest;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
	private readonly IAuthService _authService;
	private readonly IUserService _userService;

	public AuthController(IAuthService authService, IUserService userService)
	{
		_authService = authService;
		_userService = userService;
	}

    [HttpPost("changePassword")]
	[Authorize(Roles = "User")]
	public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
	{
		var user = await _authService.GetCurrentUserAsync();

		if (user == null)
			return Unauthorized();

		await _authService.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
		return Ok();
	}

	[HttpDelete("deleteAccount")]
	[Authorize(Roles = "User")]
	public async Task<IActionResult> DeleteAccount([FromBody] PasswordRequest request)
	{
		var user = await _authService.GetCurrentUserAsync();

		if (user == null)
			return Unauthorized();

		return await _authService.DeleteAccountAsync(user, request.Password)
			? NoContent()
			: Problem(
				type: "https://www.example.com/errors/account-action-failure",
				statusCode: StatusCodes.Status400BadRequest, 
				title: "Account action failed.", 
				detail: "Incorrect password provided.");
	}

	[HttpPost("forgotPassword")]
	public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
	{
		var user = await _userService.GetByEmailAsync(request.Email);

		if (user is null)
			return Problem(
				type: "https://www.example.com/errors/account-action-failure",
				statusCode: StatusCodes.Status400BadRequest,
				title: "Account action failed.",
				detail: $"User with email '{request.Email}' does not exist.");

		await _authService.RequestPasswordResetAsync(user);
		return Ok();
	}

	[HttpPost("login")]
	public async Task<ActionResult<TokenResponseDto>> Login([FromBody] LoginRequest login)
	{
		var tokens = await _authService.LoginAsync(login.Email, login.Password);
		
		if (tokens is not var (accessToken, refreshToken))
			return Problem(
				type: "https://www.example.com/errors/invalid-login-credentials",
				statusCode: StatusCodes.Status400BadRequest, 
				title: "Invalid login credentials.",
				detail: "Incorrect email or password.");

		return Ok(new TokenResponseDto { AccessToken = accessToken, RefreshToken = refreshToken});
	}

	[HttpPost("refresh")]
	public async Task<ActionResult<TokenResponseDto>> RefreshToken([FromBody] RefreshRequest request)
	{
		var tokens = await _authService.RefreshAsync(request.AccessToken, request.RefreshToken);

		if (tokens is not var (accessToken, refreshToken))
			return Problem(
				type: "https://www.example.com/errors/account-action-failure",
				statusCode: StatusCodes.Status400BadRequest, 
				title: "Account action failed.",
				detail: "Invalid access or refresh token.");

		return Ok(new TokenResponseDto { AccessToken = accessToken, RefreshToken = refreshToken });
	}

	[HttpPost("register")]
	public async Task<IActionResult> Register([FromBody] RegisterRequest request)
	{
		var (accessToken, refreshToken) = await _authService.RegisterAsync(request);
		return Ok(new TokenResponseDto { AccessToken = accessToken, RefreshToken = refreshToken });
	}

	[HttpPost("resetPassword")]
	public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
	{
		var user = await _userService.GetByEmailAsync(request.Email);

		if (user is null)
			return Problem(
				type: "https://www.example.com/errors/account-action-failure",
				statusCode: StatusCodes.Status400BadRequest,
				title: "Account action failed.",
				detail: "Invalid password reset request.");
				
		await _authService.ResetPasswordAsync(user, request.ResetCode, request.NewPassword);
		return Ok();
	}

	[HttpPost("revoke")]
	public async Task<IActionResult> RevokeToken([FromBody] Microsoft.AspNetCore.Identity.Data.RefreshRequest request)
	{
		var revoked = await _authService.RevokeAsync(request.RefreshToken);
		
		if (!revoked)
			return Problem(
				type: "https://www.example.com/errors/account-action-failure",
				statusCode: StatusCodes.Status400BadRequest, 
				title: "Account action failed.",
				detail: "Failed to revoke token. Token may already be invalid.");
		
		return Ok();
	}

	[HttpPost("verify")]
	[Authorize]
	public IActionResult VerifyToken()
	{
		return Ok();
	}

  	[HttpPost("verifyPasswordResetToken")]
	public async Task<IActionResult> VerifyPasswordResetToken([FromBody] VerifyResetPasswordTokenRequest request)
	{
		var isValid = await _authService.VerifyResetPasswordTokenAsync(request.Email, request.Token);

		if (!isValid)
			return Problem(
				type: "https://www.example.com/errors/password-reset-token-verification-failure",
				statusCode: StatusCodes.Status400BadRequest, 
				title: "Failed password reset token verification.",
				detail: "Invalid or expired password reset token.");

		return Ok();
	}
}