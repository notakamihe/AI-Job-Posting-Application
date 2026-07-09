using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class Qualification
{
	public long Id { get; set; }
	public long JobPostId { get; set; }
	public JobPost JobPost { get; set; } = null!;
	[Required] [MaxLength(500)] public string Description { get; set; } = string.Empty;
}
