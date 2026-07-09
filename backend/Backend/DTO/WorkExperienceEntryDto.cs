using System.ComponentModel.DataAnnotations;
using Backend.Validation;

namespace Backend.DTO;

public class WorkExperienceEntryDto : IValidatableObject
{
    public long Id { get; set; }
    [Required] [MaxLength(200)] public string Position { get; set; } = string.Empty;
    [MaxLength(250)] public string? Employer { get; set; }
    [Range(1, 12)] public int? StartMonth { get; set; }
    [Required] [Year] public int? StartYear { get; set; }
    [Range(1, 12)] public int? EndMonth { get; set; }
    [Year] public int? EndYear { get; set; }
    public string? Description { get; set; }
    
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var now = DateTime.UtcNow;
        var startYear = StartYear ?? now.Year;
        var endMonth = EndMonth ?? (EndYear is null ? now.Month : null);
        var endYear = EndYear ?? now.Year;
    
        if (startYear > endYear)
            yield return new ValidationResult("Invalid date range.", [nameof(StartYear)]);
            
        if (StartMonth > endMonth && endYear == startYear)
            yield return new ValidationResult("Invalid date range.", [nameof(StartMonth)]);
    }
}
