using Backend.DTO;
using Backend.Models;

namespace Backend.Services;

public interface IJobPostService
{
    Task<JobPost> CreateAsync(CreateJobPostRequest request);
    Task DeleteAsync(JobPost post);
    Task<List<JobPost>> GetAllAsync();
    Task<JobPost?> GetByIdAsync(long id);
    Task<List<JobPost>> GetSimilarAsync(JobPost post);
    Task UpdateAsync(JobPost post, JobPostRequest request);
}