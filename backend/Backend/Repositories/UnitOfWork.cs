using Backend.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace Backend.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationContext _context;
    
    public IApplicantRepository Applicants { get; private set; }
    public IChatRepository Chats { get; private set; }
    public IEmployerRepository Employers { get; private set; }
    public IJobApplicationRepository JobApplications { get; private set; }
    public IJobPostRepository JobPosts { get; private set; }
    public IReviewRepository Reviews { get; private set; }
    public ISkillRepository Skills { get; private set; }
    public IUserRepository Users { get; private set; }

    public UnitOfWork(ApplicationContext context)
    {
        _context = context;

        Applicants = new ApplicantRepository(_context);
        Chats = new ChatRepository(_context);
        Employers = new EmployerRepository(_context);
        JobApplications = new JobApplicationRepository(_context);
        JobPosts = new JobPostRepository(_context);;
        Reviews = new ReviewRepository(_context);
        Skills = new SkillRepository(_context);
        Users = new UserRepository(_context);
    }

    public async Task<int> CompleteAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async ValueTask DisposeAsync()
    {
        await _context.DisposeAsync();
    }

    public async Task<IDbContextTransaction> StartTransactionAsync()
    {
        return await _context.Database.BeginTransactionAsync();
    }
}