using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class SkillRepository : Repository<Skill>, ISkillRepository
{
    public SkillRepository(ApplicationContext context) : base(context)
    {
    }

    public Task<List<Skill>> GetAsync(string? contains, string[]? exclude, int? limit)
    {
        var query = _context.Skills.AsQueryable();

        if (!string.IsNullOrEmpty(contains))
            query = query
            .Where(s => s.Name.ToLower().Contains(contains.ToLower()))
            .OrderBy(s => s.Name.ToLower() == contains.ToLower() ? 0 : 1);

        if (exclude is not null && exclude.Length > 0)
            query = query.Where(s => exclude.All(e => e.ToLower() != s.Name.ToLower()));

        if (limit is not null)
            query = query.Take(limit.Value);

        return query.ToListAsync();
    }

    public Task<Skill?> GetByNameAsync(string name)
    {
        return _context.Skills.FirstOrDefaultAsync(s => s.Name.ToLower() == name.ToLower());
    }
}
