using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class ReviewRepository : Repository<Review>, IReviewRepository
{
    public ReviewRepository(ApplicationContext context) : base(context)
    {
    }

    public async Task<int> CountByUserAsync(User user)
    {
        if (user is Applicant applicant)
            return await _context.Reviews.Where(r => r.ReviewerId == applicant.Id).CountAsync();

        if (user is Employer employer)
            return await _context.Reviews.Where(r => r.EmployerId == employer.Id).CountAsync();

        return 0;
    }

    public override Task<List<Review>> GetAllAsync()
    {
        return _context.Reviews.IncludeAll().ToListAsync();
    }

    public Task<Review?> GetByIdAsync(long id)
    {
        return _context.Reviews.IncludeAll().FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<List<Review>> GetByUserAsync(User user) 
    {
        if (user is Applicant applicant)
            return await _context.Reviews
                .Where(r => r.ReviewerId == applicant.Id)
                .OrderByDescending(r => r.Id)
                .IncludeAll()
                .ToListAsync();

        if (user is Employer employer)
            return await _context.Reviews
                .Where(r => r.EmployerId == employer.Id)
                .OrderByDescending(r => r.Id)
                .IncludeAll()
                .ToListAsync();

        return [];
    } 

    public Task<List<Review>> GetPublicOrByReviewerAsync(string? reviewerId)
    {
        return _context.Reviews
            .Where(r => !r.Reviewer.IsPrivate || r.ReviewerId == reviewerId)
            .IncludeAll()
            .ToListAsync();
    }

    public async Task<List<Review>> GetVisibleByUserAsync(User user, string? userId)
    {
        if (user is Applicant applicant)
        {
            if (!applicant.IsPrivate || applicant.Id == userId)
                return await _context.Reviews
                    .Where(r => r.ReviewerId == applicant.Id)
                    .OrderBy(r => r.ReviewerId == userId ? 0 : 1)
                        .ThenByDescending(r => r.Id)
                    .IncludeAll()
                    .ToListAsync();
        }

        if (user is Employer employer)
            return await _context.Reviews
                .Where(r => r.EmployerId == employer.Id && (!r.Reviewer.IsPrivate || r.ReviewerId == userId))
                .OrderBy(r => r.ReviewerId == userId ? 0 : 1)
                    .ThenByDescending(r => r.Id)
                .IncludeAll()
                .ToListAsync();

        return [];
    }
}

internal static class ReviewQueryExtensions
{
    public static IQueryable<Review> IncludeAll(this IQueryable<Review> query)
    {
        return query
            .Include(r => r.Employer)
            .AsSplitQuery()
            .Include(r => r.Employer)
                .ThenInclude(e => e.Reviews)
                .AsSplitQuery()
            .Include(r => r.Employer)
                .ThenInclude(e => e.JobPosts)
                .AsSplitQuery()
            .Include(r => r.Employer)
                .ThenInclude(e => e.JobPosts)
                    .ThenInclude(jp => jp.Qualifications)
                    .AsSplitQuery()
            .Include(r => r.Employer)
                .ThenInclude(e => e.JobPosts)
                    .ThenInclude(jp => jp.Responsibilities)
                    .AsSplitQuery()
            .Include(r => r.Employer)
                .ThenInclude(e => e.JobPosts)
                    .ThenInclude(jp => jp.Skills)
                    .AsSplitQuery()
            .Include(r => r.Employer)
                .ThenInclude(e => e.JobPosts)
                    .ThenInclude(jp => jp.JobApplicationQuestions)
                    .AsSplitQuery()
            .Include(r => r.Reviewer)
            .AsSplitQuery()
            .Include(r => r.Reviewer)
                .ThenInclude(a => a.Reviews)
                .AsSplitQuery()
            .Include(r => r.Reviewer)
                .ThenInclude(a => a.WorkExperience.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
                .AsSplitQuery()
            .Include(r => r.Reviewer)
                .ThenInclude(a => a.Education.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
                .AsSplitQuery()
            .Include(r => r.Reviewer)
                .ThenInclude(a => 
                    a.CertificationsAndLicenses.OrderByDescending(e => e.IssuedYear).ThenByDescending(e => e.IssuedMonth))
                .AsSplitQuery()
            .Include(r => r.Reviewer)
                .ThenInclude(a => a.Skills)
                .AsSplitQuery()
            .Include(r => r.Reviewer)
                .ThenInclude(a => a.Following)
                .AsSplitQuery();
    }   
}