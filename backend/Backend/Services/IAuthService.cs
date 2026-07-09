using Backend.DTO;
using Backend.Models;

namespace Backend.Services;

public interface IAuthService
{
    Task ChangePasswordAsync(User user, string currentPassword, string newPassword);
    Task<bool> DeleteAccountAsync(User user, string password);
    Task<User?> GetCurrentUserAsync();
    Task<(string AccessToken, string RefreshToken)?> LoginAsync(string email, string password);
    Task<(string AccessToken, string RefreshToken)?> RefreshAsync(string accessToken, string refreshToken);
    Task<(string AccessToken, string RefreshToken)> RegisterAsync(RegisterRequest request);
    Task ResetPasswordAsync(User user, string token, string newPassword);
    Task RequestPasswordResetAsync(User user);
    Task<bool> RevokeAsync(string refreshToken);
    Task<bool> VerifyResetPasswordTokenAsync(string email, string token);
}