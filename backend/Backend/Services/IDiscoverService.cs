using Backend.DTO;
using Backend.Models;

namespace Backend.Services
{
    public interface IDiscoverService
    {
        Task<int> CountDiscoverAsync(DiscoverFilter filter, User? user);
        Task<int> CountSearchAsync(string term, DiscoverFilter filter, User? user);
        Task<List<object>> DiscoverAsync(DiscoverFilter filter, User? user, int page, int pageSize);
        Task<List<object>> SearchAsync(string term, DiscoverFilter filter, User? user, int page, int pageSize);
    }
}
