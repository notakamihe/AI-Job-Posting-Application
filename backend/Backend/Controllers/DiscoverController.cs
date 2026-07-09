using Backend.DTO;
using Backend.Extensions;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DiscoverController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly IAuthService _authService;
        private readonly IDiscoverService _discoverService;

        public DiscoverController(IAiService aiService, IAuthService authService, IDiscoverService discoverService)
        {
            _aiService = aiService;
            _authService = authService;
            _discoverService = discoverService;
        }

        [HttpGet("")]
        public async Task<ActionResult<PaginatedResults<object>>> GetDiscover(
            [FromQuery] DiscoverFilter filter,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var user = await _authService.GetCurrentUserAsync();
            var results = await _discoverService.DiscoverAsync(filter, user, page, pageSize);
            var count = await _discoverService.CountDiscoverAsync(filter, user);

            return Ok(new PaginatedResults<object>
            {
                Results = results
                    .Select<object, object>(e => e is JobPost post ? post.ToDto(true) : ((User)e).ToDto())
                    .ToList(),
                Page = page,
                PageCount = (int)Math.Ceiling((double)count / pageSize),
                TotalCount = count
            });
        }

        [HttpGet("ask")]
        public async IAsyncEnumerable<ChatbotResponseUpdate> GetAsk(string query)
        {
            var user = await _authService.GetCurrentUserAsync();

            await foreach (var update in _aiService.GetRAGStreamingResponseAsync(query, user, []))
            {
                yield return new ChatbotResponseUpdate
                {
                    Text = update.Text,
                    RelevantItems = update.RelevantItems.Select<object, object>(i => 
                        i is JobPost post ? post.ToDto() : ((User)i).ToDto())
                };
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<PaginatedResults<object>>> GetSearch(
            string term,
            [FromQuery] DiscoverFilter filter,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var user = await _authService.GetCurrentUserAsync();
            var results = await _discoverService.SearchAsync(term, filter, user, page, pageSize);
            var count = await _discoverService.CountSearchAsync(term, filter, user);
            
            return Ok(new PaginatedResults<object>
            {
                Results = results
                    .Select<object, object>(e => e is JobPost post ? post.ToDto(true) : ((User)e).ToDto())
                    .ToList(),
                Page = page,
                PageCount = (int)Math.Ceiling((double)count / pageSize),
                TotalCount = count
            });
        }
    }
}
