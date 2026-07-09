using System.ComponentModel.DataAnnotations;
using Backend.Models;

namespace Backend.DTO;

public class JobApplicationQuestionDto
{
    public long Id { get; set; }
    [Required] public string Question { get; set; } = string.Empty;
    public JobApplicationQuestionType? Type { get; set; }
    public bool IsRequired { get; set; }
}
