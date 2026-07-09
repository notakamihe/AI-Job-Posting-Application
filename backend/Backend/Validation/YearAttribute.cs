using System.ComponentModel.DataAnnotations;

namespace Backend.Validation;

public class YearAttribute : ValidationAttribute
{
     protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
     {
          if (value is int year && (year < 1900 || year > 2100))
               return new ValidationResult("Year must be between 1900 and 2100.");

          return ValidationResult.Success;
     }
}