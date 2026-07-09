using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class JobApplicationQuestionAnswerDto
{
    public JobApplicationQuestionDto Question { get; set; } = null!;
    public string Answer { get; set; } = string.Empty;
}

public class JobApplicationQuestionAnswerItemRequest
{
    [Required] public long? QuestionId { get; set; }
    [Required] public string Answer { get; set; } = string.Empty;
}