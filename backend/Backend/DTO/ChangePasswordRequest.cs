using System.ComponentModel.DataAnnotations;

namespace Backend.DTO
{
    public class ChangePasswordRequest
    {
        [Required] public string CurrentPassword { get; set; } = string.Empty;
        [Required] public string NewPassword { get; set; } = string.Empty;
    }
}
