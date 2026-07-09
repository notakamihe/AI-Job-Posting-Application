using Backend.DTO;
using Backend.Models;
using Microsoft.Extensions.AI;
using Pgvector;

namespace Backend.Services
{
    public interface IAiService
    {
        IAsyncEnumerable<ChatbotResponseUpdate> GetRAGStreamingResponseAsync(
            string query,
            User? user,
            List<Microsoft.Extensions.AI.ChatMessage> history,
            ChatOptions? options = null);
        Task<Vector> GenerateVectorAsync(JobPost post);
        Task<Vector> GenerateVectorAsync(User user);
    }
}
