using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class EmployerFilter : IValidatableObject
{
    public int? MinSize { get; set; }
    public int? MaxSize { get; set; }
    [Range(1, 5)] public double? MinRating { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MinSize > MaxSize)
            yield return new ValidationResult("Min size must not exceed max size.", [nameof(MinSize)]);
    }
}

public class DiscoverEmployerFilter : EmployerFilter
{
    public string? Industry { get; set; }
}