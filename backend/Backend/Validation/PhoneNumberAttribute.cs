using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Backend.Validation;

public class PhoneNumberAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is string phoneNumber)
        {
            if (Regex.IsMatch(phoneNumber, @"^\+\d{9,15}$"))
                return ValidationResult.Success;
        }
        
        return new ValidationResult("Invalid phone number format.");
    }
}
