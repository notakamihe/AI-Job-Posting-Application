using System.Text.RegularExpressions;
using Backend.Data;
using Backend.DTO;
using Backend.Models;
using EntityFrameworkCore.Projectables;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace Backend.Repositories;

class EntityQueryResult
{
	public required EntityQueryType Type { get; set; }
	public double? Score { get; set; }
	public string Id { get; set; } = string.Empty;
}

public class EntityQueryRepository : IEntityQueryRepository
{
    private readonly ApplicationContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public EntityQueryRepository(ApplicationContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    private IQueryable<EntityQueryResult>? BuildDiscoverQuery(DiscoverFilter filter, User? user, bool publicOnly)
    {
        IQueryable<EntityQueryResult>? query = null;

        if ((filter.Type.Count == 0 || filter.Type.Contains(EntityQueryType.Applicant)) && user is not Applicant)
            query = _context.Applicants 
                .Where(a => (!publicOnly || !a.IsPrivate) && (user == null || a.Id != user.Id))
                .WhereSatisfiesDiscoverFilter(filter)
                .SelectWithAlgorithmScore(user);

        if ((filter.Type.Count == 0 || filter.Type.Contains(EntityQueryType.Employer)) && user is not Employer)
        {
            var employerQuery = _context.Employers
                .Where(e => user == null || e.Id != user.Id)
                .WhereSatisfiesDiscoverFilter(filter)
                .SelectWithAlgorithmScore(user);

            query = query is not null ? query.Concat(employerQuery) : employerQuery;
        }

        if ((filter.Type.Count == 0 || filter.Type.Contains(EntityQueryType.JobPost)) && user is not Employer) 
        {
            var jobPostQuery = _context.JobPosts.WhereSatisfiesDiscoverFilter(filter).SelectWithAlgorithmScore(user);
            query = query is not null ? query.Concat(jobPostQuery) : jobPostQuery;
        }

        return query?.OrderByDescending(e => e.Score);
    }

    private IQueryable<EntityQueryResult>? BuildSearchQuery(
        string term, 
        DiscoverFilter filter, 
        User? user, 
        bool publicOnly)
    {
        IQueryable<EntityQueryResult>? query = null;

        if (filter.Type.Count == 0 || filter.Type.Contains(EntityQueryType.Applicant))
            query = _context.Applicants
                .Where(a => (!publicOnly || !a.IsPrivate) && (user == null || a.Id != user.Id))
                .WhereSatisfiesDiscoverFilter(filter)
                .SelectWithSearchAlgorithmScore(term);

        if (filter.Type.Count == 0 || filter.Type.Contains(EntityQueryType.Employer))
        {
            var employerQuery = _context.Employers
                .Where(e => user == null || e.Id != user.Id)
                .WhereSatisfiesDiscoverFilter(filter)
                .SelectWithSearchAlgorithmScore(term);

            query = query is not null ? query.Concat(employerQuery) : employerQuery;
        }

        if (filter.Type.Count == 0 || filter.Type.Contains(EntityQueryType.JobPost))
        {
            var jobPostQuery = _context.JobPosts
                .WhereSatisfiesDiscoverFilter(filter)
                .SelectWithSearchAlgorithmScore(term);

            query = query is not null ? query.Concat(jobPostQuery) : jobPostQuery;
        }

        query = query?.Where(e => e.Score > 0);

        if (user is Applicant)
            query = query?.OrderBy(e => e.Type == EntityQueryType.Applicant ? 1 : 0).ThenByDescending(e => e.Score);
        else if (user is Employer)
            query = query?.OrderBy(e => e.Type == EntityQueryType.Applicant ? 0 : 1).ThenByDescending(e => e.Score);
        else
            query = query?.OrderByDescending(e => e.Score);

        return query;
    }

    public async Task<int> CountDiscoverEntitiesAsync(DiscoverFilter filter, User? user, bool publicOnly)
    {
        IQueryable<EntityQueryResult>? query = BuildDiscoverQuery(filter, user, publicOnly);
        return query is not null ? await query.CountAsync() : 0;
    } 

    public async Task<int> CountDiscoverEntitiesBySearchTermAsync(
        string term, 
        DiscoverFilter filter, 
        User? user, 
        bool publicOnly)
    {
        IQueryable<EntityQueryResult>? query = BuildSearchQuery(term, filter, user, publicOnly);
        return query is not null ? await query.CountAsync() : 0;
    }

    public async Task<List<object>> GetDiscoverEntitiesAsync(
        DiscoverFilter filter, 
        User? user, 
        bool publicOnly, 
        int page, 
        int pageSize)
    {
        IQueryable<EntityQueryResult>? query = BuildDiscoverQuery(filter, user, publicOnly);
        return query is not null ? await LoadEntitiesAsync(query.Skip((page - 1) * pageSize).Take(pageSize)) : [];
    }

    public async Task<List<object>> GetEntitiesBySearchTermAsync(
        string term, 
        DiscoverFilter filter, 
        User? user, 
        bool publicOnly,
        int page, 
        int pageSize)
    {
        IQueryable<EntityQueryResult>? query = BuildSearchQuery(term, filter, user, publicOnly);
        return query is not null ? await LoadEntitiesAsync(query.Skip((page - 1) * pageSize).Take(pageSize)) : [];
    }

    public async Task<List<object>> GetRelevantEntitiesAsync(
        Vector queryVector, 
        EntityFilter? filter = null, 
        User? user = null,
        int top = 5)
    {   
        IQueryable<EntityQueryResult>? query = null;
        
        if (filter is null || filter.Types.Contains(EntityQueryType.Applicant))
        {
            var applicantQuery = _context.Applicants.Where(a => !a.IsPrivate && (user == null || a.Id != user.Id));

            if (filter?.Applicant is not null)
                applicantQuery = applicantQuery.WhereSatisfiesFilter(filter.Applicant);

            query = applicantQuery.Select(u => new EntityQueryResult
            {
                Type = EntityQueryType.Applicant,
                Id = u.Id,
                Score = u.Embedding != null ? u.Embedding.CosineDistance(queryVector) : 2
            });
        }
        
        if (filter is null || filter.Types.Contains(EntityQueryType.Employer))
        {
            var employerQuery = _context.Employers.Where(e => user == null || e.Id != user.Id);

            if (filter?.Employer is not null)
                employerQuery = employerQuery.WhereSatisfiesFilter(filter.Employer);

            var employerEntityResultQuery = employerQuery.Select(u => new EntityQueryResult
            {
                Type = EntityQueryType.Employer,
                Id = u.Id,
                Score = u.Embedding != null ? u.Embedding.CosineDistance(queryVector) : 2
            });

            query = query is not null ? query.Concat(employerEntityResultQuery) : employerEntityResultQuery;
        }
        
        if (filter is null || filter.Types.Contains(EntityQueryType.JobPost))
        {
            IQueryable<JobPost> jobPostQuery = _context.JobPosts;

            if (filter?.JobPost is not null)
                jobPostQuery = jobPostQuery.WhereSatisfiesFilter(filter.JobPost);

            var jobPostEntityResultQuery = jobPostQuery.Select(jp => new EntityQueryResult
            {
                Type = EntityQueryType.JobPost,
                Id = jp.Id.ToString(),
                Score = jp.Embedding != null ? jp.Embedding.CosineDistance(queryVector) : 2
            });

            query = query is not null ? query.Concat(jobPostEntityResultQuery) : jobPostEntityResultQuery;
        }
        
        List<object> items = [];

        if (query is not null)
        {
            query = query.Where(e => e.Score <= 0.75);
            
            if (user is Applicant)
                query = query.OrderBy(e => e.Type == EntityQueryType.Applicant ? 1 : 0).ThenBy(e => e.Score);
            else if (user is Employer)
                query = query.OrderBy(e => e.Type == EntityQueryType.Applicant ? 0 : 1).ThenBy(e => e.Score);
            else
                query = query.OrderBy(e => e.Score);

            items = await LoadEntitiesAsync(query.Take(top));
        }

        return items;
    }

    private async Task<List<object>> LoadEntitiesAsync(IQueryable<EntityQueryResult> query)
    {
        var results = await query.ToListAsync();
        var userIds = results.Where(r => r.Type != EntityQueryType.JobPost).Select(i => i.Id).ToList();
        var jobPostIds = results.Where(r => r.Type == EntityQueryType.JobPost).Select(i => long.Parse(i.Id)).ToList();

        var users = await _unitOfWork.Users.GetByIdsAsync(userIds);
        var posts = await _unitOfWork.JobPosts.GetByIdsAsync(jobPostIds);

        List<object> entities = [..users, ..posts];
        
        return entities
            .OrderBy(e => e is JobPost post 
                ? results.FindIndex(r => r.Type == EntityQueryType.JobPost && long.Parse(r.Id) == post.Id) 
                : results.FindIndex(r => r.Type != EntityQueryType.JobPost && r.Id == ((User)e).Id))
            .ToList();
    }
}

static class EntityQueryExtensions
{
    [Projectable]
    private static int HexDigitToDecimal(string digit) => 
        digit == "a" ? 10 :
        digit == "b" ? 11 :
        digit == "c" ? 12 :
        digit == "d" ? 13 :
        digit == "e" ? 14 :
        digit == "f" ? 15 :
        Convert.ToInt32(digit);

    [Projectable]
    private static double ScoreMultiplier(string a, string[] words, string b) => 
        Regex.IsMatch(
            a,
            "\\y" + ApplicationContext.RegexReplace(b, @"([\\.\^$|?*+(){}\[\]])", @"\\\1", "g") + "\\y") || 
        Regex.IsMatch(
            b,
            "\\y" + ApplicationContext.RegexReplace(a, @"([\\.\^$|?*+(){}\[\]])", @"\\\1", "g") + "\\y")
            ? 2
            : a.Contains(b) || b.Contains(a) ? 1 : words.Any(w => b.Contains(w) || w.Contains(b)) ? 0.5 : 0;

    public static IQueryable<EntityQueryResult> SelectWithAlgorithmScore(this IQueryable<Applicant> query, User? user)
    {
        if (user is Employer employer)
        {
            var jobPostTitles = employer.JobPosts.Select(jp => jp.Title.ToLower()).ToList();
            var jobPostSummaries = employer.JobPosts.Select(jp => jp.Summary.ToLower()).ToList();
            var jobPostSkills = employer.JobPosts.SelectMany(jp => jp.Skills.Select(s => s.Name.ToLower())).ToList();
            var jobPostQualifications = employer.JobPosts
                .SelectMany(jp => jp.Qualifications.Select(q => q.Description.ToLower()))
                .ToList();
            var jobPostResponsibilities = employer.JobPosts
                .SelectMany(jp => jp.Responsibilities.Select(q => q.Description.ToLower()))
                .ToList();
            var degreeKeywords = Enum.GetValues<EducationOrTrainingLevel>().SelectMany(l => 
                l is EducationOrTrainingLevel.Doctorate 
                    ? new List<string> { "doctor", "phd", "ph.d" } 
                    : new List<string> { l.ToString().ToLower() });

            return query
                .Select(a => new EntityQueryResult
                {
                    Type = EntityQueryType.Applicant,
                    Id = a.Id,
                    Score =
                        (
                            !string.IsNullOrWhiteSpace(a.PreferredOccupation) && 
                            jobPostTitles.Any(t =>
                                t.Contains(a.PreferredOccupation.ToLower()) || 
                                a.PreferredOccupation.ToLower().Contains(t)) ? 100 : 0
                        ) +
                        (
                            jobPostTitles.Any(t =>
                                a.WorkExperience.Any(e =>
                                    e.Position!.ToLower().Contains(t) || 
                                    t.Contains(e.Position.ToLower()))) ? 99 : 0
                        ) +
                        (
                            a.WorkExperience.Any(e =>
                                !string.IsNullOrWhiteSpace(e.Employer) &&
                                (e.Employer.ToLower().Contains(employer.Name.ToLower()) || 
                                 employer.Name.ToLower().Contains(e.Employer.ToLower()))) ? 98 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(employer.About) && 
                            !string.IsNullOrWhiteSpace(a.PreferredOccupation) &&
                            employer.About.ToLower().Contains(a.PreferredOccupation.ToLower()) ? 97 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(a.PreferredOccupation) &&
                            (
                                employer.Name.ToLower().Contains(a.PreferredOccupation.ToLower()) ||
                                a.PreferredOccupation.ToLower().Contains(employer.Name.ToLower())
                            ) ? 96 : 0
                        ) + 
                        (
                            !string.IsNullOrWhiteSpace(a.About) && 
                            a.About.ToLower().Contains(employer.Name.ToLower()) ? 95 : 0
                        ) +
                        (
                            a.WorkExperience.Any(e =>
                                employer.Name.ToLower().Contains(e.Position.ToLower()) ||
                                e.Position.ToLower().Contains(employer.Name.ToLower())) ? 94 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(employer.About) && 
                            a.WorkExperience.Any(e => employer.About.ToLower().Contains(e.Position.ToLower())) ? 93 : 0
                        ) + 
                        (
                            !string.IsNullOrWhiteSpace(a.PreferredOccupation) &&
                            jobPostSummaries.Any(s => s.Contains(a.PreferredOccupation.ToLower())) ? 92 : 0
                        ) +
                        (a.WorkExperience.Any(e => jobPostSummaries.Any(s => s.Contains(e.Position.ToLower()))) ? 91 : 0) +
                        (
                            !string.IsNullOrWhiteSpace(a.About) &&
                            jobPostTitles.Any(t => a.About.ToLower().Contains(t)) ? 90 : 0
                        ) +
                        (
                            a.Education.Any(e => 
                                e.Institution.ToLower().Contains(employer.Name.ToLower()) ||
                                employer.Name.ToLower().Contains(e.Institution.ToLower())) ? 89 : 0
                        ) + 
                        (
                            !string.IsNullOrWhiteSpace(a.PreferredOccupation) &&
                            jobPostQualifications.Any(q => q.Contains(a.PreferredOccupation.ToLower())) ? 50 : 0
                        ) + 
                        (
                            a.WorkExperience.Any(e => 
                                jobPostQualifications.Any(q => q.Contains(e.Position.ToLower()))) ? 49 : 0
                        ) +
                        (
                            a.CertificationsAndLicenses.Any(cl => 
                                employer.Name.ToLower().Contains(cl.Issuer.ToLower()) ||
                                cl.Issuer.ToLower().Contains(employer.Name.ToLower())) ? 48 : 0
                        ) +
                        (
                            a.CertificationsAndLicenses.Any(cl => 
                                jobPostSummaries.Any(s => s.Contains(cl.Name.ToLower()))) ? 47 : 0
                        ) + 
                        (
                            a.CertificationsAndLicenses.Any(cl =>
                                jobPostQualifications.Any(q => q.Contains(cl.Name.ToLower()))) ? 46 : 0
                        ) + 
                        (
                            !string.IsNullOrWhiteSpace(employer.About) &&
                            a.CertificationsAndLicenses.Any(cl =>
                                employer.About.ToLower().Contains(cl.Name.ToLower())) ? 45 : 0 
                        ) + 
                        (
                            a.CertificationsAndLicenses.Any(cl => 
                                jobPostSkills.Any(s => 
                                    s.Contains(cl.Name.ToLower()) || 
                                    cl.Name.ToLower().Contains(s))) ? 44 : 0
                        ) + 
                        (
                            a.Education.Any(e =>
                                !string.IsNullOrWhiteSpace(e.Major) && 
                                jobPostSkills.Any(s =>
                                    s.Contains(e.Major.ToLower()) || 
                                    e.Major.Contains(s.ToLower()))) ? 43 : 0
                        ) + 
                        (
                            a.Education.Any(e => 
                                !string.IsNullOrWhiteSpace(e.Major) &&
                                (
                                    employer.Name.ToLower().Contains(e.Major.ToLower()) || 
                                    e.Major.ToLower().Contains(employer.Name.ToLower())
                                )) ? 42 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(employer.About) &&
                            a.Education.Any(e => 
                                !string.IsNullOrWhiteSpace(e.Major) && 
                                employer.About.ToLower().Contains(e.Major.ToLower())) ? 41 : 0
                        ) + 
                        (
                            a.Education.Any(e => 
                                !string.IsNullOrWhiteSpace(e.Major) &&
                                jobPostTitles.Any(t => 
                                    t.Contains(e.Major.ToLower()) || 
                                    e.Major.ToLower().Contains(t))) ? 40 : 0 
                        ) +
                        (
                            a.Education.Any(e =>
                                !string.IsNullOrWhiteSpace(e.Major) &&
                                jobPostSummaries.Any(s => s.Contains(e.Major.ToLower()))) ? 39 : 0
                        ) +
                        (
                            a.Education.Any(e =>
                                !string.IsNullOrWhiteSpace(e.Major) &&
                                jobPostQualifications.Any(q => q.Contains(e.Major.ToLower()))) ? 38 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(employer.Location) && 
                            !string.IsNullOrWhiteSpace(a.Location) && 
                            (
                                employer.Location.ToLower().Contains(a.Location.ToLower()) || 
                                a.Location.ToLower().Contains(employer.Location.ToLower())
                            ) ? 25 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(employer.Industry) && 
                            !string.IsNullOrWhiteSpace(a.Industry) && 
                            employer.Industry.ToLower() == a.Industry.ToLower() ? 24 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(employer.Location) && 
                            a.Education.Any(e =>
                                !string.IsNullOrWhiteSpace(e.InstitutionLocation) && 
                                (
                                    e.InstitutionLocation.ToLower().Contains(employer.Location.ToLower()) || 
                                    employer.Location.ToLower().Contains(e.InstitutionLocation.ToLower())
                                )) ? 23 : 0
                        ) +
                        (
                            a.Skills.Any(s =>
                                jobPostSkills.Any(x =>
                                    x.ToLower().Contains(s.Name.ToLower()) || 
                                    s.Name.ToLower().Contains(x.ToLower()))) ? 22 : 0
                        ) + 
                        (a.Skills.Any(s => jobPostQualifications.Any(q => q.Contains(s.Name.ToLower()))) ? 21 : 0) +
                        (
                            a.Skills.Any(s => 
                                employer.Name.ToLower().Contains(s.Name.ToLower()) ||
                                s.Name.ToLower().Contains(employer.Name.ToLower())) ? 20 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(employer.About) && 
                            a.Skills.Any(s => employer.About.ToLower().Contains(s.Name.ToLower())) ? 19 : 0
                        ) + 
                        (
                            !string.IsNullOrWhiteSpace(a.About) &&
                            jobPostSkills.Any(s => a.About.ToLower().Contains(s)) ? 18 : 0
                        ) + 
                        (
                            a.Education.Any(e =>
                                !string.IsNullOrWhiteSpace(e.Major) &&
                                jobPostResponsibilities.Any(r => r.Contains(e.Major.ToLower()))) ? 17 : 0
                        ) +
                        (a.Skills.Any(s => jobPostResponsibilities.Any(r => r.Contains(s.Name.ToLower()))) ? 10 : 0) +
                        (
                            a.Education.Any(e =>
                                !string.IsNullOrWhiteSpace(e.Degree) && 
                                degreeKeywords.Any(d => 
                                    e.Degree.ToLower().Contains(d) &&
                                    jobPostQualifications.Any(q => q.ToLower().Contains(d)))) ? 9 : 0
                        ) +
                        (
                            a.Education.Any(e =>
                                !string.IsNullOrWhiteSpace(e.Degree) &&
                                jobPostQualifications.Any(q => q.ToLower().Contains(e.Degree.ToLower()))) ? 8 : 0
                        ) +
                        (a.ReadyToWork ? 5 : 0)
                });
        }

        return query.Select(a => new EntityQueryResult
        {
            Type = EntityQueryType.Applicant,
            Id = a.Id,
            Score = -(HexDigitToDecimal(a.Id.Substring(0, 1)) % 10)
        });
    }

    public static IQueryable<EntityQueryResult> SelectWithAlgorithmScore(this IQueryable<Employer> query, User? user)
    {
        if (user is Applicant applicant)
        {
            var workPositions = applicant.WorkExperience.Select(e => e.Position.ToLower()).ToList();
            var workEmployers = applicant.WorkExperience
                .Where(e => !string.IsNullOrWhiteSpace(e.Employer))
                .Select(e => e.Employer!.ToLower())
                .ToList();
            var institutions = applicant.Education.Select(e => e.Institution.ToLower()).ToList();
            var institutionLocations = applicant.Education
                .Where(e => !string.IsNullOrWhiteSpace(e.InstitutionLocation))
                .Select(e => e.InstitutionLocation!.ToLower())
                .ToList();
            var majors = applicant.Education
                .Where(e => !string.IsNullOrWhiteSpace(e.Major))
                .Select(e => e.Major!.ToLower())
                .ToList();
            var certificateOrLicenseNames = applicant.CertificationsAndLicenses.Select(cl => cl.Name.ToLower()).ToList();
            var certificateOrLicenseIssuers = applicant.CertificationsAndLicenses.Select(cl => cl.Issuer.ToLower()).ToList();
            var skills = applicant.Skills.Select(s => s.Name.ToLower()).ToList();
    
            return query
                .Select(e => new
                {
                    Employer = e,
                    Score =
                        (
                            !string.IsNullOrWhiteSpace(applicant.PreferredOccupation) && 
                            (
                                e.Name.ToLower().Contains(applicant.PreferredOccupation.ToLower()) ||
                                applicant.PreferredOccupation.ToLower().Contains(e.Name.ToLower())
                            ) ? 100 : 0
                        ) +
                        (
                            !string.IsNullOrWhiteSpace(e.About) &&
                            !string.IsNullOrWhiteSpace(applicant.PreferredOccupation) && 
                            e.About.ToLower().Contains(applicant.PreferredOccupation.ToLower()) ? 99 : 0
                        ) + 
                        (workEmployers.Any(we => we.Contains(e.Name.ToLower()) || e.Name.ToLower().Contains(we)) ? 98 : 0) +
                        (
                            !string.IsNullOrWhiteSpace(e.About) && 
                            workPositions.Any(p => e.About.ToLower().Contains(p)) ? 97 : 0
                        ) + 
                        (institutions.Any(i => e.Name.ToLower().Contains(i) || i.Contains(e.Name.ToLower())) ? 50 : 0) +
                        (certificateOrLicenseIssuers.Any(i => i.ToLower().Contains(e.Name.ToLower())) ? 49 : 0) +
                        (
                            !string.IsNullOrWhiteSpace(e.About) && 
                            certificateOrLicenseNames.Any(n => e.About.ToLower().Contains(n)) ? 48 : 0
                        ) +
                        (majors.Any(m => e.Name.ToLower().Contains(m!)) ? 47 : 0) +
                        (!string.IsNullOrWhiteSpace(e.About) && majors.Any(m => e.About.ToLower().Contains(m)) ? 46 : 0) +
                        (
                            !string.IsNullOrWhiteSpace(e.Location) && 
                            !string.IsNullOrWhiteSpace(applicant.Location) && 
                            (
                                e.Location.ToLower().Contains(applicant.Location.ToLower()) || 
                                applicant.Location.ToLower().Contains(e.Location.ToLower())
                            ) ? 25 : 0
                        ) + 
                        (
                            !string.IsNullOrWhiteSpace(e.Industry) && 
                            !string.IsNullOrWhiteSpace(applicant.Industry) && 
                            e.Industry.ToLower() == applicant.Industry.ToLower() ? 24 : 0
                        ) + 
                        (skills.Any(s => e.Name.ToLower().Contains(s)) ? 23 : 0) +
                        (!string.IsNullOrWhiteSpace(e.About) && skills.Any(s => e.About.ToLower().Contains(s)) ? 22 : 0) +
                        (e.Followers.Any(f => f.Id == applicant.Id) ? 21 : 0) +
                        (
                            !string.IsNullOrWhiteSpace(e.Location) && 
                            institutionLocations.Any(l =>
                                l!.Contains(e.Location.ToLower()) || 
                                e.Location.ToLower().Contains(l)) ? 10 : 0
                        )
                })
                .Select(x => new EntityQueryResult 
                {
                    Type = EntityQueryType.Employer,
                    Id = x.Employer.Id,
                    Score = x.Score != 0 ? x.Score : -(HexDigitToDecimal(x.Employer.Id.Substring(0, 1)) % 10)
                });
        }

        return query.Select(e => new EntityQueryResult
        {
            Type = EntityQueryType.Employer,
            Id = e.Id,
            Score = -(HexDigitToDecimal(e.Id.Substring(0, 1)) % 10)
        });
    }
    
    public static IQueryable<EntityQueryResult> SelectWithAlgorithmScore(this IQueryable<JobPost> query, User? user)
    {
        if (user is Applicant applicant)
        {
            var workPositions = applicant.WorkExperience.Select(e => e.Position.ToLower()).ToList();
            var majors = applicant.Education
                .Where(e => !string.IsNullOrWhiteSpace(e.Major))
                .Select(e => e.Major!.ToLower())
                .ToList();
            var certificateOrLicenseNames = applicant.CertificationsAndLicenses.Select(e => e.Name.ToLower()).ToList();
            var degreeKeywords = Enum.GetValues<EducationOrTrainingLevel>()
                .SelectMany(l => l is EducationOrTrainingLevel.Doctorate 
                    ? new List<string> { "doctor", "phd", "ph.d" } 
                    : new List<string> { l.ToString().ToLower() })
                .Where(d => applicant.Education.Any(e => e.Degree is not null && e.Degree.ToLower().Contains(d)));
            var skills = applicant.Skills.Select(s => s.Name.ToLower()).ToList();

            return query
                .Select(jp => new
                {
                    JobPost = jp,
                    Score = jp.PostedAt < DateTime.UtcNow.AddYears(-1) 
                        ? -jp.Id % 10 
                        : 
                            (
                                !string.IsNullOrWhiteSpace(applicant.PreferredOccupation) && 
                                (
                                    jp.Title.ToLower().Contains(applicant.PreferredOccupation.ToLower()) || 
                                    applicant.PreferredOccupation.ToLower().Contains(jp.Title.ToLower())
                                ) ? 100 : 0
                            ) +
                            (
                                !string.IsNullOrWhiteSpace(applicant.PreferredOccupation) && 
                                jp.Summary.ToLower().Contains(applicant.PreferredOccupation.ToLower()) ? 99 : 0
                            ) +
                            (
                                workPositions.Any(p => 
                                    p.Contains(jp.Title.ToLower()) || 
                                    jp.Title.ToLower().Contains(p)) ? 98 : 0
                            ) + 
                            (
                                !string.IsNullOrWhiteSpace(applicant.PreferredOccupation) &&
                                jp.Qualifications.Any(q => 
                                    q.Description.ToLower().Contains(applicant.PreferredOccupation.ToLower())) ? 50 : 0
                            ) + 
                            (
                                jp.Qualifications.Any(q =>
                                    certificateOrLicenseNames.Any(n => q.Description.ToLower().Contains(n))) ? 49 : 0
                            ) + 
                            (
                                workPositions.Any(p => 
                                    jp.Qualifications.Any(q => q.Description.ToLower().Contains(p))) ? 48 : 0
                            ) + 
                            (
                                !string.IsNullOrWhiteSpace(jp.Employer.Industry) && 
                                !string.IsNullOrWhiteSpace(applicant.Industry) && 
                                jp.Employer.Industry.ToLower() == applicant.Industry.ToLower() ? 45 : 0
                            ) + 
                            (jp.Employer.Followers.Any(f => f.Id == applicant.Id) ? 44 : 0) +
                            (
                                jp.Skills.Any(s =>
                                    majors.Any(m => 
                                        s.Name.ToLower().Contains(m) ||
                                        m.Contains(s.Name.ToLower()))) ? 25 : 0
                            ) + 
                            (majors.Any(m => jp.Qualifications.Any(q => q.Description.ToLower().Contains(m))) ? 24 : 0) +
                            (
                                !string.IsNullOrWhiteSpace(jp.Employer.Location) && 
                                !string.IsNullOrWhiteSpace(applicant.Location) && 
                                (
                                    jp.Employer.Location.ToLower().Contains(applicant.Location.ToLower()) || 
                                    applicant.Location.ToLower().Contains(jp.Employer.Location.ToLower())
                                ) ? 23 : 0
                            ) + 
                            (
                                jp.Skills.Any(s => 
                                    skills.Any(x => 
                                        x.Contains(s.Name.ToLower()) || 
                                        s.Name.ToLower().Contains(x))) ? 22 : 0
                            ) + 
                            (skills.Any(s => jp.Qualifications.Any(q => q.Description.ToLower().Contains(s))) ? 21 : 0) +
                            (skills.Any(s => jp.Summary.ToLower().Contains(s)) ? 20 : 0) +
                            (
                                !string.IsNullOrWhiteSpace(applicant.About) && 
                                jp.Skills.Any(s => applicant.About.ToLower().Contains(s.Name.ToLower())) ? 19 : 0
                            ) +
                            (skills.Any(s => jp.Responsibilities.Any(r => r.Description.ToLower().Contains(s))) ? 10 : 0) +
                            (
                                degreeKeywords.Any(d => 
                                    jp.Qualifications.Any(q => q.Description.ToLower().Contains(d))) ? 9 : 0
                            )
                })
                .Select(x => new EntityQueryResult 
                { 
                    Type = EntityQueryType.JobPost, 
                    Id = x.JobPost.Id.ToString(), 
                    Score = x.Score != 0 ? x.Score : -(x.JobPost.Id % 10)
                });
        }
        
        return query.Select(jp => new EntityQueryResult
        {
            Type = EntityQueryType.JobPost,
            Id = jp.Id.ToString(),
            Score = -(jp.Id % 10)
        }); 
    }

    public static IQueryable<EntityQueryResult> SelectWithSearchAlgorithmScore(
        this IQueryable<Applicant> query, 
        string term)
    {
        term = term.ToLower();
        var words = term.Split();

        return query
            .Select(a => new EntityQueryResult
            {
                Type = EntityQueryType.Applicant,
                Id = a.Id,
                Score = 
                    (100 * ScoreMultiplier(term, words, a.FullName.ToLower())) +
                    (
                        !string.IsNullOrWhiteSpace(a.PreferredOccupation) 
                            ? 99 * ScoreMultiplier(term, words, a.PreferredOccupation.ToLower()) 
                            : 0
                    ) +
                    (!string.IsNullOrWhiteSpace(a.About) ? 50 * ScoreMultiplier(term, words, a.About.ToLower()) : 0) +
                    (!string.IsNullOrWhiteSpace(a.Link1) ? 49 * ScoreMultiplier(term, words, a.Link1.ToLower()) : 0) +
                    (!string.IsNullOrWhiteSpace(a.Link2) ? 49 * ScoreMultiplier(term, words, a.Link2.ToLower()) : 0) +
                    (
                        a.WorkExperience.Any() 
                            ? a.WorkExperience.Max(e => 48 * ScoreMultiplier(term, words, e.Position.ToLower()))
                            : 0
                    ) +
                    (
                        a.CertificationsAndLicenses.Any()
                            ? a.CertificationsAndLicenses.Max(cl => 47 * ScoreMultiplier(term, words, cl.Name.ToLower()))
                            : 0
                    ) +
                    (
                        a.Education.Any() 
                            ? a.Education
                                .Max(e => !string.IsNullOrWhiteSpace(e.Major) 
                                    ? 46 * ScoreMultiplier(term, words, e.Major.ToLower())
                                    : 0) 
                            : 0
                    ) + 
                    (
                        a.CertificationsAndLicenses.Any()
                            ? a.CertificationsAndLicenses
                                .Max(cl => 25 * ScoreMultiplier(term, words, cl.Issuer.ToLower()))
                            : 0
                    ) + 
                    (
                        a.WorkExperience.Any()
                            ? a.WorkExperience.Max(e =>
                                !string.IsNullOrWhiteSpace(e.Employer)
                                    ? 24 * ScoreMultiplier(term, words, e.Employer.ToLower()) 
                                    : 0)
                            : 0
                    ) +
                    (
                        a.Skills.Any()
                            ? a.Skills.Max(s => 23 * ScoreMultiplier(term, words, s.Name.ToLower()))
                            : 0
                    ) +
                    (!string.IsNullOrWhiteSpace(a.Location) ? 22 * ScoreMultiplier(term, words, a.Location.ToLower()) : 0) +
                    (
                        a.Education.Any()
                            ? a.Education.Max(e => 21 * ScoreMultiplier(term, words, e.Institution.ToLower()))
                            : 0
                    ) +
                    (
                        a.Education.Any()
                            ? a.Education.Max(e =>
                                !string.IsNullOrWhiteSpace(e.InstitutionLocation) 
                                    ? 20 * ScoreMultiplier(term, words, e.InstitutionLocation.ToLower())
                                    : 0)
                            : 0
                    ) +
                    (
                        a.Education.Any()
                            ? a.Education.Max(e => 
                                !string.IsNullOrWhiteSpace(e.Degree) 
                                    ? 10 * ScoreMultiplier(term, words, e.Degree.ToLower()) 
                                    : 0)
                            : 0
                    ) +
                    (
                        a.WorkExperience.Any()
                            ? a.WorkExperience.Max(e =>
                                !string.IsNullOrWhiteSpace(e.Description) 
                                    ? 9 * ScoreMultiplier(term, words, e.Description.ToLower()) 
                                    : 0)
                            : 0
                    ) + 
                    (
                        a.CertificationsAndLicenses.Any()
                            ? a.CertificationsAndLicenses.Max(cl =>
                                !string.IsNullOrWhiteSpace(cl.Description) 
                                    ? 8 * ScoreMultiplier(term, words, cl.Description.ToLower()) 
                                    : 0)
                            : 0
                    )
            });
    }

    public static IQueryable<EntityQueryResult> SelectWithSearchAlgorithmScore(
        this IQueryable<Employer> query, 
        string term)
    {
        term = term.ToLower();
        var words = term.Split();
        
        return query
            .Select(e => new EntityQueryResult
            {
                Type = EntityQueryType.Employer,
                Id = e.Id,
                Score = 
                    (100 * ScoreMultiplier(term, words, e.Name.ToLower())) +
                    (!string.IsNullOrWhiteSpace(e.About) ? 50 * ScoreMultiplier(term, words, e.About.ToLower()) : 0) +
                    (
                        e.JobPosts.Any() 
                            ? e.JobPosts.Max(jp => 49 * ScoreMultiplier(term, words, jp.Title.ToLower())) 
                            : 0
                    ) +
                    (!string.IsNullOrWhiteSpace(e.Website) ? 48 * ScoreMultiplier(term, words, e.Website.ToLower()) : 0) +
                    (!string.IsNullOrWhiteSpace(e.Location) ? 25 * ScoreMultiplier(term, words, e.Location.ToLower()) : 0) +
                    (
                        e.JobPosts.Any()
                            ? e.JobPosts.Max(jp => 24 * ScoreMultiplier(term, words, jp.Summary.ToLower()))
                            : 0
                    ) +
                    (
                        e.JobPosts.Any()
                            ? e.JobPosts.Max(jp => jp.Skills.Any() 
                                ? jp.Skills.Max(s => 23 * ScoreMultiplier(term, words, s.Name.ToLower())) 
                                : 0)
                            : 0
                    )
            });
    }
    
    public static IQueryable<EntityQueryResult> SelectWithSearchAlgorithmScore(
        this IQueryable<JobPost> query, 
        string term)
    {
        term = term.ToLower();
        var words = term.Split();

        return query
            .Select(jp => new EntityQueryResult
            {
                Type = EntityQueryType.JobPost,
                Id = jp.Id.ToString(),
                Score = 
                    (100 * ScoreMultiplier(term, words, jp.Title.ToLower())) +
                    (50 * ScoreMultiplier(term, words, jp.Summary.ToLower())) + 
                    (49 * ScoreMultiplier(term, words, jp.Employer.Name.ToLower())) + 
                    (
                        jp.Qualifications.Any()
                            ? jp.Qualifications.Max(q => 50 * ScoreMultiplier(term, words, q.Description.ToLower()))
                            : 0
                    ) +
                    (47 * ScoreMultiplier(term, words, jp.Schedule.ToLower())) +
                    (jp.Skills.Any() ? jp.Skills.Max(s => 25 * ScoreMultiplier(term, words, s.Name.ToLower())) : 0) +
                    (
                        !string.IsNullOrWhiteSpace(jp.Employer.About) 
                            ? 24 * ScoreMultiplier(term, words, jp.Employer.About.ToLower())
                            : 0
                    ) +
                    (
                        jp.Responsibilities.Any() 
                            ? jp.Responsibilities.Max(r => 23 * ScoreMultiplier(term, words, r.Description.ToLower()))
                            : 0
                    ) +
                    (
                        !string.IsNullOrWhiteSpace(jp.AdditionalDetails) 
                            ? 10 * ScoreMultiplier(term, words, jp.AdditionalDetails.ToLower())
                            : 0
                    )
            });
    }

    public static IQueryable<Applicant> WhereSatisfiesDiscoverFilter(
        this IQueryable<Applicant> query,
        DiscoverFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Location))
            query = query.Where(a => 
                !string.IsNullOrWhiteSpace(a.Location) && (
                    a.Location.ToLower().Contains(filter.Location.ToLower()) ||
                    filter.Location.ToLower().Contains(a.Location.ToLower())));

        if (filter.Applicant is not null)
        {
            query = query.WhereSatisfiesFilter(filter.Applicant);
            
            if (!string.IsNullOrWhiteSpace(filter.Applicant.PreferredOccupation))
                query = query.Where(a =>
                    !string.IsNullOrWhiteSpace(a.PreferredOccupation) && 
                    (a.PreferredOccupation.ToLower().Contains(filter.Applicant.PreferredOccupation.ToLower()) ||
                     filter.Applicant.PreferredOccupation.ToLower().Contains(a.PreferredOccupation.ToLower())));

            if (!string.IsNullOrWhiteSpace(filter.Applicant.Industry))
                query = query.Where(a =>
                    !string.IsNullOrWhiteSpace(a.Industry) &&
                    a.Industry.ToLower() == filter.Applicant.Industry.ToLower());

            if (filter.Applicant.Skill.Count > 0)
                query = query.Where(a => 
                    a.Skills.Any(x => filter.Applicant.Skill.Any(s => s.ToLower() == x.Name.ToLower())));
        }
   
        return query;
    }

    public static IQueryable<Employer> WhereSatisfiesDiscoverFilter(
        this IQueryable<Employer> query,
        DiscoverFilter filter)
    {
        if (!string.IsNullOrWhiteSpace(filter.Location))
            query = query.Where(e =>
                !string.IsNullOrWhiteSpace(e.Location) &&
                (e.Location.ToLower().Contains(filter.Location.ToLower()) ||
                 filter.Location.ToLower().Contains(e.Location.ToLower())));

        if (filter.Employer is not null)
        {
            query = query.WhereSatisfiesFilter(filter.Employer);
            
            if (!string.IsNullOrWhiteSpace(filter.Employer.Industry))
                query = query.Where(e =>
                    !string.IsNullOrWhiteSpace(e.Industry) && 
                    e.Industry.ToLower() == filter.Employer.Industry.ToLower());
        }
   
        return query;
    }

    public static IQueryable<JobPost> WhereSatisfiesDiscoverFilter(this IQueryable<JobPost> query, DiscoverFilter filter)
    {
        if (filter.JobPost is not null)
            query = query.WhereSatisfiesFilter(filter.JobPost);
   
        if (!string.IsNullOrWhiteSpace(filter.Location))
        {
            query = query.Where(jp =>
                !string.IsNullOrWhiteSpace(jp.Employer.Location) && 
                (jp.Employer.Location.ToLower().Contains(filter.Location.ToLower()) ||
                 filter.Location.ToLower().Contains(jp.Employer.Location.ToLower())));
        }
   
        return query;
    }
    
    public static IQueryable<Applicant> WhereSatisfiesFilter(this IQueryable<Applicant> query, ApplicantFilter filter)
    {
        if (filter.IsReadyToWork is true)
            query = query.Where(a => a.ReadyToWork);
   
        if (filter.MinWorkExperienceYears is not null)
        {
            DateTime now = DateTime.UtcNow;
   
            query = query
                .Where(a => a.WorkExperience.Count > 0)
                .Select(a => new
                {
                    User = a,
                    Oldest = a.WorkExperience.OrderBy(e => e.StartYear).ThenBy(e => e.StartMonth).First(),
                    Latest = a.WorkExperience.OrderByDescending(e => e.EndYear).ThenByDescending(e => e.EndMonth).First()
                })
                .Select(x => new
                {
                    x.User,
                    YearsOfExperience = 
                        (x.Latest.EndYear ?? now.Year) - x.Oldest.StartYear - 
                        ((x.Oldest.StartMonth ?? 1) > (x.Latest.EndMonth ?? (x.Latest.EndYear == null ? now.Month : 12)) ? 1 : 0)
                })
                .Where(x => x.YearsOfExperience >= filter.MinWorkExperienceYears)
                .Select(x => x.User);
        }
   
        if (filter.MinEducationOrTrainingLevel is not null)
        {
            if (filter.MinEducationOrTrainingLevel == EducationOrTrainingLevel.CertificateOrLicense)
            {
                query = query.Where(a => a.CertificationsAndLicenses.Count > 0);
            }
            else
            {
                var degreeKeywords = Enum.GetValues<EducationOrTrainingLevel>()
                    .Where(l => l >= filter.MinEducationOrTrainingLevel)
                    .SelectMany(l => l is EducationOrTrainingLevel.Doctorate 
                        ? new List<string> { "doctor", "phd", "ph.d" } 
                        : new List<string> { l.ToString().ToLower() });

                query = query.Where(a =>
                    a.Education.Any(e =>
                        !string.IsNullOrWhiteSpace(e.Degree) && 
                        degreeKeywords.Any(k => e.Degree.ToLower().Contains(k))));
            }
        }
   
        return query;
    }

    public static IQueryable<Employer> WhereSatisfiesFilter(this IQueryable<Employer> query, EmployerFilter filter)
    {
        if (filter.MinSize is not null)
            query = query.Where(e => e.SizeRangeHighEnd >= filter.MinSize || e.SizeRangeLowEnd >= filter.MinSize);

        if (filter.MaxSize is not null)
            query = query.Where(e => e.SizeRangeLowEnd <= filter.MaxSize || e.SizeRangeHighEnd <= filter.MaxSize);
   
        if (filter.MinRating is not null)
            query = query.Where(e => e.AverageRating != null && e.AverageRating >= filter.MinRating);
   
        return query;
    }

    public static IQueryable<JobPost> WhereSatisfiesFilter(this IQueryable<JobPost> query,JobPostFilter filter)
    {
        if (filter.Before is not null)
            query = query.Where(jp => DateOnly.FromDateTime(jp.PostedAt) < filter.Before);
   
        if (filter.After is not null)
            query = query.Where(jp => DateOnly.FromDateTime(jp.PostedAt) > filter.After);
   
        if (filter.MinPay is not null && filter.MinPay > 0)
            query = query.Where(jp => jp.PayLowEnd >= filter.MinPay || jp.PayHighEnd >= filter.MinPay);
   
        if (filter is DiscoverJobPostFilter discoverFilter)
        {
            if (discoverFilter.Type is not null)
                query = query.Where(jp => jp.EmploymentType == discoverFilter.Type);

            if (discoverFilter.Medium is not null)
                query = query.Where(jp => jp.Medium != null && jp.Medium == discoverFilter.Medium);

            if (discoverFilter.SkillWanted.Count > 0)
                query = query.Where(jp =>
                    jp.Skills.Any(s => discoverFilter.SkillWanted.Any(x => x.ToLower() == s.Name.ToLower())));
        }
   
        return query;
    }
}