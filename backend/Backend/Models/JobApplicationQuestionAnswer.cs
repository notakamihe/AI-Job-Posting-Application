using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class JobApplicationQuestionAnswer
{
	public long JobApplicationQuestionId { get; set; }
	public JobApplicationQuestion JobApplicationQuestion { get; set; } = null!;
	public string ApplicantId { get; set; } = string.Empty;
	public Applicant Applicant { get; set; } = null!;
	[Required] public string Answer { get; set; } = string.Empty;
}
