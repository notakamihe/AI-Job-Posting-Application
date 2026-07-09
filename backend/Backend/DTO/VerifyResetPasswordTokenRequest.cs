using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class VerifyResetPasswordTokenRequest
{
    [Required] [EmailAddress] public string Email { get; set; } = string.Empty;
    [Required] public string Token { get; set; } = string.Empty;
}