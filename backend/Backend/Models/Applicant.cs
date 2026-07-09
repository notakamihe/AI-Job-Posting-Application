using System.ComponentModel.DataAnnotations;
using EntityFrameworkCore.Projectables;

namespace Backend.Models;

public class Applicant : User
{
    [Required] [MaxLength(50)] public string FirstName { get; set; } = string.Empty;
    [MaxLength(50)] public string? MiddleName { get; set; }
    [Required] [MaxLength(50)] public string LastName { get; set; } = string.Empty;
    [MaxLength(2048)] public string? Link1 { get; set; }
    [MaxLength(2048)] public string? Link2 { get; set; }
    [MaxLength(100)] public string? PreferredOccupation { get; set; }
    public bool IsPrivate { get; set; }
    public bool ReadyToWork { get; set; }
    public string? About { get; set; }
    public List<WorkExperienceEntry> WorkExperience { get; set; } = [];
    public List<EducationEntry> Education { get; set; } = [];
    public List<CertificateOrLicense> CertificationsAndLicenses { get; set; } = [];
    public List<Skill> Skills { get; set; } = [];
    public List<Employer> Following { get; set; } = [];
    public List<JobPost> AppliedTo { get; set; } = [];
    public List<JobApplication> JobApplications { get; set; } = [];
    public List<JobPost> Saved { get; set; } = [];
    public List<JobApplicationQuestion> JobApplicationQuestions { get; set; } = [];
    public List<JobApplicationQuestionAnswer> JobApplicationQuestionAnswers { get; set; } = [];
    public List<Review> Reviews { get; set; } = [];

    [Projectable] 
    public string FullName => FirstName + " " + (!string.IsNullOrEmpty(MiddleName) ? MiddleName + " " : "") + LastName; 
}
