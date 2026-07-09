using System.Security.Claims;
using Backend.DTO;
using Backend.Extensions;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
	private readonly IAuthService _authService;
	private readonly IAuthorizationService _authorizationService;
	private readonly IReviewService _reviewService;

	public ReviewsController(
		IAuthService authService, 
		IAuthorizationService authorizationService, 
		IReviewService reviewService)
	{
		_authService = authService;
		_authorizationService = authorizationService;
		_reviewService = reviewService;
	}

	[HttpGet]
	public async Task<ActionResult<List<ReviewDto>>> GetReviews()
	{
		List<Review> reviews;
		
		if (User.IsInRole("Admin"))
		{
			reviews = await _reviewService.GetAllAsync();
		}
		else
		{
			var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			reviews = await _reviewService.GetPublicOrByReviewerAsync(userId);
		}
		
		return reviews.Select(r => r.ToDto()).ToList();
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<ReviewDto>> GetReview(long id)
	{
		var review = await _reviewService.GetByIdAsync(id);

		if (review == null)
			return NotFound();
		
		if (review.Reviewer.IsPrivate)
		{
			var result = await _authorizationService.AuthorizeAsync(User, review, "ReviewOwnerOrAdmin");

			if (!result.Succeeded)
				return Forbid();
		}

		return Ok(review.ToDto());
	}

	[HttpPost]
	[Authorize]
	public async Task<ActionResult<ReviewDto>> PostReview([FromBody] CreateReviewRequest request)
	{
		if (!User.IsInRole("Admin"))
		{
			var user = await _authService.GetCurrentUserAsync();

			if (user is null)
				return Unauthorized();

			if (user is not Applicant)
				return Problem(
					type: "https://www.example.com/errors/invalid-user",
					statusCode: StatusCodes.Status400BadRequest,
					title: "Invalid request for user",
					detail: "Only applicants can submit reviews.");

			request.ReviewerId = user.Id;
		}
		
		var review = await _reviewService.CreateAsync(request);
		return CreatedAtAction(nameof(GetReview), new { id = review.Id }, review.ToDto());
	}
	
	[HttpPut("{id}")]
	[Authorize]
	public async Task<IActionResult> PutReview(long id, [FromBody] ReviewRequest request)
	{
		var review = await _reviewService.GetByIdAsync(id);
		
		if (review == null)
			return NotFound();
			
		var result = await _authorizationService.AuthorizeAsync(User, review, "ReviewOwnerOrAdmin");

		if (!result.Succeeded)
			return Forbid();

		await _reviewService.UpdateAsync(review, request);
		return NoContent();
	}

	[HttpDelete("{id}")]
	[Authorize]
	public async Task<IActionResult> DeleteReview(long id)
	{
		var review = await _reviewService.GetByIdAsync(id);

		if (review == null)
			return NotFound();
			
		var result = await _authorizationService.AuthorizeAsync(User, review, "ReviewOwnerOrAdmin");
		
		if (!result.Succeeded)
			return Forbid();

		await _reviewService.DeleteAsync(review);
		return NoContent();
	}
}