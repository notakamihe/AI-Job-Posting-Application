using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;
using Pgvector;

namespace Backend.Models;

public class User : IdentityUser
{
	[MaxLength(64)] public string? RefreshToken { get; set; }
	public DateTime RefreshTokenExpiry { get; set; }
	[MaxLength(100)] public string? Industry { get; set; }
	[MaxLength(200)] public string? Location { get; set; }
	[Column(TypeName = "vector(1536)")] public Vector? Embedding { get; set; }
	public List<Chat> Chats { get; set; } = [];
	public List<ChatMessage> ReadChatMessages = [];
}