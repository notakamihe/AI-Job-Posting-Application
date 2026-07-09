using Microsoft.EntityFrameworkCore.Storage;

namespace Backend.Repositories;

public interface IUnitOfWork : IAsyncDisposable
{
    IApplicantRepository Applicants { get; }
    IChatRepository Chats { get; }
    IEmployerRepository Employers { get; }
    IJobApplicationRepository JobApplications { get; }
    IJobPostRepository JobPosts { get; }
    IReviewRepository Reviews { get; }
    ISkillRepository Skills { get; }
    IUserRepository Users { get; }
    Task<int> CompleteAsync();
    Task<IDbContextTransaction> StartTransactionAsync();
}