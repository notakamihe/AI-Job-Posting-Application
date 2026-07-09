using Backend.Models;

namespace Backend.Repositories;

public interface IApplicantRepository : IRepository<Applicant>
{
    Task<int> CountByFollowedEmployerAsync(Employer employer);
    Task<List<Applicant>> GetByFollowedEmployerAsync(Employer employer);
    Task<Applicant?> GetByIdAsync(string id);
    Task<List<Applicant>> GetPublicByFollowedEmployerAsync(Employer employer, string? userId);
}