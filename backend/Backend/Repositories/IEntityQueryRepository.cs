using Backend.DTO;
using Backend.Models;
using Pgvector;

namespace Backend.Repositories;

public interface IEntityQueryRepository
{
    Task<int> CountDiscoverEntitiesAsync(DiscoverFilter filter, User? user, bool publicOnly);
    Task<int> CountDiscoverEntitiesBySearchTermAsync(string term, DiscoverFilter filter, User? user, bool publicOnly);
    Task<List<object>> GetDiscoverEntitiesAsync(
        DiscoverFilter filter, 
        User? user, 
        bool publicOnly, 
        int page, 
        int pageSize);
    Task<List<object>> GetEntitiesBySearchTermAsync(
        string term, 
        DiscoverFilter filter, 
        User? user,
        bool publicOnly,
        int page, 
        int pageSize);
    Task<List<object>> GetRelevantEntitiesAsync(
        Vector queryVector, 
        EntityFilter? filter = null, 
        User? user = null, 
        int top = 3);
}