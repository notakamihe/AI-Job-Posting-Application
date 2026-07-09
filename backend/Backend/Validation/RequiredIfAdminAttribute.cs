using System.ComponentModel.DataAnnotations;

namespace Backend.Validation;

public class RequiredIfAdminAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        var httpContextAccessor = (IHttpContextAccessor?)validationContext.GetService(typeof(IHttpContextAccessor));

        if (httpContextAccessor?.HttpContext?.User?.IsInRole("Admin") is true)
        {
            if (value is null || string.IsNullOrWhiteSpace(value.ToString()))
                return new ValidationResult(ErrorMessage ?? $"The {validationContext.DisplayName} field is required.");
        }

        return ValidationResult.Success;
    }
}
