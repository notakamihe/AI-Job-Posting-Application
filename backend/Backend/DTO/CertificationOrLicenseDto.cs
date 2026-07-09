using System.ComponentModel.DataAnnotations;
using Backend.Validation;

namespace Backend.DTO;

public class CertificateOrLicenseDto : IValidatableObject
{
    public long Id { get; set; }
    [Required] [MaxLength(200)] public string Name { get; set; } = string.Empty;
    [Required] [MaxLength(200)] public string Issuer { get; set; } = string.Empty;
    [Range(1, 12)] public int? IssuedMonth { get; set; }
    [Required] [Year] public int? IssuedYear { get; set; }
    [Range(1, 12)] public int? ExpirationMonth { get; set; }
    [Year] public int? ExpirationYear { get; set; }
    public string? Description { get; set; }
    
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var now = DateTime.UtcNow;
        var issuedYear = IssuedYear ?? now.Year;
        var expirationMonth = ExpirationMonth ?? (ExpirationYear is null ? now.Month : null);
        var expirationYear = ExpirationYear ?? now.Year;
    
        if (issuedYear > expirationYear)
            yield return new ValidationResult("Invalid date range.", [nameof(IssuedYear)]);
            
        if (IssuedMonth > expirationMonth && expirationYear == issuedYear)
            yield return new ValidationResult("Invalid date range.", [nameof(IssuedMonth)]);
    }
}
