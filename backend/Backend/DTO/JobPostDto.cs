using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Backend.Models;
using Backend.Validation;

namespace Backend.DTO;

public class JobPostCoreDto : IValidatableObject
{
    [Required] [MaxLength(200)] public string Title { get; set; } = string.Empty;
    [Required] public string Summary { get; set; } = string.Empty;
    [Range(0, double.MaxValue, ErrorMessage = "Pay must be nonnegative.")] public decimal? PayLowEnd { get; set; }
    [Range(0, double.MaxValue, ErrorMessage = "Pay must be nonnegative.")] public decimal? PayHighEnd { get; set; }
    public EmploymentMedium? Medium { get; set; }
    [Required] public string Schedule { get; set; } = string.Empty;
    [Required] public EmploymentType? EmploymentType { get; set; }
    public List<QualificationDto> Qualifications { get; set; } = [];
    public List<ResponsibilityDto> Responsibilities { get; set; } = [];
    public string? AdditionalDetails { get; set; }
    public List<JobApplicationQuestionDto> ApplicationQuestions { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (PayLowEnd is not null && PayHighEnd is not null && PayLowEnd > PayHighEnd)
            yield return new ValidationResult(
                "Pay range is invalid. Low end pay must not exceed high end.", 
                [nameof(PayLowEnd)]);
    }
}

[JsonDerivedType(typeof(JobPostDto))]
public class JobPostBaseDto : JobPostCoreDto
{
    public long Id { get; set; }
    public DateTime PostedAt { get; set; }
    public List<SkillDto> SkillsWanted { get; set; } = [];
}

[JsonDerivedType(typeof(EntityQueryJobPostDto))]
public class JobPostDto : JobPostBaseDto
{
    public EmployerDto Employer { get; set; } = null!;
}

public class EntityQueryJobPostDto : JobPostDto
{
    public string Type => nameof(EntityQueryType.JobPost); 
}

public class JobPostRequest : JobPostCoreDto
{
    public List<SkillItemRequest> SkillsWanted { get; set; } = [];
}

public class CreateJobPostRequest : JobPostRequest
{
   [RequiredIfAdmin] public string? EmployerId { get; set; }
}