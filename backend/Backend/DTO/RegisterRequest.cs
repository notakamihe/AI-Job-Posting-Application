using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Backend.Validation;

namespace Backend.DTO;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(RegisterApplicantRequest), nameof(UserType.Applicant))]
[JsonDerivedType(typeof(RegisterEmployerRequest), nameof(UserType.Employer))]
public abstract class RegisterRequest
{
    [MaxLength(100)] public string? Industry { get; set; }
	[MaxLength(200)] public string? Location { get; set; }
    [Required] [EmailAddress] public string Email { get; set; } = string.Empty;
	[Required] [PhoneNumber] public string PhoneNumber { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
}