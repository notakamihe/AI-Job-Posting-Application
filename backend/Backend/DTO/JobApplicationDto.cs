using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class BaseJobApplicationDto
{
	public List<JobApplicationQuestionAnswerDto> Answers { get; set; } = [];
}

public class ApplicantJobApplicationDto : BaseJobApplicationDto
{
  	public JobPostDto JobPost { get; set; } = null!;
}

public class JobPostJobApplicationDto : BaseJobApplicationDto
{
	public ApplicantDto Applicant { get; set; } = null!;
}

public class JobApplicationDto : JobPostJobApplicationDto
{
	public JobPostDto JobPost { get; set; } = null!;
}

public class JobApplicationRequest
{
	[Required] public List<JobApplicationQuestionAnswerItemRequest> Answers { get; set; } = [];
}