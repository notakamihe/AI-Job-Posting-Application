using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class ChatMessage
{
	public long Id { get; set; }
	public long ChatId { get; set; }
	public Chat Chat { get; set; } = null!;
	[Required] public string SentById { get; set; } = string.Empty;
	public User SentBy { get; set; } = null!;
	[Required] public string Message { get; set; } = string.Empty;
	public DateTime SentAt { get; set; }
	public DateTime UpdatedAt { get; set; }
	public long? RepliedToId { get; set; }
	public ChatMessage? RepliedTo { get; set; }
	public List<ChatMessageItem> ChatMessageItems { get; set; } = [];
	public List<User> ReadBy { get; set; } = [];
}
