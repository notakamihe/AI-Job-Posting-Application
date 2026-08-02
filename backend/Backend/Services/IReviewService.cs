using Backend.DTO;
using Backend.Models;

namespace Backend.Services
{
    public interface IReviewService
    {
        Task<int> CountByUser(User user);
        Task<Review> CreateAsync(CreateReviewRequest request);
        Task DeleteAsync(Review review);
        Task<List<Review>> GetAllAsync();
        Task<Review?> GetByIdAsync(long id);
        Task<List<Review>> GetByUserAsync(User user);
        Task<List<Review>> GetPublicOrByReviewerAsync(string? reviewerId);
        Task<List<Review>> GetVisibleByUserAsync(User user, string? userId);
        Task UpdateAsync(Review review, ReviewRequest request);
    }
}
