using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using Pgvector;

namespace Backend.Models;

public class JobPost
{
    public long Id { get; set; }
    public string EmployerId { get; set; } = string.Empty;
    public Employer Employer { get; set; } = null!;
    [Required] [MaxLength(200)] public string Title { get; set; } = string.Empty;
    [Required] public string Summary { get; set; } = string.Empty;
    public DateTime PostedAt { get; set; } = DateTime.UtcNow;
    public decimal? PayLowEnd { get; set; }
    public decimal? PayHighEnd { get; set; }
    [Column(TypeName = "varchar(20)")] public EmploymentMedium? Medium { get; set; }
    [Required] public string Schedule { get; set; } = string.Empty;
    [Required] [Column(TypeName = "varchar(20)")] public EmploymentType EmploymentType { get; set; }
    public string? AdditionalDetails { get; set; }
    [Column(TypeName = "vector(1536)")] public Vector? Embedding { get; set; }
    public List<Qualification> Qualifications { get; set; } = [];
    public List<Responsibility> Responsibilities { get; set; } = [];
    public List<Skill> Skills { get; set; } = [];
    public List<Applicant> SavedBy { get; set; } = []; 
    public List<JobApplicationQuestion> JobApplicationQuestions { get; set; } = [];
    public List<Applicant> Applicants { get; set; } = [];
    public List<JobApplication> JobApplications { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmploymentMedium
{
    [JsonStringEnumMemberName("On-site")] Onsite,
    Hybrid,
    Remote
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EmploymentType
{
    [JsonStringEnumMemberName("Full-time")] FullTime,
    [JsonStringEnumMemberName("Part-time")] PartTime,
    Contract,
    Freelance,
    Internship,
    Seasonal,
    Apprenticeship
}
