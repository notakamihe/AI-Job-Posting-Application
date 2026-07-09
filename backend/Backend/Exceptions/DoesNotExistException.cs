namespace Backend.Exceptions;

public class DoesNotExistException : Exception
{
    public DoesNotExistException(string message = ""): base(message)
    {
    }
}
