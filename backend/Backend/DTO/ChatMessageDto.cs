using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class ChatMessageBaseDto
{
	public long Id { get; set; }
	public DateTime SentAt { get; set; }
	public DateTime UpdatedAt { get; set; }
	public UserDto SentBy { get; set; } = null!;
	public string Message { get; set; } = string.Empty;
	public List<object> Items { get; set; } = [];
	public List<UserDto> ReadBy { get; set; } = [];
}

public class ChatMessageDto : ChatMessageBaseDto
{
	public ChatMessageBaseDto? RepliedTo { get; set; }
}

public class ChatMessagePayload 
{
	[Required] public string Message { get; set; } = string.Empty;
	public long? RepliedTo { get; set; }
}

public class CreateChatMessagePayload : ChatMessagePayload
{
	public string SentBy { get; set; } = string.Empty;
}