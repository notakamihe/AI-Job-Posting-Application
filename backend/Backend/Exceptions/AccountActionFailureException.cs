using Microsoft.AspNetCore.Identity;

namespace Backend.Exceptions;

public class AccountActionFailureException : Exception
{
    public Dictionary<string, string[]> Errors { get; set; }

    public AccountActionFailureException(string message = ""): base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public AccountActionFailureException(IEnumerable<IdentityError> errors): base("")
    {
        Errors = errors 
            .Where(e => e.Code != "DuplicateUserName")
            .GroupBy(e => e.Code.Contains("Email") ? "Email" : e.Code.Contains("Password") ? "Password" : e.Code)
            .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
    }
}
