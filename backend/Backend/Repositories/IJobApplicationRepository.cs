using Backend.Models;

namespace Backend.Repositories;

public interface IJobApplicationRepository : IRepository<JobApplication>
{
    Task<int> CountByJobPost(JobPost post);
    Task<int> CountByUser(User user);
    Task<List<JobApplication>> GetByJobPost(JobPost post, bool publicOnly = false);
    Task<List<JobApplication>> GetByUser(User user, bool publicOnly = false);
}