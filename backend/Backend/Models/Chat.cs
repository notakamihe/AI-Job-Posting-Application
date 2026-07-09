namespace Backend.Models;

public class Chat
{
	public long Id { get; set; }
	public List<ChatMessage> ChatMessages { get; set; } = [];
	public List<User> Users { get; set; } = [];
}
