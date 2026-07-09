namespace Backend.Models;

public class ChatMessageItem
{
    public long Id { get; set; }
    public long ChatMessageId { get; set; }
    public ChatMessage ChatMessage { get; set; } = null!;
    public string? UserId { get; set; }
    public User? User { get; set; }
    public long? JobPostId { get; set; }
    public JobPost? JobPost { get; set; }
}
