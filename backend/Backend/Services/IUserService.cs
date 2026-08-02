using Backend.DTO;
using Backend.Models;

namespace Backend.Services;

public interface IUserService
{
    Task<int> CountFollowersByEmployerAsync(Employer employer);
    Task<User> CreateAsync(RegisterRequest request);
    Task DeleteAsync(User user);
    Task FollowAsync(Applicant applicant, Employer employer);
    Task<Applicant?> GetApplicantByIdAsync(string id);
    Task<List<User>> GetAsync(UserType? type, List<string> ids);
    Task<User?> GetByEmailAsync(string email, bool includeChatbot = false);
    Task<User?> GetByIdAsync(string id, string? role = null, bool includeChatbot = false);
    Task<List<User>> GetByIdsAsync(List<string> ids, string? role = null, bool includeChatbot = false);
    Task<User?> GetByRefreshTokenAsync(string token);
    Task<Employer?> GetEmployerByIdAsync(string id);
    Task<List<Applicant>> GetFollowersByEmployerAsync(Employer employer);
    Task<List<Applicant>> GetPublicFollowersByEmployerAsync(Employer employer, string? userId);
    Task<List<User>> GetPublicOrByUserAsync(string? userId, UserType? type, List<string> ids);
    Task SaveJobPostAsync(Applicant applicant, JobPost post);
    Task UnfollowAsync(Applicant applicant, Employer employer);
    Task UnsaveJobPostAsync(Applicant applicant, JobPost post);
    Task UpdateEmailAsync(User user, string email);
    Task UpdatePhoneNumberAsync(User user, string phoneNumber);
    Task UpdateProfileAsync(User user, UpdateProfileBase request);
}