using Backend.Extensions;
using Backend.DTO;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobPostsController : ControllerBase
{
	private readonly IAuthService _authService;
	private readonly IAuthorizationService _authorizationService;
	private readonly IJobApplicationService _jobApplicationService;
	private readonly IJobPostService _jobPostService;

	public JobPostsController(
		IAuthService authService,
		IAuthorizationService authorizationService, 
		IJobApplicationService jobApplicationService,
		IJobPostService jobPostService)
	{
		_authService = authService;
		_authorizationService = authorizationService;
		_jobApplicationService = jobApplicationService;
		_jobPostService = jobPostService;
	}

	[HttpGet]
	public async Task<ActionResult<List<JobPostDto>>> GetJobPosts()
	{
		var posts = await _jobPostService.GetAllAsync();
		return Ok(posts.Select(jp => jp.ToDto()).ToList());
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<JobPostDto>> GetJobPost(long id)
	{
		var jobPost = await _jobPostService.GetByIdAsync(id);

		if (jobPost == null)
			return NotFound();

		return Ok(jobPost.ToDto());
	}

	[HttpGet("{id}/applications")]
	[Authorize]
	public async Task<ActionResult<ResultsWithCount<JobPostJobApplicationDto>>> GetJobPostApplications(long id)
	{
		var post = await _jobPostService.GetByIdAsync(id);

		if (post == null)
			return NotFound();
			
		var result = await _authorizationService.AuthorizeAsync(User, post, "PostOwnerOrAdmin");
		
		if (!result.Succeeded)
			return Forbid();
			
		var applications = await _jobApplicationService.GetByJobPostAsync(post, !User.IsInRole("Admin"));
		var count = await _jobApplicationService.CountByJobPostAsync(post);

		return Ok(new ResultsWithCount<JobPostJobApplicationDto>
		{
			Results = applications.Select(a => a.ToDtoWithApplicant()).ToList(),
			TotalCount = count
		});
	}

	[HttpGet("{id}/similar")]
	public async Task<ActionResult<List<JobPostDto>>> GetSimilarJobPosts(long id)
	{
		var post = await _jobPostService.GetByIdAsync(id);

		if (post == null)
			return NotFound();

		var similar = await _jobPostService.GetSimilarAsync(post);
		return Ok(similar.Select(p => p.ToDto()).ToList());
	}

	[HttpPost]
	[Authorize]
	public async Task<ActionResult<JobPostDto>> PostJobPost([FromBody] CreateJobPostRequest request)
	{
		if (!User.IsInRole("Admin"))
		{
			var user = await _authService.GetCurrentUserAsync();

			if (user is null)
				return Unauthorized();

			if (user is not Employer)
				return Problem(
					type: "https://www.example.com/errors/invalid-user",
					statusCode: StatusCodes.Status400BadRequest, 
					title: "Invalid request for user.",
					detail: "Only employers can make job posts.");

			request.EmployerId = user.Id;
		}
		
		var post = await _jobPostService.CreateAsync(request);
		return CreatedAtAction(nameof(GetJobPost), new { id = post.Id }, post.ToDto());
	}

	[HttpPut("{id}")]
	[Authorize]
	public async Task<IActionResult> PutJobPost(long id, [FromBody] JobPostRequest request)
	{
		var post = await _jobPostService.GetByIdAsync(id);

		if (post == null)
			return NotFound();
			
		var result = await _authorizationService.AuthorizeAsync(User, post, "PostOwnerOrAdmin");

		if (!result.Succeeded)
			return Forbid();

		await _jobPostService.UpdateAsync(post, request);
		return Ok(post.ToDto());
	}

	[HttpDelete("{id}")]
	[Authorize]
	public async Task<IActionResult> DeleteJobPost(long id)
	{
		var post = await _jobPostService.GetByIdAsync(id);

		if (post == null)
			return NotFound();
			
		var result = await _authorizationService.AuthorizeAsync(User, post, "PostOwnerOrAdmin");

		if (!result.Succeeded)
			return Forbid();

		await _jobPostService.DeleteAsync(post);
		return NoContent();
	}
}
