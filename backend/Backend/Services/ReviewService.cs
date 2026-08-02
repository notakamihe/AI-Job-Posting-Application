using Backend.DTO;
using Backend.Exceptions;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IUserService _userService;

        public ReviewService(IUnitOfWork unitOfWork, IUserService userService)
        {
            _unitOfWork = unitOfWork;
            _userService = userService;
        }

        public Task<int> CountByUserAsync(User user)
        {
            return _unitOfWork.Reviews.CountByUserAsync(user);
        }

        public async Task<Review> CreateAsync(CreateReviewRequest request)
        {
            var reviewer = await _userService.GetApplicantByIdAsync(request.ReviewerId!);
            
            if (reviewer is null)
                throw new Exception($"Reviewer with the applicant ID of {request.ReviewerId} not found.");
            
            var review = new Review { Reviewer = reviewer };
            _unitOfWork.Reviews.Add(review);

            return await SaveAsync(review, request);
        }

        public async Task DeleteAsync(Review review)
        {
            _unitOfWork.Reviews.Remove(review);
            await _unitOfWork.CompleteAsync();
        }

        public Task<List<Review>> GetAllAsync()
        {
            return _unitOfWork.Reviews.GetAllAsync();
        }
        
        public Task<Review?> GetByIdAsync(long id)
        {
            return _unitOfWork.Reviews.GetByIdAsync(id);
        }
        
        public async Task<List<Review>> GetByUserAsync(User user)
        {
            if (user is not Applicant && user is not Employer)
                throw new InvalidUserException("Cannot retrieve reviews for user.");
            
            return await _unitOfWork.Reviews.GetByUserAsync(user);
        }

        public Task<List<Review>> GetPublicOrByReviewerAsync(string? reviewerId)
        {
            return _unitOfWork.Reviews.GetPublicOrByReviewerAsync(reviewerId);
        }
        
        public async Task<List<Review>> GetVisibleByUserAsync(User user, string? userId)
        {
            if (user is not Applicant && user is not Employer)
                throw new InvalidUserException("Cannot retrieve reviews for user.");

            return await _unitOfWork.Reviews.GetVisibleByUserAsync(user, userId);
        }

        private async Task<Review> SaveAsync(Review review, ReviewRequest request)
        {
            var employer = await _userService.GetEmployerByIdAsync(request.EmployerId);

            if (employer is null)
                throw new Exception($"Employer with the ID of {request.EmployerId} not found.");
                
            review.Employer = employer;
            review.Title = request.Title;
            review.Description = request.Description;
            review.Rating = request.Rating;

            await _unitOfWork.CompleteAsync();
            return review;
        }

        public Task UpdateAsync(Review review, ReviewRequest request)
        {
            return SaveAsync(review, request);
        }
    }
}
