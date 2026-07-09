using Backend.DTO;
using Backend.Extensions;
using Backend.Models;
using Microsoft.Extensions.AI;
using OpenAI;
using Pgvector;
using System.Text;
using Backend.Repositories;

namespace Backend.Services
{
    public class AiService : IAiService
    {
        private readonly IChatClient _chatClient;
        private readonly IEntityQueryRepository _entityQueryRepository;
        private readonly IEmbeddingGenerator<string, Embedding<float>> _generator;

        private const string ChatbotInstructions = 
            """
            You are a helpful job post site assistant. Answer user questions clearly, directly, and concisely.
            
            Use only plain text with line breaks for separation. Bold (with double asterisk) and italic formating is allowed.
            
            IMPORTANT: 
            Do NOT use any other formatting. That includes
            - No dashes (-)
            - No bullet points
            - No special characters
            
            DO NOT repeat any information that is already specified in the relevant items.
            At best, you may briefly summarize the relevant items in one to two sentences, max 50 words.
            
            IMPORTANT: If you wish to mention information about the query user (e.g. name, work experience, education, etc.) or if the user asks their own information, only reference the context's Query User Information
            
            Focus only on providing additional information and suggestions that may be helpful.
            DO NOT, under any circumstance, mention other job posting sites like Glassdoor, Indeed, Linkedin, etc
            
            Be sure to respond in natural language. Keep all responses under 200 words.
            """;

        public AiService(
            IConfiguration configuration,
            IEntityQueryRepository entityQueryRepository,
            OpenAIClient openAiClient)
        {
            _chatClient = openAiClient.GetChatClient(configuration["OpenAI:ChatModel"]).AsIChatClient();
            _generator = openAiClient.GetEmbeddingClient(configuration["OpenAI:EmbeddingModel"]).AsIEmbeddingGenerator();
            _entityQueryRepository = entityQueryRepository;
        }

        public async IAsyncEnumerable<ChatbotResponseUpdate> GetRAGStreamingResponseAsync(
            string query, 
            User? user,
            List<Microsoft.Extensions.AI.ChatMessage> history,
            ChatOptions? options = null)
        {
            List<Microsoft.Extensions.AI.ChatMessage> messages = [
                new Microsoft.Extensions.AI.ChatMessage(ChatRole.User, query),
                new Microsoft.Extensions.AI.ChatMessage(ChatRole.System, $"Today is: {DateTime.Now.ToLongDateString()}")
            ];

            var response = await _chatClient.GetResponseAsync<ChatbotQueryResponse>(
                messages,
                new ChatOptions { Temperature = 0 });

            StringBuilder stringBuilder = new StringBuilder(query);

            if (user is not null)
            {
                if (response.Result.WantsResults &&
                    !response.Result.ExplicitLocation &&
                    !string.IsNullOrEmpty(user.Location))
                    stringBuilder.Append($" I am located in {user.Location}.");
                
                if (response.Result.IsPersonalized)
                    stringBuilder.Append("\n\n" + user.ToEmbeddingInputString());
            }

            List<EntityQueryType> types = [];

            if (response.Result.WantsResults && !response.Result.IsProhibited)
            {
                var specific =
                    response.Result.WantsApplicants ||
                    response.Result.WantsEmployers ||
                    response.Result.WantsJobPosts;

                if (specific ? response.Result.WantsApplicants : user is not Applicant)
                    types.Add(EntityQueryType.Applicant);

                if (specific ? response.Result.WantsEmployers : user is not Employer)
                    types.Add(EntityQueryType.Employer);

                if (specific ? response.Result.WantsJobPosts : user is not Employer)
                    types.Add(EntityQueryType.JobPost);
            }

            var filter = new EntityFilter
            {
                Types = types,
                Applicant = response.Result.ApplicantFilter,
                Employer = response.Result.EmployerFilter,
                JobPost = response.Result.JobPostFilter
            };

            var queryVector = new Vector(await _generator.GenerateVectorAsync(stringBuilder.ToString()));
            var relevant = await _entityQueryRepository.GetRelevantEntitiesAsync(queryVector, filter, user);

            messages = [
                new Microsoft.Extensions.AI.ChatMessage(ChatRole.System, ChatbotInstructions),
                ..history,
                new Microsoft.Extensions.AI.ChatMessage(
                    ChatRole.System,
                    user is not null
                        ? $"THE FOLLOWING IS THE CURRENT USER INFORMATION. USE THIS AS YOUR KNOWLEDGE OF THE CURRENT USER:\n{user.ToEmbeddingInputString()}"
                        : "NO CURRENT USER INFORMATION AVAILABLE")
            ];

            if (relevant.Count > 0)
            {
                stringBuilder = new StringBuilder(
                    "USE THE FOLLOWING ITEMS IN YOUR TEXT RESPONSE BUT REMEMBER THAT ANY PERSON MENTIONED IS NOT THE CURRENT USER:\n\n");

                foreach (var item in relevant)
                {
                    if (item is JobPost post)
                        stringBuilder.AppendLine(post.ToEmbeddingInputString());
                    else if (item is User userItem)
                        stringBuilder.AppendLine(userItem.ToEmbeddingInputString());
                }

                messages.Add(new Microsoft.Extensions.AI.ChatMessage(ChatRole.System, stringBuilder.ToString()));
            }

            messages.Add(new Microsoft.Extensions.AI.ChatMessage(ChatRole.User, query));

            CancellationToken cancellationToken = new CancellationTokenSource(TimeSpan.FromSeconds(30)).Token;
            stringBuilder = new StringBuilder();

            await foreach (var update in _chatClient.GetStreamingResponseAsync(messages, options, cancellationToken))
            {
                stringBuilder.Append(update.Text);
                yield return new ChatbotResponseUpdate { Text = stringBuilder.ToString() };
            }

            yield return new ChatbotResponseUpdate { Text = stringBuilder.ToString(), RelevantItems = relevant };
        }

        public async Task<Vector> GenerateVectorAsync(User user)
        {
            return new Vector(await _generator.GenerateVectorAsync(user.ToEmbeddingInputString()));
        }

        public async Task<Vector> GenerateVectorAsync(JobPost post)
        {
            return new Vector(await _generator.GenerateVectorAsync(post.ToEmbeddingInputString()));
        }
    }
}
