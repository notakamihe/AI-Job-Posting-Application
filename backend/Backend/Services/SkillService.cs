using Backend.DTO;
using Backend.Exceptions;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services;

public class SkillService : ISkillService
{
    private readonly IUnitOfWork _unitOfWork;

    public SkillService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public Task<Skill> CreateAsync(string name)
    {
        return SaveAsync(name);
    }

    public async Task DeleteAsync(Skill skill)
    {
        _unitOfWork.Skills.Remove(skill);
        await _unitOfWork.CompleteAsync();
    }
    
    public Task<List<Skill>> GetAsync(SkillFilter? filter)
    {
        return _unitOfWork.Skills.GetAsync(filter?.Contains, filter?.Exclude, filter?.Limit);
    }

    public Task<Skill?> GetByIdAsync(long id)
    {
        return _unitOfWork.Skills.GetByIdAsync(id);
    }

    public Task<Skill?> GetByNameAsync(string name)
    {
        return _unitOfWork.Skills.GetByNameAsync(name);
    }

    private async Task<Skill> SaveAsync(string name, Skill? skill = null)
    {
        if (skill is null)
        {
            skill = new Skill { Name = name };
            _unitOfWork.Skills.Add(skill);
        }
        else 
        {
            skill.Name = name;
        }

        var existing = await GetByNameAsync(skill.Name);

        if (existing is not null && existing.Id != skill.Id)
            throw new AlreadyExistsException($"Skill named '{skill.Name}' already exists with ID of {existing.Id}.");

        await _unitOfWork.CompleteAsync();

        return skill;
    }

    public Task UpdateAsync(Skill skill, string name)
    {
        return SaveAsync(name, skill);
    }
}