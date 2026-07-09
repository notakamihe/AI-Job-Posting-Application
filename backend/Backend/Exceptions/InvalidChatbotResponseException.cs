namespace Backend.Exceptions;

public class InvalidChatbotResponseException: Exception
{
    public InvalidChatbotResponseException(string message = ""): base(message)
    {
    }
}