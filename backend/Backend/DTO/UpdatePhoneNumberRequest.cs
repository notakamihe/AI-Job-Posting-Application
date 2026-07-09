using System.ComponentModel.DataAnnotations;
using Backend.Validation;

namespace Backend.DTO;

public class UpdatePhoneNumberRequest
{
    [Required] [PhoneNumber] public string PhoneNumber { get; set; } = string.Empty;
}
