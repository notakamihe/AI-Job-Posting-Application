using Backend.Models;

namespace Backend.Repositories;

public interface IChatRepository : IRepository<Chat>
{
    Task<Chat?> GetByIdAsync(long id);
    Task<List<Chat>> GetByUsersAsync(List<User> users);
}