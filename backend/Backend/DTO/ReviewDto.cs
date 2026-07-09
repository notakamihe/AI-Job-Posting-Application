using System.ComponentModel.DataAnnotations;
using Backend.Validation;

namespace Backend.DTO;

public class BaseReviewDto
{
    public long Id { get; set; }
    [Required] [Range(1, 5)] public double Rating { get; set; }
    [Required] [MaxLength(200)] public string Title { get; set; } = string.Empty;
    [Required] public string Description { get; set; } = string.Empty;
}

public class ApplicantReviewDto : BaseReviewDto
{
    public EmployerDto Employer { get; set; } = null!;
}

public class EmployerReviewDto : BaseReviewDto
{
    public ApplicantDto Reviewer { get; set; } = null!;
}

public class ReviewDto : EmployerReviewDto
{
    public EmployerDto Employer { get; set; } = null!;
}

public class ReviewRequest : BaseReviewDto
{
    [Required] public string EmployerId { get; set; } = string.Empty;
}

public class CreateReviewRequest : ReviewRequest
{
    [RequiredIfAdmin] public string? ReviewerId { get; set; } = string.Empty;
}