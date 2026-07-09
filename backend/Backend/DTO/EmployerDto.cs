using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.DTO;

[JsonDerivedType(typeof(AuthenticatedEmployerDto))]
public class EmployerDto : UserDto
{
    public string Type => nameof(EntityQueryType.Employer);
    public string Name { get; set; } = string.Empty;
    public string? Website { get; set; }
    public string? About { get; set; }
    public int? SizeRangeLowEnd { get; set; }
    public int? SizeRangeHighEnd { get; set; }
    public List<JobPostBaseDto> JobPosts { get; set; } = [];
    public double? AverageRating { get; set; }
}

public class AuthenticatedEmployerDto : EmployerDto
{
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = [];
}

public class RegisterEmployerRequest : RegisterRequest
{
    [Required] [MaxLength(250)] public string Name { get; set; } = string.Empty;
    [MaxLength(2048)] [Url] public string? Website { get; set; }
    public string? About { get; set; }
    public int? SizeRangeLowEnd { get; set; }
    public int? SizeRangeHighEnd { get; set; }
}

public class UpdateEmployerProfileRequest : UpdateProfileBase
{
    [Required] [MaxLength(250)] public string Name { get; set; } = string.Empty;
    [MaxLength(2048)] [Url] public string? Website { get; set; }
    public string? About { get; set; }
    public int? SizeRangeLowEnd { get; set; }
    public int? SizeRangeHighEnd { get; set; }
}