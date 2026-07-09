namespace Backend.Models;

public class JobApplication
{
    public string ApplicantId { get; set; } = string.Empty;
    public Applicant Applicant { get; set; } = null!;
    public long JobPostId { get; set; }
    public JobPost JobPost { get; set; } = null!;
}
