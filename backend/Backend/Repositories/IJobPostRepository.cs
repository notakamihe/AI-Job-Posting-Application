using Backend.Models;

namespace Backend.Repositories;

public interface IJobPostRepository : IRepository<JobPost>
{
    Task<JobPost?> GetByIdAsync(long id);
    Task<List<JobPost>> GetByIdsAsync(List<long> ids);
}