using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Backend.Models;

public class JobApplicationQuestion
{
	public long Id { get; set; }
	public long JobPostId { get; set; }
	public JobPost JobPost { get; set; } = null!;
	[Required] public string Question { get; set; } = string.Empty;
	[Required] [Column(TypeName = "varchar(20)")] public JobApplicationQuestionType Type { get; set; }
	public bool IsRequired { get; set; }
	public List<Applicant> Applicants { get; set; } = [];
	public List<JobApplicationQuestionAnswer> JobApplicationQuestionAnswers { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum JobApplicationQuestionType
{
	Text,
	Number,
	TextArea,
	Binary
}