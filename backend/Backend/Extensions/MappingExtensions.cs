using Backend.DTO;
using Backend.Models;

namespace Backend.Extensions;

public static class Extensions
{
    public static AuthenticatedApplicantDto ToAuthDto(this Applicant applicant, List<string> roles)
    {
        return new AuthenticatedApplicantDto
        {
            Id = applicant.Id,
            Email = applicant.Email!,
            PhoneNumber = applicant.PhoneNumber!,
            Location = applicant.Location,
            Industry = applicant.Industry,
            Roles = roles,
            FirstName = applicant.FirstName,
            MiddleName = applicant.MiddleName,
            LastName = applicant.LastName,
            Link1 = applicant.Link1,
            Link2 = applicant.Link2,
            PreferredOccupation = applicant.PreferredOccupation,
            IsPrivate = applicant.IsPrivate,
            ReadyToWork = applicant.ReadyToWork,
            About = applicant.About,
            WorkExperience = applicant.WorkExperience.Select(we => we.ToDto()).ToList(),
            Education = applicant.Education.Select(e => e.ToDto()).ToList(),
            CertificationsAndLicenses = applicant.CertificationsAndLicenses.Select(cl => cl.ToDto()).ToList(),
            Skills = applicant.Skills.Select(s => s.ToDto()).ToList(),
            Following = applicant.Following.Select(f => f.ToDto()).ToList(),
            Reviews = applicant.Reviews.OrderByDescending(r => r.Id).Select(r => r.ToDtoWithEmployer()).ToList(),
            Applications = applicant.JobApplications.Select(a => a.ToDtoWithJobPost()).ToList(),
            Saved = applicant.Saved.Select(s => s.ToDto()).ToList()
        };
    }

    public static AuthenticatedEmployerDto ToAuthDto(this Employer employer, List<string> roles)
    {
        return new AuthenticatedEmployerDto
        {
            Id = employer.Id,
            Email = employer.Email!,
            PhoneNumber = employer.PhoneNumber!,
            Location = employer.Location,
            Industry = employer.Industry,
            Roles = roles,
            Name = employer.Name,
            Website = employer.Website,
            About = employer.About,
            SizeRangeLowEnd = employer.SizeRangeLowEnd,
            SizeRangeHighEnd = employer.SizeRangeHighEnd,
            JobPosts = employer.JobPosts.Select(jp => jp.ToBaseDto()).ToList(),
            AverageRating = employer.AverageRating,
        };
    }
   
    public static UserDto ToAuthDto(this User user, List<string> roles)
    {
        if (user is Employer employer)
            return employer.ToAuthDto(roles);
            
        if (user is Applicant applicant)
            return applicant.ToAuthDto(roles);

        return new AuthenticatedUserDto
        {
            Id = user.Id,
            Email = user.Email!,
            PhoneNumber = user.PhoneNumber!,
            Location = user.Location,
            Industry = user.Industry,
            Roles = roles
        };
    }
    
    private static JobPostBaseDto ToBaseDto(this JobPost post)
    {
        return new JobPostBaseDto
        {
            Id = post.Id,
            Title = post.Title,
            Summary = post.Summary,
            PostedAt = post.PostedAt,
            PayLowEnd = post.PayLowEnd,
            PayHighEnd = post.PayHighEnd,
            Medium = post.Medium,
            EmploymentType = post.EmploymentType,
            Schedule = post.Schedule,
            SkillsWanted = post.Skills.Select(s => s.ToDto()).ToList(),
            Qualifications = post.Qualifications.Select(x => x.ToDto()).ToList(),
            Responsibilities = post.Responsibilities.Select(x => x.ToDto()).ToList(),
            AdditionalDetails = post.AdditionalDetails,
            ApplicationQuestions = post.JobApplicationQuestions.Select(x => x.ToDto()).OrderBy(q => q.Id).ToList()
        };
    }

    public static ApplicantDetailDto ToDetailDto(this Applicant applicant)
    {
        return new ApplicantDetailDto
        {
            Id = applicant.Id,
            Location = applicant.Location,
            Industry = applicant.Industry,
            FirstName = applicant.FirstName,
            MiddleName = applicant.MiddleName,
            LastName = applicant.LastName,
            Link1 = applicant.Link1,
            Link2 = applicant.Link2,
            PreferredOccupation = applicant.PreferredOccupation,
            IsPrivate = applicant.IsPrivate,
            ReadyToWork = applicant.ReadyToWork,
            About = applicant.About,
            WorkExperience = applicant.WorkExperience.Select(we => we.ToDto()).ToList(),
            Education = applicant.Education.Select(e => e.ToDto()).ToList(),
            CertificationsAndLicenses = applicant.CertificationsAndLicenses.Select(cl => cl.ToDto()).ToList(),
            Skills = applicant.Skills.Select(s => s.ToDto()).ToList(),
            Following = applicant.Following.Select(f => f.ToDto()).ToList(),
            Reviews = applicant.Reviews.OrderByDescending(r => r.Id).Select(r => r.ToDtoWithEmployer()).ToList()
        };
    }

    public static UserDto ToDetailDto(this User user)
    {
        if (user is Employer employer)
            return employer.ToDto();

        if (user is Applicant applicant)
            return applicant.ToDetailDto();

        return new UserDto { Id = user.Id, Location = user.Location, Industry = user.Industry };
    }
    
    public static ApplicantDto ToDto(this Applicant applicant)
    {
        return new ApplicantDto
        {
            Id = applicant.Id,
            Location = applicant.Location,
            Industry = applicant.Industry,
            FirstName = applicant.FirstName,
            MiddleName = applicant.MiddleName,
            LastName = applicant.LastName,
            Link1 = applicant.Link1,
            Link2 = applicant.Link2,
            PreferredOccupation = applicant.PreferredOccupation,
            IsPrivate = applicant.IsPrivate,
            ReadyToWork = applicant.ReadyToWork,
            About = applicant.About,
            WorkExperience = applicant.WorkExperience.Select(we => we.ToDto()).ToList(),
            Education = applicant.Education.Select(e => e.ToDto()).ToList(),
            CertificationsAndLicenses = applicant.CertificationsAndLicenses.Select(cl => cl.ToDto()).ToList(),
            Skills = applicant.Skills.Select(s => s.ToDto()).ToList(),
            Following = applicant.Following.Select(e => e.ToDto()).ToList()
        };
    }

    private static CertificateOrLicenseDto ToDto(this CertificateOrLicense certificateOrLicense)
    {
        return new CertificateOrLicenseDto
        {
            Id = certificateOrLicense.Id,
            Name = certificateOrLicense.Name,
            Issuer = certificateOrLicense.Issuer,
            IssuedMonth = certificateOrLicense.IssuedMonth,
            IssuedYear = certificateOrLicense.IssuedYear,
            ExpirationMonth = certificateOrLicense.ExpirationMonth,
            ExpirationYear = certificateOrLicense.ExpirationYear,
            Description = certificateOrLicense.Description
        };
    }

    public static ChatDto ToDto(this Chat chat)
    {
        return new ChatDto
        {
            Id = chat.Id,
            Users = chat.Users.Select(u => u.ToDto()).ToList(),
            Messages = chat.ChatMessages.Select(m => m.ToDto()).ToList()
        };
    }

    public static ChatMessageDto ToDto(this ChatMessage message)
    {
        return new ChatMessageDto
        {
            Id = message.Id,
            SentBy = message.SentBy.ToDto(),
            Message = message.Message,
            SentAt = message.SentAt,
            UpdatedAt = message.UpdatedAt,
            RepliedTo = message.RepliedTo?.ToDto(),
            ReadBy = message.ReadBy.Select(u => u.ToDto()).ToList(),
            Items = message.ChatMessageItems
                .Select<ChatMessageItem, object>(i => i.JobPost is not null ? i.JobPost.ToDto(true) : i.User!.ToDto())
                .ToList()
        };
    }

    private static EducationEntryDto ToDto(this EducationEntry education)
    {
        return new EducationEntryDto
        {
            Id = education.Id,
            Institution = education.Institution,
            InstitutionLocation = education.InstitutionLocation,
            Degree = education.Degree,
            StartMonth = education.StartMonth,
            StartYear = education.StartYear,
            EndMonth = education.EndMonth,
            EndYear = education.EndYear,
            Major = education.Major
        };
    }
    
    public static EmployerDto ToDto(this Employer employer)
    {
        return new EmployerDto
        {
            Id = employer.Id,
            Location = employer.Location,
            Industry = employer.Industry,
            Name = employer.Name,
            Website = employer.Website,
            About = employer.About,
            SizeRangeLowEnd = employer.SizeRangeLowEnd,
            SizeRangeHighEnd = employer.SizeRangeHighEnd,
            JobPosts = employer.JobPosts.Select(jp => jp.ToBaseDto()).ToList(),
            AverageRating = employer.AverageRating
        };
    }

    public static JobApplicationDto ToDto(this JobApplication application)
    {
        return new JobApplicationDto
        {
            Applicant = application.Applicant.ToDto(),
            JobPost = application.JobPost.ToDto(),
            Answers = application.Applicant.JobApplicationQuestionAnswers
                .Where(a => a.JobApplicationQuestion.JobPostId == application.JobPost.Id)
                .Select(a => a.ToDto())
                .ToList()
        };
    }

    private static JobApplicationQuestionDto ToDto(this JobApplicationQuestion question)
    {
        return new JobApplicationQuestionDto
        {
            Id = question.Id,
            Question = question.Question,
            Type = question.Type,
            IsRequired = question.IsRequired
        };
    }

    private static JobApplicationQuestionAnswerDto ToDto(this JobApplicationQuestionAnswer answer)
    {
        return new JobApplicationQuestionAnswerDto
        {
            Question = answer.JobApplicationQuestion.ToDto(),
            Answer = answer.Answer
        };
    }

    public static JobPostDto ToDto(this JobPost post, bool entityQuery = false)
    {
        var dto = entityQuery ? new EntityQueryJobPostDto() : new JobPostDto();
        
        dto.Id = post.Id;
        dto.Employer = post.Employer.ToDto();
        dto.Title = post.Title;
        dto.Summary = post.Summary;
        dto.PostedAt = post.PostedAt;
        dto.PayLowEnd = post.PayLowEnd;
        dto.PayHighEnd = post.PayHighEnd;
        dto.Medium = post.Medium;
        dto.EmploymentType = post.EmploymentType;
        dto.Schedule = post.Schedule;
        dto.SkillsWanted = post.Skills.Select(s => s.ToDto()).ToList();
        dto.Qualifications = post.Qualifications.Select(x => x.ToDto()).ToList();
        dto.Responsibilities = post.Responsibilities.Select(x => x.ToDto()).ToList();
        dto.AdditionalDetails = post.AdditionalDetails;
        dto.ApplicationQuestions = post.JobApplicationQuestions.Select(x => x.ToDto()).OrderBy(q => q.Id).ToList();

        return dto;
    }

    private static QualificationDto ToDto(this Qualification qualification)
    {
        return new QualificationDto { Id = qualification.Id, Description = qualification.Description };
    }

    private static ResponsibilityDto ToDto(this Responsibility responsibility)
    {
        return new ResponsibilityDto { Id = responsibility.Id, Description = responsibility.Description };
    }

    public static ReviewDto ToDto(this Review review)
    {
        return new ReviewDto
        {
            Id = review.Id,
            Employer = review.Employer.ToDto(),
            Reviewer = review.Reviewer.ToDto(),
            Rating = review.Rating,
            Title = review.Title,
            Description = review.Description
        };
    }

    public static SkillDto ToDto(this Skill skill)
    {
        return new SkillDto { Id = skill.Id, Name = skill.Name };
    }

    public static UserDto ToDto(this User user)
    {
        if (user is Employer employer)
            return employer.ToDto();
            
        if (user is Applicant applicant)
            return applicant.ToDto();

        return new UserDto { Id = user.Id, Location = user.Location, Industry = user.Industry };
    }

    private static WorkExperienceEntryDto ToDto(this WorkExperienceEntry workExperienceEntry)
    {
        return new WorkExperienceEntryDto
        {
            Id = workExperienceEntry.Id,
            Employer = workExperienceEntry.Employer,
            Position = workExperienceEntry.Position,
            EndMonth = workExperienceEntry.EndMonth,
            StartMonth = workExperienceEntry.StartMonth,
            StartYear = workExperienceEntry.StartYear,
            EndYear = workExperienceEntry.EndYear,
            Description = workExperienceEntry.Description
        };
    }

    public static JobPostJobApplicationDto ToDtoWithApplicant(this JobApplication application)
    {
        return new JobPostJobApplicationDto
        {
            Applicant = application.Applicant.ToDto(),
            Answers = application.Applicant.JobApplicationQuestionAnswers
                .Where(a => a.JobApplicationQuestion.JobPostId == application.JobPost.Id)
                .Select(a => a.ToDto())
                .ToList()
        };
    }

    private static ApplicantReviewDto ToDtoWithEmployer(this Review review)
    {
        return new ApplicantReviewDto
        {
            Id = review.Id,
            Employer = review.Employer.ToDto(),
            Rating = review.Rating,
            Title = review.Title,
            Description = review.Description
        };
    }

    private static ApplicantJobApplicationDto ToDtoWithJobPost(this JobApplication application)
    {
        return new ApplicantJobApplicationDto
        {
            JobPost = application.JobPost.ToDto(),
            Answers = application.Applicant.JobApplicationQuestionAnswers
                .Where(a => a.JobApplicationQuestion.JobPostId == application.JobPost.Id)
                .Select(a => a.ToDto())
                .ToList()
        };
    }
}