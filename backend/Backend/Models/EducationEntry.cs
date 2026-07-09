using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class EducationEntry
{
	public long Id { get; set; }
	public string ApplicantId { get; set; } = string.Empty;
	public Applicant Applicant { get; set; } = null!;
	[Required] [MaxLength(200)] public string Institution { get; set; } = string.Empty;
	public int? StartMonth { get; set; }
	[Required] public int StartYear { get; set; }
	public int? EndMonth { get; set; }
	public int? EndYear { get; set; }
	[MaxLength(200)] public string? InstitutionLocation { get; set; }
	[MaxLength(100)] public string? Major { get; set; }
	[MaxLength(100)] public string? Degree { get; set; }
}
