using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class UpdateEmailRequest
{
    [Required] [EmailAddress] public string Email { get; set; } = string.Empty;
}
