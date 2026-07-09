using Backend.DTO;
using Backend.Models;
using Backend.Repositories;
using Microsoft.AspNetCore.Identity;

namespace Backend.Services
{
    public class DiscoverService : IDiscoverService
    {
        private readonly IEntityQueryRepository _entityQueryRepository;
        private readonly UserManager<User> _userManager;

        public DiscoverService(IEntityQueryRepository entityQueryRepository, UserManager<User> userManager)
        {
            _entityQueryRepository = entityQueryRepository;
            _userManager = userManager;
        }

        public async Task<int> CountDiscoverAsync(DiscoverFilter filter, User? user)
        {
            bool publicOnly = user is null || !await _userManager.IsInRoleAsync(user, "Admin");
            return await _entityQueryRepository.CountDiscoverEntitiesAsync(filter, user, publicOnly);
        }

        public async Task<int> CountSearchAsync(string term, DiscoverFilter filter, User? user)
        {
            bool publicOnly = user is null || !await _userManager.IsInRoleAsync(user, "Admin");
            return await _entityQueryRepository.CountDiscoverEntitiesBySearchTermAsync(term, filter, user, publicOnly);
        }

        public async Task<List<object>> DiscoverAsync(DiscoverFilter filter, User? user, int page, int pageSize)
        {
            bool publicOnly = user is null || !await _userManager.IsInRoleAsync(user, "Admin");
            return await _entityQueryRepository.GetDiscoverEntitiesAsync(filter, user, publicOnly, page, pageSize);
        }

        public async Task<List<object>> SearchAsync(
            string term, 
            DiscoverFilter filter, 
            User? user, 
            int page, 
            int pageSize)
        {
            bool publicOnly = user is null || !await _userManager.IsInRoleAsync(user, "Admin");
            return await _entityQueryRepository.GetEntitiesBySearchTermAsync(
                term, 
                filter, 
                user, 
                publicOnly, 
                page, 
                pageSize);
        }
    }
}
