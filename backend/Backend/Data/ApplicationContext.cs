using System.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class ApplicationContext : IdentityDbContext<User>
{
	public DbSet<Applicant> Applicants { get; set; } = null!;
	public DbSet<CertificateOrLicense> CertificationsAndLicenses { get; set; } = null!;
	public DbSet<Chat> Chats { get; set; } = null!;
	public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
	public DbSet<ChatMessageItem> ChatMessageItems { get; set; } = null!;
	public DbSet<EducationEntry> Education { get; set; } = null!;
	public DbSet<Employer> Employers { get; set; } = null!;
	public DbSet<JobApplicationQuestionAnswer> JobApplicationQuestionAnswers { get; set; } = null!;
	public DbSet<JobApplicationQuestion> JobApplicationQuestions { get; set; } = null!;
	public DbSet<JobApplication> JobApplications { get; set; } = null!;
	public DbSet<JobPost> JobPosts { get; set; } = null!;
	public DbSet<Qualification> Qualifications { get; set; } = null!;
	public DbSet<Responsibility> Responsibilities { get; set; } = null!;
	public DbSet<Skill> Skills { get; set; } = null!;
	public DbSet<Review> Reviews { get; set; } = null!;
	public DbSet<WorkExperienceEntry> WorkExperience { get; set; } = null!;

	public ApplicationContext(DbContextOptions<ApplicationContext> options) : base(options)
	{
	}

	protected override void OnModelCreating(ModelBuilder builder)
	{
		base.OnModelCreating(builder);

		builder.HasPostgresExtension("vector");

		builder
			.HasDbFunction(
				typeof(ApplicationContext).GetMethod(
					nameof(RegexReplace),
					[typeof(string), typeof(string), typeof(string), typeof(string)])!)
			.HasName("regexp_replace");

		builder.Entity<Applicant>().HasMany(e => e.Skills).WithMany(e => e.Applicants).UsingEntity("ApplicantSkills");
		builder.Entity<Applicant>()
			.HasMany(e => e.Following)
			.WithMany(e => e.Followers)
			.UsingEntity(
				"Follows",
				r => r.HasOne(typeof(Employer)).WithMany().HasForeignKey("EmployerId"),
				l => l.HasOne(typeof(Applicant)).WithMany().HasForeignKey("ApplicantId"));
		builder.Entity<Applicant>().HasMany(e => e.AppliedTo).WithMany(e => e.Applicants).UsingEntity<JobApplication>();
		builder.Entity<Applicant>()
			.HasMany(e => e.JobApplicationQuestions)
			.WithMany(e => e.Applicants)
			.UsingEntity<JobApplicationQuestionAnswer>();
		builder.Entity<JobPost>().HasMany(e => e.Skills).WithMany(e => e.JobPosts).UsingEntity("JobPostSkills");
		builder.Entity<User>()
			.HasMany(e => e.ReadChatMessages)
			.WithMany(e => e.ReadBy)
			.UsingEntity(
				"MessageReads",
				r => r.HasOne(typeof(ChatMessage)).WithMany().HasForeignKey("ChatMessageId"),
				l => l.HasOne(typeof(User)).WithMany().HasForeignKey("UserId"));
		builder.Entity<Applicant>()
			.HasMany(e => e.Saved)
			.WithMany(e => e.SavedBy)
			.UsingEntity(
				"SavedJobPosts",
				r => r.HasOne(typeof(JobPost)).WithMany().HasForeignKey("JobPostId"),
				l => l.HasOne(typeof(Applicant)).WithMany().HasForeignKey("ApplicantId"));
		builder.Entity<User>().HasMany(e => e.Chats).WithMany(e => e.Users).UsingEntity("UserChats");

		builder.Entity<ChatMessage>().Property(e => e.SentAt).HasDefaultValueSql("NOW()");
		builder.Entity<ChatMessage>().Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");

		builder.Entity<User>().UseTptMappingStrategy();

		builder.Entity<User>().HasIndex(u => u.Embedding).HasMethod("ivfflat").HasOperators("vector_cosine_ops");
		builder.Entity<JobPost>().HasIndex(jp => jp.Embedding).HasMethod("ivfflat").HasOperators("vector_cosine_ops");

		builder
			.Entity<ChatMessageItem>()
			.ToTable(t => t.HasCheckConstraint(
				"CK_Items",
				@"(""JobPostId"" IS NOT NULL AND ""UserId"" IS NULL) OR (""JobPostId"" IS NULL AND ""UserId"" IS NOT NULL)"));
	}

	public static string RegexReplace(string input, string pattern, string replacement, string flags)
    	=> throw new NotSupportedException("EF Core translation only");

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
    	foreach (var entry in ChangeTracker.Entries<ChatMessage>().Where(e => e.State == EntityState.Modified)) 
    		entry.Entity.UpdatedAt = DateTime.UtcNow;

        return base.SaveChangesAsync(cancellationToken);
    }
}