using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class WorkExperienceEntry
{
	public long Id { get; set; }
	public string ApplicantId { get; set; } = string.Empty;
	public Applicant Applicant { get; set; } = null!;
	[Required] [MaxLength(200)] public string Position { get; set; } = string.Empty;
	[MaxLength(250)] public string? Employer { get; set; }
	public int? StartMonth { get; set; }
	public int StartYear { get; set; }
	public int? EndMonth { get; set; }
	public int? EndYear { get; set; }
	public string? Description { get; set; }
}
