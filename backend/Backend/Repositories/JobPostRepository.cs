using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class JobPostRepository : Repository<JobPost>, IJobPostRepository
{
    public JobPostRepository(ApplicationContext context) : base(context)
    {
    }

    public override Task<List<JobPost>> GetAllAsync()
    {
        return _context.JobPosts.IncludeAll().ToListAsync();
    }

    public Task<JobPost?> GetByIdAsync(long id)
    {
        return _context.JobPosts.IncludeAll().FirstOrDefaultAsync(jp => jp.Id == id);
    }

    public Task<List<JobPost>> GetByIdsAsync(List<long> ids)
    {
        return _context.JobPosts.Where(jp => ids.Contains(jp.Id)).IncludeAll().ToListAsync();
    }
}

static class JobPostRepositoryExtensions
{
    public static IQueryable<JobPost> IncludeAll(this IQueryable<JobPost> query)
    {
        return query
            .Include(jp => jp.Employer)
                .AsSplitQuery()
            .Include(jp => jp.Employer)
                .ThenInclude(e => e.Reviews)
                .AsSplitQuery()
            .Include(jp => jp.Employer)
                .ThenInclude(e => e.JobPosts)
                    .ThenInclude(jp => jp.Qualifications)
                    .AsSplitQuery()
            .Include(jp => jp.Employer)
                .ThenInclude(e => e.JobPosts)
                    .ThenInclude(jp => jp.Responsibilities)
                    .AsSplitQuery()
            .Include(jp => jp.Employer)
                .ThenInclude(e => e.JobPosts)
                    .ThenInclude(jp => jp.Skills)
                    .AsSplitQuery()
            .Include(jp => jp.Employer)
                .ThenInclude(e => e.JobPosts)
                    .ThenInclude(jp => jp.JobApplicationQuestions)
                    .AsSplitQuery()
            .Include(jp => jp.Skills)
            .AsSplitQuery()
            .Include(jp => jp.Qualifications)
            .AsSplitQuery()
            .Include(jp => jp.Responsibilities)
            .AsSplitQuery()
            .Include(jp => jp.JobApplicationQuestions)
                .ThenInclude(q => q.JobApplicationQuestionAnswers)
                .AsSplitQuery();
    }
}