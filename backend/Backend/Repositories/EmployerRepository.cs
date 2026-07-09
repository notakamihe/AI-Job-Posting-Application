using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class EmployerRepository : Repository<Employer>, IEmployerRepository
{
    public EmployerRepository(ApplicationContext context) : base(context)
    {
    }
    
    public override Task<List<Employer>> GetAllAsync()
    {
        return _context.Employers.IncludeAll().ToListAsync();
    }

    public Task<Employer?> GetByIdAsync(string id)
    {
        return _context.Employers.IncludeAll().FirstOrDefaultAsync(e => e.Id == id);
    }
}

static class EmployerRepositoryExtensions
{
    public static IQueryable<Employer> IncludeAll(this IQueryable<Employer> query)
    {
        return query
            .Include(e => e.Reviews)
            .AsSplitQuery()
            .Include(e => e.JobPosts)
                .ThenInclude(jp => jp.Qualifications)
                .AsSplitQuery()
            .Include(e => e.JobPosts)
                .ThenInclude(jp => jp.Responsibilities)
                .AsSplitQuery()
            .Include(e => e.JobPosts)
                .ThenInclude(jp => jp.Skills)
                .AsSplitQuery()
            .Include(e => e.JobPosts)
                .ThenInclude(jp => jp.JobApplicationQuestions)
                .AsSplitQuery();
    }
}