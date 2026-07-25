using Backend.Data;
using Backend.DTO;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationContext context) : base(context)
    {
    }
    
    public Task<List<User>> GetAsync(UserType? type, List<string>? ids)
    {
         var sql = (
            from u in _context.Users
            join userRole in _context.UserRoles on u.Id equals userRole.UserId
            join role in _context.Roles on userRole.RoleId equals role.Id
            where role.Name == "User"
            select u
        );
        var query = sql.Where(u => u.Id != "chatbot");

        switch (type)
        {
            case UserType.Applicant:
                query = query.Where(u => u is Applicant);
                break;
            case UserType.Employer:
                query = query.Where(u => u is Employer);
                break;
        }

        if (ids is not null && ids.Count > 0)
            query = query.Where(u => ids.Contains(u.Id));

        return query.IncludeAll().ToListAsync();
    }

    public Task<User?> GetByEmailAsync(string normalizedEmail, bool includeChatbot = false)
    {
        return _context.Users
            .Where(u => includeChatbot || u.Id != "chatbot")
            .IncludeAll()
            .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);
    }

    public Task<User?> GetByIdAsync(string id, string? role = null, bool includeChatbot = false)
    {
        IQueryable<User> query = _context.Users;

        if (role is not null)
            query =
                from u in query
                join ur in _context.UserRoles on u.Id equals ur.UserId
                join r in _context.Roles on ur.RoleId equals r.Id
                where r.Name == role
                select u;

        return query.Where(u => includeChatbot || u.Id != "chatbot").IncludeAll().FirstOrDefaultAsync(u => u.Id == id);
    }

    public Task<List<User>> GetByIdsAsync(List<string> ids, string? role = null, bool includeChatbot = false)
    {
        IQueryable<User> query = _context.Users;

        if (role is not null)
            query =
                from u in query
                join ur in _context.UserRoles on u.Id equals ur.UserId
                join r in _context.Roles on ur.RoleId equals r.Id
                where r.Name == role
                select u;

        return query.Where(u => ids.Contains(u.Id) && (includeChatbot || u.Id != "chatbot")).IncludeAll().ToListAsync();
    }

    public Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        return _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
    }

    public Task<List<User>> GetPublicOrByUserAsync(string? userId, UserType? type, List<string>? ids)
    {
         var sql = (
            from u in _context.Users
            join userRole in _context.UserRoles on u.Id equals userRole.UserId
            join role in _context.Roles on userRole.RoleId equals role.Id
            where role.Name == "User"
            select u
        );
        var query = sql
            .Where(u => u.Id != "chatbot")
            .Where(u => !(u is Applicant) || !((Applicant)u).IsPrivate || u.Id == userId);

        switch (type)
        {
            case UserType.Applicant:
                query = query.Where(u => u is Applicant);
                break;
            case UserType.Employer:
                query = query.Where(u => u is Employer);
                break;
        }

        if (ids is not null && ids.Count > 0)
            query = query.Where(u => ids.Contains(u.Id));
            
        return query.IncludeAll().ToListAsync();
    }
}

internal static class UserQueryExtensions
{
    public static IQueryable<User> IncludeAll(this IQueryable<User> query)
    {
        return query
            .Include(u => ((Employer)u).JobPosts.OrderByDescending(jp => jp.PostedAt))
                .ThenInclude(jp => jp.Skills)
                .AsSplitQuery()
            .Include(u => ((Employer)u).JobPosts)
                .ThenInclude(jp => jp.Qualifications)
                .AsSplitQuery()
            .Include(u => ((Employer)u).JobPosts)
                .ThenInclude(jp => jp.Responsibilities)
                .AsSplitQuery()
            .Include(u => ((Employer)u).JobPosts)
                .ThenInclude(jp => jp.JobApplicationQuestions)
                .AsSplitQuery()
            .Include(u => ((Employer)u).Reviews)
            .AsSplitQuery()
            .Include(u => 
                ((Applicant)u).WorkExperience.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
            .AsSplitQuery()
            .Include(u => 
                ((Applicant)u).Education.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
            .AsSplitQuery()
            .Include(u => 
                ((Applicant)u).CertificationsAndLicenses
                    .OrderByDescending(e => e.IssuedYear)
                    .ThenByDescending(e => e.IssuedMonth))
            .AsSplitQuery()
            .Include(u => ((Applicant)u).Skills)
            .AsSplitQuery()
            .Include(u => ((Applicant)u).Reviews)
                .ThenInclude(r => r.Employer)
                    .ThenInclude(e => e.Reviews)
                    .AsSplitQuery()
            .Include(u => ((Applicant)u).Following)
                .ThenInclude(e => e.Reviews)
                .AsSplitQuery()
            .Include(u => ((Applicant)u).JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.Employer)
                    .AsSplitQuery()
            .Include(u => ((Applicant)u).JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.Qualifications)
                    .AsSplitQuery()
            .Include(u => ((Applicant)u).JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.Responsibilities)
                    .AsSplitQuery()
            .Include(u => ((Applicant)u).JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.Skills)
                    .AsSplitQuery()
            .Include(u => ((Applicant)u).JobApplications)
                .ThenInclude(a => a.JobPost)
                    .ThenInclude(jp => jp.JobApplicationQuestions)
                    .AsSplitQuery()
            .Include(u => ((Applicant)u).Saved)
                .ThenInclude(jp => jp.Employer)
                    .ThenInclude(e => e.Reviews)
                    .AsSplitQuery()
            .Include(u => ((Applicant)u).Saved)
                .ThenInclude(jp => jp.Qualifications)
                .AsSplitQuery()
            .Include(u => ((Applicant)u).Saved)
                .ThenInclude(jp => jp.Responsibilities)
                .AsSplitQuery()
            .Include(u => ((Applicant)u).Saved)
                .ThenInclude(jp => jp.Skills)
                .AsSplitQuery()
            .Include(u => ((Applicant)u).JobApplicationQuestionAnswers)
                .ThenInclude(a => a.JobApplicationQuestion)
                .AsSplitQuery();
    }
}