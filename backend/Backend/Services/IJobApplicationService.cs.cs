using Backend.DTO;
using Backend.Models;

namespace Backend.Services;

public interface IJobApplicationService
{
    Task<int> CountByJobPostAsync(JobPost post);
    Task<int> CountByUserAsync(User user);
    Task<JobApplication> CreateAsync(Applicant applicant, JobPost post, JobApplicationRequest request);
    Task DeleteAsync(JobApplication application);
    Task<List<JobApplication>> GetByJobPostAsync(JobPost post, bool publicOnly = false);
    Task<List<JobApplication>> GetByUserAsync(User user, bool publicOnly = false);
    Task UpdateAsync(JobApplication application, JobApplicationRequest request);
}
