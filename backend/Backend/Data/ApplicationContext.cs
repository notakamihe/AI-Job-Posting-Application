using System.Data;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
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

    protected override void OnModelCreating(ModelBuilder optionsBuilder)
	{
		base.OnModelCreating(optionsBuilder);

		optionsBuilder.HasPostgresExtension("vector");

		optionsBuilder
			.HasDbFunction(
				typeof(ApplicationContext).GetMethod(
					nameof(RegexReplace),
					[typeof(string), typeof(string), typeof(string), typeof(string)])!)
			.HasName("regexp_replace");

		optionsBuilder.Entity<Applicant>(b =>
		{
			b.HasMany(e => e.Skills).WithMany(e => e.Applicants).UsingEntity("ApplicantSkills");
			b
				.HasMany(e => e.Following)
				.WithMany(e => e.Followers)
				.UsingEntity(
					"Follows",
					r => r.HasOne(typeof(Employer)).WithMany().HasForeignKey("EmployerId"),
					l => l.HasOne(typeof(Applicant)).WithMany().HasForeignKey("ApplicantId"));
			b.HasMany(e => e.AppliedTo).WithMany(e => e.Applicants).UsingEntity<JobApplication>();
			b.HasMany(e => e.JobApplicationQuestions).WithMany(e => e.Applicants).UsingEntity<JobApplicationQuestionAnswer>();
			b
				.HasMany(e => e.Saved)
				.WithMany(e => e.SavedBy)
				.UsingEntity(
					"SavedJobPosts",
					r => r.HasOne(typeof(JobPost)).WithMany().HasForeignKey("JobPostId"),
					l => l.HasOne(typeof(Applicant)).WithMany().HasForeignKey("ApplicantId"));
        });

		optionsBuilder.Entity<ChatMessage>(b =>
		{
			b.Property(e => e.SentAt).HasDefaultValueSql("NOW()");
			b.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
        });

		optionsBuilder.Entity<ChatMessageItem>(b =>
		{
			b.ToTable(t => 
				t.HasCheckConstraint(
					"CK_Items",
					@"(""JobPostId"" IS NOT NULL AND ""UserId"" IS NULL) OR (""JobPostId"" IS NULL AND ""UserId"" IS NOT NULL)"));
        });

		optionsBuilder.Entity<IdentityRole>(b =>
		{
			b.HasData(
				new IdentityRole { Id = "8c6c5021-2446-40bc-aaa7-55b3249cee46", Name = "Admin", NormalizedName = "ADMIN" },
                new IdentityRole { Id = "8f1b9036-f7b9-45dd-a809-4d4ca49c7aec", Name = "User", NormalizedName = "USER" });
        });

		optionsBuilder.Entity<IdentityUserRole<string>>(b =>
		{
			b.HasData(new IdentityUserRole<string> 
			{ 
				RoleId = "8c6c5021-2446-40bc-aaa7-55b3249cee46", 
				UserId = "94ea3562-a459-4082-b760-5a5937970681" 
			});
		});

		optionsBuilder.Entity<JobPost>(b =>
		{
			b.HasMany(e => e.Skills).WithMany(e => e.JobPosts).UsingEntity("JobPostSkills");
			b.HasIndex(jp => jp.Embedding).HasMethod("ivfflat").HasOperators("vector_cosine_ops");
        });

		optionsBuilder.Entity<User>(b =>
		{
			b
				.HasMany(e => e.ReadChatMessages)
				.WithMany(e => e.ReadBy)
				.UsingEntity(
					"MessageReads",
					r => r.HasOne(typeof(ChatMessage)).WithMany().HasForeignKey("ChatMessageId"),
					l => l.HasOne(typeof(User)).WithMany().HasForeignKey("UserId"));
			b.HasMany(e => e.Chats).WithMany(e => e.Users).UsingEntity("UserChats");

			b.UseTptMappingStrategy();

			b.HasIndex(u => u.Embedding).HasMethod("ivfflat").HasOperators("vector_cosine_ops");

			b.HasData(
				new User
				{
					Id = "chatbot",
					UserName = "chatbot@jobpostingsite.site",
					NormalizedUserName = "CHATBOT@JOBPOSTINGSITE.SITE",
					Email = "chatbot@jobpostingsite.site",
					NormalizedEmail = "CHATBOT@JOBPOSTINGSITE.SITE",
					LockoutEnabled = true
                },
				new User
				{ 
					Id = "94ea3562-a459-4082-b760-5a5937970681",
					UserName = "admin@jobpostingsite.site",
					NormalizedUserName = "ADMIN@JOBPOSTINGSITE.SITE",
                    Email = "admin@jobpostingsite.site",
                    NormalizedEmail = "ADMIN@JOBPOSTINGSITE.SITE",
					EmailConfirmed = true,
					PasswordHash = "AQAAAAIAAYagAAAAEIMoxHXLwcvmJ4S9f4bza70vJmVdfFCcQjSRFXMa+r0TwD5AgiOwdoUQjFGnCbyPhg==",
					LockoutEnabled = true
                });
        });
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