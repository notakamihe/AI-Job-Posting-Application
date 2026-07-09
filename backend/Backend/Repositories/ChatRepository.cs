using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Repositories;

public class ChatRepository : Repository<Chat>, IChatRepository
{
    public ChatRepository(ApplicationContext context) : base(context)
    {
    }

    public override Task<List<Chat>> GetAllAsync()
    {
        return _context.Chats
            .Select(c => new 
            {
                Chat = c,
                MostRecentMessage = c.ChatMessages.OrderByDescending(m => m.SentAt).FirstOrDefault()
            })
            .OrderByDescending(x => x.MostRecentMessage != null ? x.MostRecentMessage.SentAt : DateTime.MinValue)
            .Select(x => x.Chat)
            .IncludeAll()
            .ToListAsync(); 
    }

    public async Task<Chat?> GetByIdAsync(long id)
    {
        return await _context.Chats.IncludeAll().FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<List<Chat>> GetByUsersAsync(List<User> users)
    {
        var userIds = users.Select(u => u.Id).ToList();

        if (users.Count > 0)
            return await _context.Chats
                .Where(c => userIds.All(u => c.Users.Any(x => x.Id == u)))
                .Select(c => new 
                {
                    Chat = c,
                    MostRecentMessage = c.ChatMessages.OrderByDescending(m => m.SentAt).FirstOrDefault()
                })
                .OrderBy(x => x.Chat.Users.Any(u => u.Id == "chatbot") ? 0 : 1)
                    .ThenByDescending(x => x.MostRecentMessage != null ? x.MostRecentMessage.SentAt : DateTime.MinValue)
                .Select(x => x.Chat)
                .IncludeAll()
                .ToListAsync(); 

        return [];
    }
}

internal static class ChatQueryExtensions
{
    public static IQueryable<Chat> IncludeAll(this IQueryable<Chat> query)
    {
        return query
            .Include(c => c.Users)
                .ThenInclude(u => ((Employer)u).Reviews)
                .AsSplitQuery()
            .Include(c => c.Users)
                .ThenInclude(u => ((Employer)u).JobPosts.OrderByDescending(jp => jp.PostedAt))
                    .ThenInclude(jp => jp.Skills)
                    .AsSplitQuery()
            .Include(c => c.Users)
                .ThenInclude(u => ((Employer)u).JobPosts)
                    .ThenInclude(jp => jp.Qualifications)
                    .AsSplitQuery()
            .Include(c => c.Users)
                .ThenInclude(u => ((Employer)u).JobPosts)
                    .ThenInclude(jp => jp.Responsibilities)
                    .AsSplitQuery()
            .Include(c => c.Users)
                .ThenInclude(u => ((Employer)u).JobPosts)
                    .ThenInclude(jp => jp.JobApplicationQuestions)
                    .AsSplitQuery()
            .Include(c => c.Users)
                .ThenInclude(u => 
                    ((Applicant)u).WorkExperience.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
                .AsSplitQuery()
            .Include(c => c.Users)
                .ThenInclude(u => 
                    ((Applicant)u).Education.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
                .AsSplitQuery()
            .Include(c => c.Users)
                .ThenInclude(u => 
                    ((Applicant)u).CertificationsAndLicenses
                        .OrderByDescending(e => e.IssuedYear)
                        .ThenByDescending(e => e.IssuedMonth))
                .AsSplitQuery()
            .Include(c => c.Users)
                .ThenInclude(u => ((Applicant)u).Skills)
                .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => ((Employer)u).Reviews)
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => ((Employer)u).JobPosts.OrderByDescending(jp => jp.PostedAt))
                        .ThenInclude(jp => jp.Skills)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => ((Employer)u).JobPosts)
                        .ThenInclude(jp => jp.Qualifications)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => ((Employer)u).JobPosts)
                        .ThenInclude(jp => jp.Responsibilities)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => ((Employer)u).JobPosts)
                        .ThenInclude(jp => jp.JobApplicationQuestions)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => 
                        ((Applicant)u).WorkExperience.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => 
                        ((Applicant)u).Education.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => 
                        ((Applicant)u).CertificationsAndLicenses
                            .OrderByDescending(e => e.IssuedYear)
                            .ThenByDescending(e => e.IssuedMonth))
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.SentBy)
                    .ThenInclude(u => ((Applicant)u).Skills)
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.RepliedTo)
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => ((Employer)u).Reviews)
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => ((Employer)u).JobPosts.OrderByDescending(jp => jp.PostedAt))
                        .ThenInclude(jp => jp.Skills)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => ((Employer)u).JobPosts)
                        .ThenInclude(jp => jp.Qualifications)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => ((Employer)u).JobPosts)
                        .ThenInclude(jp => jp.Responsibilities)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => ((Employer)u).JobPosts)
                        .ThenInclude(jp => jp.JobApplicationQuestions)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => 
                        ((Applicant)u).WorkExperience.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => 
                        ((Applicant)u).Education.OrderByDescending(e => e.StartYear).ThenByDescending(e => e.StartMonth))
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => 
                        ((Applicant)u).CertificationsAndLicenses
                            .OrderByDescending(e => e.IssuedYear)
                            .ThenByDescending(e => e.IssuedMonth))
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ReadBy)
                    .ThenInclude(u => ((Applicant)u).Skills)
                    .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.JobPost)
                        .ThenInclude(jp => jp!.Skills)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.JobPost)
                        .ThenInclude(jp => jp!.Qualifications)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.JobPost)
                        .ThenInclude(jp => jp!.Responsibilities)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.JobPost)
                        .ThenInclude(jp => jp!.JobApplicationQuestions)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.JobPost)
                        .ThenInclude(jp => jp!.Employer)
                            .ThenInclude(e => e.Reviews)
                            .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.User)
                        .ThenInclude(u => (u as Employer)!.JobPosts.OrderByDescending(jp => jp.PostedAt))
                            .ThenInclude(jp => jp.Skills)
                            .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.User)
                        .ThenInclude(u => (u as Employer)!.JobPosts)
                            .ThenInclude(jp => jp.Qualifications)
                            .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.User)
                        .ThenInclude(u => (u as Employer)!.JobPosts)
                            .ThenInclude(jp => jp.Responsibilities)
                            .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.User)
                        .ThenInclude(u => (u as Employer)!.JobPosts)
                            .ThenInclude(jp => jp.JobApplicationQuestions)
                            .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.User)
                        .ThenInclude(u => (u as Applicant)!.Skills)
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.User)
                        .ThenInclude(u => 
                            (u as Applicant)!.WorkExperience
                                .OrderByDescending(e => e.StartYear)
                                .ThenByDescending(e => e.StartMonth))
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.User)
                        .ThenInclude(u => (u as Applicant)!.Education
                            .OrderByDescending(e => e.StartYear)
                            .ThenByDescending(e => e.StartMonth))
                        .AsSplitQuery()
            .Include(c => c.ChatMessages)
                .ThenInclude(m => m.ChatMessageItems)
                    .ThenInclude(i => i.User)
                        .ThenInclude(u => 
                            (u as Applicant)!.CertificationsAndLicenses
                                .OrderByDescending(e => e.IssuedYear)
                                .ThenByDescending(e => e.IssuedMonth))
                        .AsSplitQuery();
    }
}