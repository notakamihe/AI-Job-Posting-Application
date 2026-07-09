using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class PasswordRequest
{
    [Required] public string Password { get; set; } = string.Empty;
}