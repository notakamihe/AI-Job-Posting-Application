using Backend.DTO;
using Backend.Models;

namespace Backend.Services;

public interface IChatService
{
    Task<Chat> CreateAsync(List<User> users, CreateChatMessagePayload? request = null);
    Task<ChatMessage> CreateChatbotResponseMessageAsync(
        Chat chat, 
        ChatMessage respondingTo, 
        string messageText, 
        IEnumerable<object> items);
    Task<ChatMessage> CreateMessageAsync(Chat chat, CreateChatMessagePayload request);
    Task<Chat> CreateWithChatbotAsync(User user);
    Task DeleteMessageAsync(Chat chat, ChatMessage message);
    Task<List<Chat>> GetAllAsync();
    Task<Chat?> GetByIdAsync(long id);
    Task<List<Chat>> GetByParticipantsAsync(List<User> users);
    IAsyncEnumerable<ChatbotResponseUpdate> GetChatbotSteamingResponseAsync(
        Chat chat, 
        ChatMessage respondingTo, 
        User? user);
    Task LeaveAsync(Chat chat, string userId);
    Task ReadMessageAsync(ChatMessage message, string userId);
    Task UpdateMessageAsync(ChatMessage message, ChatMessagePayload payload);
}