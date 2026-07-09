namespace Backend.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, List<IFormFile>? attachments = null);
}