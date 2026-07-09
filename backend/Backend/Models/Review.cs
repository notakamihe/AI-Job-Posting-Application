using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Review
{
	public long Id { get; set; }
	public string ReviewerId { get; set; } = string.Empty;
	public Applicant Reviewer { get; set; } = null!;
	public string EmployerId { get; set; } = string.Empty;
	public Employer Employer { get; set; } = null!;
	[Required] public double Rating { get; set; }
	[Required] [MaxLength(200)] public string Title { get; set; } = string.Empty;
	[Required] public string Description { get; set; } = string.Empty;
}
