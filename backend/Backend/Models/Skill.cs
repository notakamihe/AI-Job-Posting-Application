using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

[Index(nameof(Name), IsUnique = true)]
public class Skill
{
	public long Id { get; set; }
	[Required] [MaxLength(100)] public string Name { get; set; } = string.Empty;
	public List<Applicant> Applicants { get; set; } = [];
	public List<JobPost> JobPosts { get; set; } = [];
}
