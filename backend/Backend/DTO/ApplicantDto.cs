using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.DTO;

[JsonDerivedType(typeof(ApplicantDetailDto))]
public class ApplicantDto : UserDto
{
    public string Type => nameof(EntityQueryType.Applicant);
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string? Link1 { get; set; }
    public string? Link2 { get; set; }
    public string? PreferredOccupation { get; set; }
    public bool IsPrivate { get; set; }
    public bool ReadyToWork { get; set; }
    public string? About { get; set; }
    public List<WorkExperienceEntryDto> WorkExperience { get; set; } = [];
    public List<EducationEntryDto> Education { get; set; } = [];
    public List<CertificateOrLicenseDto> CertificationsAndLicenses { get; set; } = [];
    public List<SkillDto> Skills { get; set; } = [];
    public List<EmployerDto> Following { get; set; } = [];
}

[JsonDerivedType(typeof(AuthenticatedApplicantDto))]
public class ApplicantDetailDto : ApplicantDto
{
    public List<ApplicantReviewDto> Reviews { get; set; } = [];
}

public class AuthenticatedApplicantDto : ApplicantDetailDto
{
    public List<ApplicantJobApplicationDto> Applications { get; set; } = [];
    public List<JobPostDto> Saved { get; set; } = [];
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = [];
}

public class RegisterApplicantRequest : RegisterRequest
{
    [MaxLength(50)] [Required] public string FirstName { get; set; } = string.Empty;
    [MaxLength(50)] public string? MiddleName { get; set; }
    [MaxLength(50)] [Required] public string LastName { get; set; } = string.Empty;
    [MaxLength(2048)] [Url] public string? Link1 { get; set; }
    [MaxLength(2048)] [Url] public string? Link2 { get; set; }
    [MaxLength(100)] public string? PreferredOccupation { get; set; }
    public bool IsPrivate { get; set; }
    public bool ReadyToWork { get; set; }
}

public class UpdateApplicantProfileRequest : UpdateProfileBase
{ 
    [MaxLength(50)] [Required] public string FirstName { get; set; } = string.Empty;
    [MaxLength(50)] public string? MiddleName { get; set; }
    [MaxLength(50)] [Required] public string LastName { get; set; } = string.Empty;
    [MaxLength(2048)] [Url] public string? Link1 { get; set; }
    [MaxLength(2048)] [Url] public string? Link2 { get; set; }
    [MaxLength(100)] public string? PreferredOccupation { get; set; }
    public bool IsPrivate { get; set; }
    public bool ReadyToWork { get; set; }
    public string? About { get; set; }
    public List<WorkExperienceEntryDto> WorkExperience { get; set; } = [];
    public List<EducationEntryDto> Education { get; set; } = [];
    public List<CertificateOrLicenseDto> CertificationsAndLicenses { get; set; } = [];
    public List<SkillItemRequest> Skills { get; set; } = []; 
}