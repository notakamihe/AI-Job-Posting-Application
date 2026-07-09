using Backend.Models;

namespace Backend.Repositories;

public interface IEmployerRepository : IRepository<Employer>
{
    Task<Employer?> GetByIdAsync(string id);
}