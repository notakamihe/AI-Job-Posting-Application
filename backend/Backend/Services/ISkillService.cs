using Backend.DTO;
using Backend.Models;

namespace Backend.Services;

public interface ISkillService
{
    Task<Skill> CreateAsync(string name);
    Task DeleteAsync(Skill skill);
    Task<List<Skill>> GetAsync(SkillFilter? filter);
    Task<Skill?> GetByIdAsync(long id);
    Task<Skill?> GetByNameAsync(string name);
    Task UpdateAsync(Skill skill, string name);
}