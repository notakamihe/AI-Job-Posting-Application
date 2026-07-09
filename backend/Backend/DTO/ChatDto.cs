namespace Backend.DTO;

public class ChatDto
{
	public long Id { get; set; }
	public List<UserDto> Users { get; set; } = [];
	public List<ChatMessageDto> Messages { get; set; } = [];
}