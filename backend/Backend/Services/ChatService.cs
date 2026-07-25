using Backend.DTO;
using Backend.Models;
using Microsoft.Extensions.AI;
using System.Text;
using Backend.Repositories;
using ChatMessage = Backend.Models.ChatMessage;
using Microsoft.AspNetCore.SignalR;
using Backend.Exceptions;

namespace Backend.Services;

public class ChatService : IChatService
{
    private readonly IAiService _aiService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserService _userService;

    public ChatService(IAiService aiService, IUnitOfWork unitOfWork, IUserService userService)
    {
        _aiService = aiService;
        _unitOfWork = unitOfWork;
        _userService = userService;
    }

    public async Task<ChatMessage> CreateChatbotResponseMessageAsync(
        Chat chat, 
        ChatMessage respondingTo, 
        string messageText,
        IEnumerable<object> items)
    {
        if (respondingTo.SentById == "chatbot")
            throw new InvalidChatbotResponseException("Cannot respond to message sent by chatbot.");

        var chatbot = await _userService.GetByIdAsync("chatbot", includeChatbot: true);
        ChatMessage message = new ChatMessage { Chat = chat, SentBy = chatbot!, Message = messageText };

        foreach (var item in items)
        {
            if (item is JobPost post && message.ChatMessageItems.All(i => i.JobPost?.Id != post.Id))
                message.ChatMessageItems.Add(new ChatMessageItem { ChatMessage = message, JobPost = post });
            else if (item is User user && message.ChatMessageItems.All(i => i.User?.Id != user.Id))
                message.ChatMessageItems.Add(new ChatMessageItem { ChatMessage = message, User = user });
        }

        chat.ChatMessages.RemoveAll(m => m.SentAt > respondingTo.SentAt);
        chat.ChatMessages.Add(message);
        await _unitOfWork.CompleteAsync();

        return message;
    }
    
    public async Task<Chat> CreateAsync(List<User> users, CreateChatMessagePayload? request = null)
    {
        await using var transaction = await _unitOfWork.StartTransactionAsync();

        try
        {
            if (users.Count < 2)
                throw new HubException("Chat must have at least two users.");

            if (users.Any(u => users.Count(x => x.Id == u.Id) > 1))
                throw new HubException("Chat must not contain duplicate users.");

            var chat = new Chat();
            _unitOfWork.Chats.Add(chat);

            var chats = await _unitOfWork.Chats.GetByUsersAsync(users);
            var existing = chats.Find(c => c.Users.Count == users.Count);

            if (existing is not null)
                throw new HubException(
                    $"Another chat with the same combination of users already exists with the ID of {existing.Id}.");

            foreach (var user in users)
                chat.Users.Add(user);

            await _unitOfWork.CompleteAsync();

            if (request is not null)
                await CreateMessageAsync(chat, request);

            await transaction.CommitAsync();
            return chat;
        } 
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<ChatMessage> CreateMessageAsync(Chat chat, CreateChatMessagePayload request)
    {
        var sentBy = await _userService.GetByIdAsync(request.SentBy);

        if (sentBy is null)
            throw new HubException($"Sender with the ID {request.SentBy} does not exist.");

        if (chat.Users.All(u => u.Id != sentBy.Id))
            throw new HubException("Sender is not a participant in the chat.");

        var message = new ChatMessage { Chat = chat, SentBy = sentBy };
        chat.ChatMessages.Add(message);
        return await SaveMessageAsync(message, request);
    }

    public async Task<Chat> CreateWithChatbotAsync(User user)
    {
        var chatbot = await _userService.GetByIdAsync("chatbot", includeChatbot: true);
        var chat = await CreateAsync([user, chatbot!]);
        return chat;
    }

    public async Task DeleteMessageAsync(Chat chat, ChatMessage message)
    {
        chat.ChatMessages.Remove(message);
        await _unitOfWork.CompleteAsync();
    }

    public Task<List<Chat>> GetAllAsync()
    {
        return _unitOfWork.Chats.GetAllAsync();
    }

    public async Task<Chat?> GetByIdAsync(long id)
    {
        return await _unitOfWork.Chats.GetByIdAsync(id);
    }

    public async Task<List<Chat>> GetByParticipantsAsync(List<User> users)
    {
        return await _unitOfWork.Chats.GetByUsersAsync(users);
    }
    
    public async IAsyncEnumerable<ChatbotResponseUpdate> GetChatbotSteamingResponseAsync(
        Chat chat,
        ChatMessage respondingTo, 
        User? user)
    {
        if (respondingTo.SentById == "chatbot")
            throw new InvalidChatbotResponseException("Cannot respond to message sent by chatbot.");

        var previousMessages = chat.ChatMessages.Where(m => m.SentAt <= respondingTo.SentAt).TakeLast(20).ToList();
        List<Microsoft.Extensions.AI.ChatMessage> chatHistory = [];
        
        foreach (ChatMessage previousMessage in previousMessages)
        {
            StringBuilder stringBuilder = new StringBuilder(
                $"""
                PREVIOUS MESSAGE FROM CHAT HISTORY AT {previousMessage.SentAt}:
                {previousMessage.Message.Replace("\n", " ").Replace("\r", " ")}

                """);

            if (previousMessage.RepliedTo is not null)
            {
                var sender = previousMessage.RepliedTo.SentById == "chatbot" ? "Chatbot" : "User";
                stringBuilder.AppendLine(
                    $"""
                    └─ REPLYING TO MESSAGE BY {sender} AT {previousMessage.RepliedTo.SentAt}:
                       {previousMessage.RepliedTo.Message.Replace("\n", " ").Replace("\r", " ")}
                    """);
            }

            ChatRole role = previousMessage.SentById == "chatbot" ? ChatRole.Assistant : ChatRole.User;
            chatHistory.Add(new Microsoft.Extensions.AI.ChatMessage(role, stringBuilder.ToString()));
        }

        await foreach (var update in _aiService.GetRAGStreamingResponseAsync(respondingTo.Message, user, chatHistory))
        {
            yield return update;
        }
    }

    public async Task LeaveAsync(Chat chat, string userId)
    {
        chat.Users.RemoveAll(u => u.Id == userId);

        if (chat.Users.Count < 2)
        {
            _unitOfWork.Chats.Remove(chat);
        }
        else
        {
            var existing = (await _unitOfWork.Chats.GetByUsersAsync(chat.Users)).Find(c =>
                c.Id != chat.Id && c.Users.Count == chat.Users.Count);

            if (existing is not null)
                _unitOfWork.Chats.Remove(chat);
        }

        foreach (var message in chat.ChatMessages)
            message.ReadBy.RemoveAll(u => u.Id == userId);

        await _unitOfWork.CompleteAsync();
    }

    public async Task ReadMessageAsync(ChatMessage message, string userId)
    {
        var user = message.Chat.Users.Find(u => u.Id == userId);

        if (user is null)
            throw new HubException("Reader is not a participant in the chat.");

        if (message.ReadBy.All(u => u.Id != user.Id))
            message.ReadBy.Add(user);

        await _unitOfWork.CompleteAsync();
    }

    private async Task<ChatMessage> SaveMessageAsync(ChatMessage message, ChatMessagePayload payload)
    {
        ChatMessage? repliedTo = null;

        if (payload.RepliedTo is not null)
        {
            if (payload.RepliedTo == message.Id)
                throw new HubException("Message cannot reply to itself.");
        
            repliedTo = message.Chat.ChatMessages.Find(m => m.Id == payload.RepliedTo);

            if (repliedTo is null)
                throw new HubException($"Message with ID {payload.RepliedTo} does not exist in chat.");
        }

        message.Message = payload.Message;
        message.RepliedTo = repliedTo;

        await _unitOfWork.CompleteAsync();
        return message;
    }

    public async Task UpdateMessageAsync(ChatMessage message, ChatMessagePayload payload)
    {
        await SaveMessageAsync(message, payload);
    }
}