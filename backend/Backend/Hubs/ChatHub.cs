using Backend.DTO;
using Backend.Extensions;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Backend.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IAuthorizationService _authorizationService;
    private readonly IChatService _chatService;
    private readonly IUserService _userService;

    public ChatHub(IAuthorizationService authorizationService, IChatService chatService, IUserService userService)
    {
        _authorizationService = authorizationService;
        _chatService = chatService;
        _userService = userService;
    }

    public async Task<ChatDto> CreateChat(List<string> userIds, ChatMessagePayload message)
    {
        if (Context.UserIdentifier is null)
            throw new HubException("Unauthorized.");

        if (userIds.All(u => u != Context.UserIdentifier))
            userIds.Add(Context.UserIdentifier);

        var users = await _userService.GetByIdsAsync(userIds);

        foreach (var id in userIds)
        {
            if (users.All(u => u.Id != id))
                throw new HubException($"User with ID of {id} not found.");
        }

        var request = new CreateChatMessagePayload { Message = message.Message, SentBy = Context.UserIdentifier };
        var chat = await _chatService.CreateAsync(users, request);

        await Clients.Users(userIds).SendAsync("NewChat", chat.ToDto());
        return chat.ToDto();
    }

    public async Task DeleteMessage(long chatId, long messageId)
    {
        var chat = await _chatService.GetByIdAsync(chatId);

        if (chat is null)
            throw new HubException($"Chat with the ID of {chatId} does not exist.");

        if (Context.User is null || Context.UserIdentifier is null)
            throw new HubException("Unauthorized.");

        var result = await _authorizationService.AuthorizeAsync(Context.User, chat, "ChatParticipantOrAdmin");

        if (!result.Succeeded)
            throw new HubException("Must be one of the chat's participants.");

        var message = chat.ChatMessages.Find(m => m.Id == messageId);

        if (message is null)
            throw new HubException($"Message with the ID of {messageId} not found in chat.");

        result = await _authorizationService.AuthorizeAsync(Context.User, message, "ChatMessageSender");

        if (!result.Succeeded)
            throw new HubException("Must be the sender of the chat message to delete it.");

        await _chatService.DeleteMessageAsync(chat, message);
        await Clients.Users(chat.Users.Select(u => u.Id)).SendAsync("MessageDeleted", chatId, messageId);
    }

    public async Task LeaveChat(long chatId)
    {
        var chat = await _chatService.GetByIdAsync(chatId);

        if (chat is null)
            throw new HubException($"Chat with the ID of {chatId} does not exist.");

        if (Context.User is null || Context.UserIdentifier is null)
            throw new HubException("Unauthorized.");

        var result = await _authorizationService.AuthorizeAsync(Context.User, chat, "ChatParticipantOrAdmin");

        if (!result.Succeeded)
            throw new HubException("Must be one of the chat's participants.");
            
        var userIds = chat.Users.Select(u => u.Id).ToList();

        await _chatService.LeaveAsync(chat, Context.UserIdentifier);
        await Clients.Users(userIds).SendAsync("LeftChat", chatId, Context.UserIdentifier);
    }

    public async Task ReadMessage(long chatId, long messageId)
    {
        var chat = await _chatService.GetByIdAsync(chatId);

        if (chat is null)
            throw new HubException($"Chat with the ID of {chatId} does not exist.");

        if (Context.User is null || Context.UserIdentifier is null)
            throw new HubException("Unauthorized.");

        var result = await _authorizationService.AuthorizeAsync(Context.User, chat, "ChatParticipantOrAdmin");

        if (!result.Succeeded)
            throw new HubException("Must be one of the chat's participants.");

        var message = chat.ChatMessages.Find(m => m.Id == messageId);

        if (message is null)
            throw new HubException($"Message with the ID of {messageId} not found in chat.");

        await _chatService.ReadMessageAsync(message, Context.UserIdentifier);
        await Clients
            .Users(chat.Users.Select(u => u.Id))
            .SendAsync("MessageRead", chatId, messageId, Context.UserIdentifier);
    }

    public async Task<ChatMessageDto> SendMessage(long chatId, CreateChatMessagePayload payload)
    {
        var chat = await _chatService.GetByIdAsync(chatId);

        if (chat is null)
            throw new HubException($"Chat with the ID of {chatId} does not exist.");

        if (Context.User is null || Context.UserIdentifier is null)
            throw new HubException("Unauthorized.");
            
        payload.SentBy = Context.UserIdentifier;

        var result = await _authorizationService.AuthorizeAsync(Context.User, chat, "ChatParticipantOrAdmin");

        if (!result.Succeeded)
            throw new HubException("Must be one of the chat's participants.");

        var message = await _chatService.CreateMessageAsync(chat, payload);

        await Clients.Users(chat.Users.Select(u => u.Id)).SendAsync("MessageReceived", chatId, message.ToDto());
        return message.ToDto();
    }

    public async Task StartTyping(long chatId)
    {
        var chat = await _chatService.GetByIdAsync(chatId);

        if (chat is null)
            throw new HubException($"Chat with the ID of {chatId} does not exist.");

        if (Context.User is null || Context.UserIdentifier is null)
            throw new HubException("Unauthorized.");

        var result = await _authorizationService.AuthorizeAsync(Context.User, chat, "ChatParticipantOrAdmin");

        if (!result.Succeeded)
            throw new HubException("Must be one of the chat's participants.");

        await Clients.Users(chat.Users.Select(u => u.Id)).SendAsync("TypingStarted", chatId, Context.UserIdentifier);
    }

    public async Task StopTyping(long chatId)
    {
        var chat = await _chatService.GetByIdAsync(chatId);

        if (chat is null)
            throw new HubException($"Chat with the ID of {chatId} does not exist.");
        
        if (Context.User is null || Context.UserIdentifier is null)
            throw new HubException("Unauthorized.");

        var result = await _authorizationService.AuthorizeAsync(Context.User, chat, "ChatParticipantOrAdmin");

        if (!result.Succeeded)
            throw new HubException("Must be one of the chat's participants.");
        
        await Clients.Users(chat.Users.Select(u => u.Id)).SendAsync("TypingStopped", chatId, Context.UserIdentifier);
    }

    public async Task UpdateMessage(long chatId, long messageId, ChatMessagePayload payload)
    {
        var chat = await _chatService.GetByIdAsync(chatId);

        if (chat is null)
            throw new HubException($"Chat with the ID of {chatId} does not exist.");

        if (Context.User is null || Context.UserIdentifier is null)
            throw new HubException("Unauthorized.");

        var result = await _authorizationService.AuthorizeAsync(Context.User, chat, "ChatParticipantOrAdmin");

        if (!result.Succeeded)
            throw new HubException("Must be one of the chat's participants.");

        var message = chat.ChatMessages.Find(m => m.Id == messageId);
        
        if (message is null)
            throw new HubException($"Message with the ID of {messageId} not found in chat.");
        
        result = await _authorizationService.AuthorizeAsync(Context.User, message, "ChatMessageSender");

        if (!result.Succeeded)
            throw new HubException("Must be the sender of the chat message to update it.");

        await _chatService.UpdateMessageAsync(message, payload);
        await Clients.Users(chat.Users.Select(u => u.Id)).SendAsync("MessageUpdated", chatId, messageId, message.ToDto());
    }
}