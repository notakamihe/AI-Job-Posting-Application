using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Backend.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string to, string subject, string body, List<IFormFile>? attachments)
    {
        var email = new MimeMessage();
        
        email.From.Add(new MailboxAddress(_configuration["MailSettings:Name"], _configuration["MailSettings:Email"]!));
        email.To.Add(MailboxAddress.Parse(to));
        email.Subject = subject;

        var builder = new BodyBuilder();

        if (attachments != null)
        {
            foreach (var file in attachments)
            {
                if (file.Length > 0)
                {
                    byte[] fileBytes;
                    
                    using (var ms = new MemoryStream())
                    {
                        file.CopyTo(ms);
                        fileBytes = ms.ToArray();
                    }
                    
                    builder.Attachments.Add(file.FileName, fileBytes, ContentType.Parse(file.ContentType));
                }
            }
        }
        
        builder.HtmlBody = body;
        email.Body = builder.ToMessageBody();
        
        using (var client = new SmtpClient())
        {
            await client.ConnectAsync(
                _configuration["MailSettings:Host"]!, 
                _configuration.GetValue<int>("MailSettings:Port"), 
                SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(
                _configuration["MailSettings:Username"]!, 
                _configuration["MailSettings:Password"]!);

            await client.SendAsync(email);
            await client.DisconnectAsync(true);
        }
    }
}