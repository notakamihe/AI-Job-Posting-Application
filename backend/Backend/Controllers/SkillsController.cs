using Backend.DTO;
using Backend.Extensions;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SkillsController : ControllerBase
{
	private readonly ISkillService _skillService;

	public SkillsController(ISkillService skillService)
	{
		_skillService = skillService;
	}

	[HttpGet]
	public async Task<ActionResult<List<SkillDto>>> GetSkills([FromQuery] SkillFilter filter)
	{
		var skills = await _skillService.GetAsync(filter);
		return skills.Select(s => s.ToDto()).ToList();
	}

	[HttpGet("{id}")]
	public async Task<ActionResult<SkillDto>> GetSkill(long id)
	{
		var skill = await _skillService.GetByIdAsync(id);

		if (skill == null)
			return NotFound();

		return Ok(skill.ToDto());
	}

	[HttpPost]
	[Authorize(Roles = "Admin")]
	public async Task<ActionResult<SkillDto>> PostSkill([FromBody] SkillRequest request)
	{
		var skill = await _skillService.CreateAsync(request.Name);
		return CreatedAtAction(nameof(GetSkill), new { id = skill.Id }, skill.ToDto());
	}

	[HttpPut("{id}")]
	[Authorize(Roles = "Admin")]
	public async Task<IActionResult> PutSkill(long id, [FromBody] SkillRequest request)
	{
		var skill = await _skillService.GetByIdAsync(id);

		if (skill == null)
			return NotFound();

		await _skillService.UpdateAsync(skill, request.Name);
		return NoContent();
	}

	[HttpDelete("{id}")]
	[Authorize(Roles = "Admin")]
	public async Task<IActionResult> DeleteSkill(long id)
	{
		var skill = await _skillService.GetByIdAsync(id);

		if (skill == null)
			return NotFound();

		await _skillService.DeleteAsync(skill);
		return NoContent();
	}
}