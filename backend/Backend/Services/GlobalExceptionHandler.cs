using Backend.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IProblemDetailsService _problemDetailsService;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IProblemDetailsService problemDetailsService)
    {
        _logger = logger;
        _problemDetailsService = problemDetailsService;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext, 
        Exception exception, 
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Unhandled exception. TraceId: {TraceId}", httpContext.TraceIdentifier);

        ProblemDetails problemDetails = exception switch 
        {
            AccountActionFailureException accountActionFailureException => 
                new ValidationProblemDetails(accountActionFailureException.Errors) 
                {
                    Type = "https://www.example.com/errors/account-action-failure",
                    Title = "Account action failed.",
                    Status = StatusCodes.Status400BadRequest,
                    Detail = accountActionFailureException.Message
                },
            ValidationException validationException => new ValidationProblemDetails(validationException.Errors) 
            {
                Title = "One or more validation errors occurred.",
                Status = StatusCodes.Status400BadRequest
            },
            SecurityTokenException securityTokenException => new ProblemDetails 
            {
                Type = "https://www.example.com/errors/invalid-token",
                Title = "Invalid token.",
                Status = StatusCodes.Status400BadRequest,
                Detail = securityTokenException.Message
            },
            InvalidUserException invalidUserException => new ProblemDetails 
            {
                Type = "https://www.example.com/errors/invalid-user",
                Title = "Invalid request for user.",
                Status = StatusCodes.Status400BadRequest,
                Detail = invalidUserException.Message
            },
            DoesNotExistException doesNotExistException => new ProblemDetails 
            {
                Type = "https://www.example.com/errors/resource-does-not-exist",
                Title = "Resource does not exist.",
                Status = StatusCodes.Status400BadRequest,
                Detail = doesNotExistException.Message
            },
            InvalidChatbotResponseException invalidChatbotResponseException => new ProblemDetails
            {
                Type = "https://www.example.com/errors/invalid-chatbot-response",
                Title = "Invalid chatbot response.",
                Status = StatusCodes.Status400BadRequest,
                Detail = invalidChatbotResponseException.Message
            },
            ForbiddenException forbiddenException => new ProblemDetails
            { 
                Title = "Forbidden.",
                Status = StatusCodes.Status403Forbidden,
                Detail = forbiddenException.Message
            },
            NotFoundException notFoundException => new ProblemDetails 
            {
                Title = "Not Found.",
                Status = StatusCodes.Status404NotFound,
                Detail = notFoundException.Message
            },
            AlreadyExistsException alreadyExistsException => new ProblemDetails 
            {
                Type = "https://www.example.com/errors/resource-already-exists",
                Title = "Resource already exists.",
                Status = StatusCodes.Status409Conflict,
                Detail = alreadyExistsException.Message
            },
            _ => new ProblemDetails
            {
                Title = "An error occurred while processing your request.",
                Status = StatusCodes.Status500InternalServerError,
                Detail = exception.Message
            }
        };

        problemDetails.Detail = string.IsNullOrEmpty(problemDetails.Detail) ? null : problemDetails.Detail;
        httpContext.Response.StatusCode = (int)problemDetails.Status!;

        return await _problemDetailsService.TryWriteAsync(new ProblemDetailsContext 
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problemDetails
        });
    }
}