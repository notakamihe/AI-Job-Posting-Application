using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class SkillRequest
{
    [Required] 
    [MaxLength(100, ErrorMessage = "Name must not exceed 100 characters.")] 
    public string Name { get; set; } = string.Empty;
}

public class SkillDto : SkillRequest
{
    public long Id { get; set; }
}

public class SkillItemRequest : IValidatableObject
{
    public long? Id { get; set; }
    [MaxLength(100, ErrorMessage = "Name must not exceed 100 characters.")] public string? Name { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Id is null && string.IsNullOrEmpty(Name))
            yield return new ValidationResult("Skill must have ID or name specified.");
    }
}