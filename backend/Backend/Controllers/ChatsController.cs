using System.Security.Claims;
using Backend.DTO;
using Backend.Exceptions;
using Backend.Extensions;
using Backend.Hubs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ChatMessage = Backend.Models.ChatMessage;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatsController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAuthorizationService _authorizationService;
    private readonly IChatService _chatService;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly IUserService _userService;

    public ChatsController(
        IAuthService authService, 
        IAuthorizationService authorizationService, 
        IChatService chatService, 
        IHubContext<ChatHub> hubContext,
        IUserService userService)
    {
        _authService = authService;
        _authorizationService = authorizationService;
        _chatService = chatService;
        _hubContext = hubContext;
        _userService = userService;
    }
    
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<ChatDto>>> GetChats([FromQuery] List<string> withUser)
    {
        var userIds = new List<string>(withUser);

        if (!User.IsInRole("Admin"))
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (userId is null)
                return Unauthorized();

            if (userIds.All(u => u != userId))
                userIds.Add(userId);
        }

        List<Chat> chats = [];

        if (userIds.Count > 0)
        {
            var users = await _userService.GetByIdsAsync(userIds, includeChatbot: true);

            foreach (var id in userIds)
            {
                if (users.All(u => u.Id != id))
                    return Problem(
                        statusCode: StatusCodes.Status404NotFound,
                        title: "Not Found.",
                        detail: $"User with ID of {id} not found.");
            }

            chats = await _chatService.GetByParticipantsAsync(users);
        }
        else 
        {
            chats = await _chatService.GetAllAsync();
        }
        
        return chats.Select(c => c.ToDto()).ToList();
    }
    
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<ChatDto>> GetChat(long id)
    {
        var chat = await _chatService.GetByIdAsync(id);
        
        if (chat == null)
            return NotFound();
            
        var result = await _authorizationService.AuthorizeAsync(User, chat, "ChatParticipantOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();
        
        return Ok(chat.ToDto());
    }

    [HttpPost("{id}/messages/{messageId}/chatbot")]
    [Authorize]
    public async IAsyncEnumerable<ChatbotResponseUpdate> PostChatMessageChatbotResponse(long id, long messageId)
    {
        var chat = await _chatService.GetByIdAsync(id);

        if (chat is null)
            throw new NotFoundException($"Chat with the ID of {id} not found.");
        
        var result = await _authorizationService.AuthorizeAsync(User, chat, "ChatParticipantOrAdmin");
        
        if (!result.Succeeded)
            throw new ForbiddenException();

        var message = chat.ChatMessages.Find(m => m.Id == messageId);

        if (message is null)
            throw new NotFoundException($"Message with the ID of {id} not found in chat.");

        result = await _authorizationService.AuthorizeAsync(User, message, "ChatMessageSender");
        
        if (!result.Succeeded)
            throw new ForbiddenException();

        var user = await _authService.GetCurrentUserAsync();

        if (user is null)
            throw new ForbiddenException();

        var messageText = "";
        IEnumerable<object> items = [];
            
        await foreach (var update in _chatService.GetChatbotSteamingResponseAsync(chat, message, user))
        {
            messageText = update.Text;
            items = update.RelevantItems;

            yield return new ChatbotResponseUpdate
            {
                Text = update.Text,
                RelevantItems = update.RelevantItems.Select<object, object>(i => 
                    i is JobPost post ? post.ToDto() : ((User)i).ToDto())
            };
        }

        ChatMessage chatbotMessage = await _chatService.CreateChatbotResponseMessageAsync(
            chat, 
            message, 
            messageText, 
            items);

        await _hubContext.Clients
            .Users(chat.Users.Select(u => u.Id))
            .SendAsync("ChatbotMessageReceived", chat.Id, chatbotMessage.ToDto(), message.Id);
    }
}