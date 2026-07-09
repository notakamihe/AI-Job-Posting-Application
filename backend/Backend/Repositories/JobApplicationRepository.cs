using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class JobApplicationRepository : Repository<JobApplication>, IJobApplicationRepository
{
    public JobApplicationRepository(ApplicationContext context) : base(context)
    {
    }

    public Task<int> CountByJobPost(JobPost post)
    {
        return _context.JobApplications.Where(a => a.JobPostId == post.Id).CountAsync();
    }

    public async Task<int> CountByUser(User user)
    {
        if (user is Employer)
            return await _context.JobApplications.Where(a => a.JobPost.EmployerId == user.Id).CountAsync();

        if (user is Applicant)
            return await _context.JobApplications.Where(a => a.ApplicantId == user.Id).CountAsync();

        return 0;
    }

    public Task<List<JobApplication>> GetByJobPost(JobPost post, bool publicOnly = false) 
    {
        return _context.JobApplications
            .Where(a => a.JobPostId == post.Id && (!publicOnly || !a.Applicant.IsPrivate))
            .IncludeAll()
            .ToListAsync();
    }

    public async Task<List<JobApplication>> GetByUser(User user, bool publicOnly = false)
    {
        if (user is Employer)
            return await _context.JobApplications
                .Where(a => a.JobPost.EmployerId == user.Id && (!publicOnly || !a.Applicant.IsPrivate))
                .IncludeAll()
                .ToListAsync();

        if (user is Applicant applicant && (!publicOnly || !applicant.IsPrivate))
            return await _context.JobApplications.Where(a => a.ApplicantId == user.Id).IncludeAll().ToListAsync();
        
        return [];
    }
}

internal static class JobApplicationQueryExtensions
{
    public static IQueryable<JobApplication> IncludeAll(this IQueryable<JobApplication> query)
    {
        return query
            .Include(ja => ja.JobPost)
                .ThenInclude(jp => jp.Employer)
                    .AsSplitQuery()
            .Include(ja => ja.JobPost)
                .ThenInclude(jp => jp.JobApplicationQuestions)
                .AsSplitQuery()
            .Include(ja => ja.JobPost)
                .ThenInclude(jp => jp.Skills)
                .AsSplitQuery()
            .Include(a => a.Applicant)
                .ThenInclude(a => a.WorkExperience)
                .AsSplitQuery()
            .Include(a => a.Applicant)
                .ThenInclude(a => a.Education)
                .AsSplitQuery()
            .Include(a => a.Applicant)
                .ThenInclude(a => a.CertificationsAndLicenses)
                .AsSplitQuery()
            .Include(a => a.Applicant)
                .ThenInclude(a => a.Skills)
                .AsSplitQuery()
            .Include(a => a.Applicant)
                .ThenInclude(a => a.Following)
                .AsSplitQuery()
            .Include(a => a.Applicant)
                .ThenInclude(a => a.JobApplicationQuestionAnswers)
                    .ThenInclude(a => a.JobApplicationQuestion)
                    .AsSplitQuery();
    }
}