using Backend.DTO;
using Backend.Models;

namespace Backend.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<List<User>> GetAsync(UserType? type, List<string>? ids);
    Task<User?> GetByEmailAsync(string normalizedEmail, bool includeChatbot = false);
    Task<User?> GetByIdAsync(string id, string? role = null, bool includeChatbot = false);
    Task<List<User>> GetByIdsAsync(List<string> ids, string? role = null, bool includeChatbot = false);
    Task<User?> GetByRefreshTokenAsync(string refreshToken);
    Task<List<User>> GetPublicOrByUserAsync(string? userId, UserType? type, List<string>? ids);
}