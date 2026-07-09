using Backend.Models;

namespace Backend.Repositories;

public interface ISkillRepository : IRepository<Skill>
{
    Task<List<Skill>> GetAsync(string? contains, string[]? exclude, int? limit);
    Task<Skill?> GetByNameAsync(string name);
}