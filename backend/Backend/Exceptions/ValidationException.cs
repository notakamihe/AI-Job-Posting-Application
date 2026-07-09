namespace Backend.Exceptions;

public class ValidationException : Exception
{
    public IDictionary<string, string[]> Errors { get; set; }

    public ValidationException(IDictionary<string, string[]> errors) 
    {
        Errors = errors;    
    }
}
