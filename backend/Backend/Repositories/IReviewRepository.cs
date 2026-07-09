using Backend.Models;

namespace Backend.Repositories;

public interface IReviewRepository : IRepository<Review>
{
    Task<int> CountByUserAsync(User user);
    Task<Review?> GetByIdAsync(long id);
    Task<List<Review>> GetByUserAsync(User user);
    Task<List<Review>> GetVisibleByUserAsync(User user, string? userId);
    Task<List<Review>> GetPublicOrByReviewerAsync(string? reviewerId);
}