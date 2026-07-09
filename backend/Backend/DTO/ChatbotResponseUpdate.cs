namespace Backend.DTO;

public class ChatbotResponseUpdate
{
    public string Text { get; set; } = string.Empty;
    public IEnumerable<object> RelevantItems { get; set; } = [];
}
