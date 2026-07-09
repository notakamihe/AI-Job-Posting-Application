using System.Security.Claims;
using Backend.Extensions;
using Backend.DTO;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IAuthorizationService _authorizationService;
    private readonly IJobApplicationService _jobApplicationService;
    private readonly IJobPostService _jobPostService;
    private readonly IReviewService _reviewService;
    private readonly IUserService _userService;

    public UsersController(
        IAuthService authService,
        IAuthorizationService authorizationService, 
        IJobApplicationService jobApplicationService,
        IJobPostService jobPostService, 
        IReviewService reviewService,
        IUserService userService)
    {
        _authService = authService;
        _authorizationService = authorizationService;
        _jobApplicationService = jobApplicationService;
        _jobPostService = jobPostService;
        _reviewService = reviewService;
        _userService = userService;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers([FromQuery] UserType? type, [FromQuery] List<string> id)
    {
        List<User> users;

        if (User.IsInRole("Admin"))
        {
            users = await _userService.GetAsync(type, id);
        }
        else 
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; 
            users = await _userService.GetPublicOrByUserAsync(userId, type, id);
        }

        return users.Select(u => u.ToDto()).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto?>> GetUser(string id)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user == null)
            return NotFound();
        
        var result = await _authorizationService.AuthorizeAsync(User, user, "AdminIfUserIsAdmin");
        
        if (!result.Succeeded)
            return Problem(
                title: "Forbidden",
                detail: "Admin user cannot be accessed.",
                statusCode: StatusCodes.Status403Forbidden);

        if (user is Applicant applicant)
        {
            result = await _authorizationService.AuthorizeAsync(User, applicant, "ApplicantVisibility");

            if (!result.Succeeded)
                return Problem(
                    type: "https://www.example.com/errors/private-user",
                    title: "Private User",
                    detail: "This user's profile is private.",
                    statusCode: StatusCodes.Status403Forbidden);
        }

        return Ok(user.ToDetailDto());
    }
    
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user == null)
            return NotFound();

        await _userService.DeleteAsync(user);
        return NoContent();
    }

    [HttpGet("{id}/applications")]
    [Authorize]
    public async Task<ActionResult<ResultsWithCount<JobApplicationDto>>> GetUserJobApplications(string id)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return NotFound();
            
        var result = await _authorizationService.AuthorizeAsync(User, user, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var publicOnly = !User.IsInRole("Admin") && (user is Employer || user.Id != userId);
        var applications = await _jobApplicationService.GetByUserAsync(user, publicOnly);
        var count = await _jobApplicationService.CountByUserAsync(user);

        return Ok(new ResultsWithCount<JobApplicationDto>
        { 
            Results = applications.Select(a => a.ToDto()).ToList(), 
            TotalCount = count 
        });
    }

    [HttpGet("{id}/applications/{jobPostId}")]
    [Authorize]
    public async Task<ActionResult<JobApplicationDto>> GetJobApplication(string id, long jobPostId)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"User with ID of {id} not found.");

        if (user is not Applicant applicant)
            return Problem(
                type: "https://www.example.com/errors/invalid-user",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid request for user.",
                detail: "Cannot retrieve job application for user that is not an applicant.");

        var result = await _authorizationService.AuthorizeAsync(User, applicant, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();

        var post = await _jobPostService.GetByIdAsync(jobPostId);

        if (post is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"Job post with ID of {jobPostId} not found.");
        
        var application = applicant.JobApplications.Find(a => a.JobPostId == post.Id);
        
        if (application is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: "Job application not found.");
        
        return Ok(application.ToDto());
    }

    [HttpPut("{id}/applications/{jobPostId}")]
    [Authorize]
    public async Task<ActionResult<JobApplicationDto>> PutJobApplication(
        string id,
        long jobPostId,
        [FromBody] JobApplicationRequest request)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"User with ID of {id} not found.");

        if (user is not Applicant applicant)
            return Problem(
                type: "https://www.example.com/errors/invalid-user",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid request for user.",
                detail: "User is not an applicant. Only applicants can apply to jobs.");

        var result = await _authorizationService.AuthorizeAsync(User, applicant, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();

        var post = await _jobPostService.GetByIdAsync(jobPostId);

        if (post == null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"Job post with ID of {jobPostId} not found.");
            
        var application = applicant.JobApplications.Find(a => a.JobPostId == post.Id);

        if (application is null)
        {
            application = await _jobApplicationService.CreateAsync(applicant, post, request);
            return CreatedAtAction(nameof(GetJobApplication), new { id, jobPostId }, application.ToDto());
        }
        else
        {
            await _jobApplicationService.UpdateAsync(application, request);
            return Ok(application.ToDto());
        }
    }

    [HttpDelete("{id}/applications/{jobPostId}")]
    [Authorize]
    public async Task<IActionResult> DeleteJobApplication(string id, long jobPostId)
    {
         var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"User with ID of {id} not found.");

        if (user is not Applicant applicant)
            return Problem(
                type: "https://www.example.com/errors/invalid-user",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid request for user.",
                detail: "User is not an applicant. Can only remove job applications of applicants.");

        var result = await _authorizationService.AuthorizeAsync(User, applicant, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();

        var post = await _jobPostService.GetByIdAsync(jobPostId);

        if (post == null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"Job post with ID of {jobPostId} not found.");

        var application = applicant.JobApplications.Find(a => a.JobPostId == post.Id);
        
        if (application is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: "Job application not found.");

        await _jobApplicationService.DeleteAsync(application);
        return NoContent();
    }

    [HttpPut("{id}/email")]
    [Authorize]
    public async Task<ActionResult> PutUserEmail(string id, [FromBody] UpdateEmailRequest request)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user == null)
            return NotFound();

        var result = await _authorizationService.AuthorizeAsync(User, user, "SameUserOrAdmin");

        if (!result.Succeeded)
            return Forbid();

        await _userService.UpdateEmailAsync(user, request.Email);

        return Ok();
    }

    [HttpPut("{id}/follow/{employerId}")]
    [Authorize]
    public async Task<ActionResult> PutFollow(string id, string employerId)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"User with ID of {id} not found.");

        if (user is not Applicant applicant)
            return Problem(
                type: "https://www.example.com/errors/invalid-user",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid request for user.",
                detail: "User is not an applicant. Only applicants can follow.");

        var result = await _authorizationService.AuthorizeAsync(User, applicant, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();

        var employer = await _userService.GetEmployerByIdAsync(employerId);

        if (employer == null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"Employer with ID of {employerId} not found.");

        await _userService.FollowAsync(applicant, employer);
        return Ok();
    }

    [HttpDelete("{id}/follow/{employerId}")]
    [Authorize]
    public async Task<IActionResult> DeleteFollow(string id, string employerId)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"User with ID of {id} not found.");

        if (user is not Applicant applicant)
            return Problem(
                type: "https://www.example.com/errors/invalid-user",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid request for user.",
                detail: "User is not an applicant. Only applicants can unfollow.");

        var result = await _authorizationService.AuthorizeAsync(User, applicant, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();

        var employer = await _userService.GetEmployerByIdAsync(employerId);

        if (employer == null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"Employer with ID of {employerId} not found.");

        await _userService.UnfollowAsync(applicant, employer);
        return Ok();
    }
    
    [HttpGet("{id}/followers")]
    public async Task<ActionResult<ResultsWithCount<ApplicantDto>>> GetFollowers(string id)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return NotFound();

        if (user is not Employer employer)
            return Problem(
                type: "https://www.example.com/errors/invalid-user",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid request for user.",
                detail: "Cannot retrieve followers for user that is not an employer.");
        
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var followers = User.IsInRole("Admin")
            ? await _userService.GetFollowersByEmployerAsync(employer)
            : await _userService.GetPublicFollowersByEmployerAsync(employer, userId);
        var count = await _userService.CountFollowersByEmployerAsync(employer);
        
        return Ok(new ResultsWithCount<ApplicantDto>
        {
            Results = followers.Select(f => f.ToDto()).ToList(), 
            TotalCount = count
        });
    }

    [HttpPut("{id}/phone")]
    [Authorize]
    public async Task<ActionResult> PutUserPhone(string id, [FromBody] UpdatePhoneNumberRequest request)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user == null)
            return NotFound();

        var result = await _authorizationService.AuthorizeAsync(User, user, "SameUserOrAdmin");

        if (!result.Succeeded)
            return Forbid();

        await _userService.UpdatePhoneNumberAsync(user, request.PhoneNumber);

        return Ok();
    }

    [HttpPut("{id}/profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> PutUserProfile(string id, [FromBody] UpdateProfileBase request)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user == null)
            return NotFound();
            
        var result = await _authorizationService.AuthorizeAsync(User, user, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();

        await _userService.UpdateProfileAsync(user, request);
        return Ok(user.ToDetailDto());
    }
    
    [HttpGet("{id}/reviews")]
    public async Task<ActionResult<ResultsWithCount<ReviewDto>>> GetReviews(string id)
    {
        var user = await _userService.GetByIdAsync(id);
        
        if (user is null)
            return NotFound();
        
        if (user is Applicant applicant)
        {
            var result = await _authorizationService.AuthorizeAsync(User, applicant, "ApplicantVisibility");
            
            if (!result.Succeeded)
                return Forbid();
        }
        
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var reviews = User.IsInRole("Admin")
            ? await _reviewService.GetByUserAsync(user)
            : await _reviewService.GetVisibleByUserAsync(user, userId);
        var count = await _userService.CountReviewsByUserAsync(user);
        
        return Ok(new ResultsWithCount<ReviewDto>
        {
            Results = reviews.Select(r => r.ToDto()).ToList(), 
            TotalCount = count
        });
    }

    [HttpPut("{id}/save/{jobPostId}")]
    [Authorize]
    public async Task<IActionResult> PutSaved(string id, long jobPostId)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"User with ID of {id} not found.");

        if (user is not Applicant applicant)
            return Problem(
                type: "https://www.example.com/errors/invalid-user",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid request for user.",
                detail: "User is not an applicant. Only applicants can save job posts.");
                
        var result = await _authorizationService.AuthorizeAsync(User, applicant, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();
        
        var post = await _jobPostService.GetByIdAsync(jobPostId);

        if (post == null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"Job post with ID of {jobPostId} not found.");

        await _userService.SaveJobPostAsync(applicant, post);
        return Ok();
    }

    [HttpDelete("{id}/save/{jobPostId}")]
    [Authorize]
    public async Task<IActionResult> DeleteSaved(string id, long jobPostId)
    {
        var user = await _userService.GetByIdAsync(id);

        if (user is null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"User with ID of {id} not found.");

        if (user is not Applicant applicant)
            return Problem(
                type: "https://www.example.com/errors/invalid-user",
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid request for user.",
                detail: "User is not an applicant. Only applicants can unsave job posts.");
                
        var result = await _authorizationService.AuthorizeAsync(User, applicant, "SameUserOrAdmin");
        
        if (!result.Succeeded)
            return Forbid();

        var post = await _jobPostService.GetByIdAsync(jobPostId);

        if (post == null)
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Not Found.",
                detail: $"Job post with ID of {jobPostId} not found.");

        await _userService.UnsaveJobPostAsync(applicant, post);
        return Ok();
    }

    [HttpGet("me")]
	[Authorize]
	public async Task<ActionResult<AuthenticatedUserDto>> GetMe()
	{
		var user = await _authService.GetCurrentUserAsync();
		
		if (user is null)
			return Unauthorized();

        var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

		return Ok(user.ToAuthDto(roles));
	}
}