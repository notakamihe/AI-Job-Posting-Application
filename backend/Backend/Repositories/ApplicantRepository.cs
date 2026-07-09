using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class ApplicantRepository : Repository<Applicant>, IApplicantRepository
{
    public ApplicantRepository(ApplicationContext context) : base(context)
    {
    }
    
    public Task<int> CountByFollowedEmployerAsync(Employer employer)
    {
        return _context.Applicants.Where(a => a.Following.Any(f => f.Id == employer.Id)).CountAsync();
    }

    public override Task<List<Applicant>> GetAllAsync()
    {
        return _context.Applicants.IncludeAll().ToListAsync();
    }
    
    public Task<List<Applicant>> GetByFollowedEmployerAsync(Employer employer)
    {
        return _context.Applicants.Where(a => a.Following.Any(f => f.Id == employer.Id)).IncludeAll().ToListAsync();
    }

    public Task<Applicant?> GetByIdAsync(string id)
    {
        return _context.Applicants.IncludeAll().FirstOrDefaultAsync(a => a.Id == id);
    }

    public Task<List<Applicant>> GetPublicByFollowedEmployerAsync(Employer employer, string? userId)
    {
        return _context.Applicants
            .Where(a => a.Following.Any(f => f.Id == employer.Id) && (!a.IsPrivate || a.Id == userId))
            .IncludeAll()
            .ToListAsync();
    }
}

static class ApplicantRepositoryExtensions
{
    public static IQueryable<Applicant> IncludeAll(this IQueryable<Applicant> query)
    {
        return query
            .Include(a => a.WorkExperience.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
            .AsSplitQuery()
            .Include(a => a.Education.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
            .AsSplitQuery()
            .Include(a => 
                a.CertificationsAndLicenses.OrderByDescending(e => e.IssuedYear).ThenByDescending(e => e.IssuedMonth))
            .AsSplitQuery()
            .Include(a => a.Skills)
            .AsSplitQuery()
            .Include(a => a.Reviews.OrderByDescending(r => r.Id))
                .ThenInclude(r => r.Employer)
                .AsSplitQuery()
            .Include(a => a.JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.Employer)
                    .AsSplitQuery()
            .Include(a => a.JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.Qualifications)
                    .AsSplitQuery()
            .Include(a => a.JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.Responsibilities)
                    .AsSplitQuery()
            .Include(a => a.JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.Skills)
                    .AsSplitQuery()
            .Include(a => a.JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.JobApplicationQuestions)
                    .AsSplitQuery()
            .Include(a => a.JobApplicationQuestionAnswers)
                .ThenInclude(a => a.JobApplicationQuestion)
                .AsSplitQuery()
            .Include(a => a.Following)
                .ThenInclude(f => f.Reviews)
                .AsSplitQuery()
            .Include(a => a.Saved)
                .ThenInclude(jp => jp.Employer)
                .AsSplitQuery();
    }
}