using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.DTO;

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(UpdateApplicantProfileRequest), nameof(UserType.Applicant))]
[JsonDerivedType(typeof(UpdateEmployerProfileRequest), nameof(UserType.Employer))]
public abstract class UpdateProfileBase
{
	[MaxLength(100)] public string? Industry { get; set; }
	[MaxLength(200)] public string? Location { get; set; }
}

[JsonDerivedType(typeof(ApplicantDto))]
[JsonDerivedType(typeof(EmployerDto))]
[JsonDerivedType(typeof(AuthenticatedUserDto))]
public class UserDto : UpdateProfileBase
{
	public string Id { get; set; } = string.Empty;
}

public class AuthenticatedUserDto : UserDto
{
	public string Email { get; set; } = string.Empty;
	public string PhoneNumber { get; set; } = string.Empty;
	public List<string> Roles { get; set; } = [];
}

public enum UserType
{
	Applicant,
	Employer
}