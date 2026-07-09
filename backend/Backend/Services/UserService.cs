using Backend.DTO;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Backend.Exceptions;
using Backend.Repositories;

namespace Backend.Services;

public class UserService : IUserService
{
    private readonly IAiService _aiService;
    private readonly ISkillService _skillService;
    private readonly UserManager<User> _userManager;
    private readonly IUnitOfWork _unitOfWork;

    public UserService(
        IAiService aiService,
        ISkillService skillService,
        UserManager<User> userManager, 
        IUnitOfWork unitOfWork)
    {
        _aiService = aiService;
        _skillService = skillService;
        _userManager = userManager;
        _unitOfWork = unitOfWork;
    }

    public async Task<User> CreateAsync(RegisterRequest request)
    {
        User user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Location = request.Location,
            Industry = request.Industry,
        };
    
        if (request is RegisterApplicantRequest applicantRequest)
        {
            user = new Applicant
            {
                UserName = user.Email,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Location = user.Location,
                Industry = user.Industry,
                FirstName = applicantRequest.FirstName,
                MiddleName = applicantRequest.MiddleName,
                LastName = applicantRequest.LastName,
                Link1 = applicantRequest.Link1,
                Link2 = applicantRequest.Link2,
                IsPrivate = applicantRequest.IsPrivate,
                ReadyToWork = applicantRequest.ReadyToWork,
                PreferredOccupation = applicantRequest.PreferredOccupation
            };
        }
        else if (request is RegisterEmployerRequest employerRequest)
        {
            user = new Employer
            {
                UserName = user.Email,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Location = user.Location,
                Industry = user.Industry,
                Name = employerRequest.Name,
                Website = employerRequest.Website,
                About = employerRequest.About,
                SizeRangeLowEnd = employerRequest.SizeRangeLowEnd,
                SizeRangeHighEnd = employerRequest.SizeRangeHighEnd
            };
        }
        
        user.Embedding = await _aiService.GenerateVectorAsync(user);
        
        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
            throw new AccountActionFailureException(result.Errors);

        return user;
    }

    public Task<int> CountFollowersByEmployerAsync(Employer employer)
    {
        return _unitOfWork.Applicants.CountByFollowedEmployerAsync(employer);
    }

    public Task<int> CountReviewsByUserAsync(User user)
    {
        return _unitOfWork.Reviews.CountByUserAsync(user);
    }
    
    public async Task DeleteAsync(User user)
    {
        if (await _userManager.IsInRoleAsync(user, "Admin"))
            throw new InvalidUserException("Admin cannot be deleted.");
    
        _unitOfWork.Users.Remove(user);
        await _unitOfWork.CompleteAsync();
    }

    public async Task FollowAsync(Applicant applicant, Employer employer)
    {
        if (applicant.Following.All(f => f.Id != employer.Id))
        {
            applicant.Following.Add(employer);
            await _unitOfWork.CompleteAsync();
        }
    }
    
    public Task<Applicant?> GetApplicantByIdAsync(string id)
    {
        return _unitOfWork.Applicants.GetByIdAsync(id);
    }
    
    public async Task<List<User>> GetAsync(UserType? type, List<string> ids)
    {
        var users = await _unitOfWork.Users.GetAsync(type, ids);
        return users.OrderBy(u => ids.IndexOf(u.Id)).ToList();
    }
    
    public Task<User?> GetByEmailAsync(string email, bool includeChatbot = false)
    {
        return _unitOfWork.Users.GetByEmailAsync(_userManager.NormalizeEmail(email), includeChatbot);
    }
    
    public Task<User?> GetByIdAsync(string id, string? role = null, bool includeChatbot = false)
    {
        return _unitOfWork.Users.GetByIdAsync(id, role, includeChatbot);
    }
    
    public async Task<List<User>> GetByIdsAsync(List<string> ids, string? role = null, bool includeChatbot = false)
    {
        var users = await _unitOfWork.Users.GetByIdsAsync(ids, role, includeChatbot);
        return users.OrderBy(u => ids.IndexOf(u.Id)).ToList();
    }
    
    public Task<User?> GetByRefreshTokenAsync(string refreshToken)
    {
        return _unitOfWork.Users.GetByRefreshTokenAsync(refreshToken);
    }

    public Task<Employer?> GetEmployerByIdAsync(string id)
    {
        return _unitOfWork.Employers.GetByIdAsync(id);
    }
    
    public Task<List<Applicant>> GetFollowersByEmployerAsync(Employer employer)
    {
        return _unitOfWork.Applicants.GetByFollowedEmployerAsync(employer);
    }

    public Task<List<Applicant>> GetPublicFollowersByEmployerAsync(Employer employer, string? userId)
    {
        return _unitOfWork.Applicants.GetPublicByFollowedEmployerAsync(employer, userId);
    }

    public async Task<List<User>> GetPublicOrByUserAsync(string? userId, UserType? type, List<string> ids)
    {
        var users = await _unitOfWork.Users.GetPublicOrByUserAsync(userId, type, ids);
        return users.OrderBy(u => ids.IndexOf(u.Id)).ToList();
    }

    public async Task SaveJobPostAsync(Applicant applicant, JobPost post)
    {
        if (applicant.Saved.All(s => s.Id != post.Id))
        {
            applicant.Saved.Add(post);
            await _unitOfWork.CompleteAsync();
        }
    }

    public async Task UnfollowAsync(Applicant applicant, Employer employer)
    {
        applicant.Following.RemoveAll(f => f.Id == employer.Id);
        await _unitOfWork.CompleteAsync();
    }

    public async Task UnsaveJobPostAsync(Applicant applicant, JobPost post)
    {
        applicant.Saved.RemoveAll(s => s.Id == post.Id);
        await _unitOfWork.CompleteAsync();
    }

    public async Task UpdateEmailAsync(User user, string email)
    {
        if (await _userManager.IsInRoleAsync(user, "Admin"))
            throw new InvalidUserException("Admin email cannot be updated.");

        if (user.Email != email)
        {
            await using var transaction = await _unitOfWork.StartTransactionAsync();

            try
            {
                var result = await _userManager.SetEmailAsync(user, email);

                if (!result.Succeeded)
                    throw new AccountActionFailureException(result.Errors);

                result = await _userManager.SetUserNameAsync(user, email);

                if (!result.Succeeded)
                    throw new AccountActionFailureException(result.Errors);

                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }

    public async Task UpdatePhoneNumberAsync(User user, string phoneNumber)
    {
        if (await _userManager.IsInRoleAsync(user, "Admin"))
            throw new InvalidUserException("Admin phone number cannot be updated.");

        if (user.PhoneNumber != phoneNumber)
        {
            var result = await _userManager.SetPhoneNumberAsync(user, phoneNumber);

            if (!result.Succeeded)
                throw new AccountActionFailureException(result.Errors);
        }
    }

    public async Task UpdateProfileAsync(User user, UpdateProfileBase request)
    {
        user.Location = request.Location;
        user.Industry = request.Industry;

        if (user is Applicant applicant)
        {
            if (request is UpdateApplicantProfileRequest applicantRequest)
            {
                applicant.FirstName = applicantRequest.FirstName;
                applicant.MiddleName = applicantRequest.MiddleName;
                applicant.LastName = applicantRequest.LastName;
                applicant.Link1 = applicantRequest.Link1;
                applicant.Link2 = applicantRequest.Link2;
                applicant.PreferredOccupation = applicantRequest.PreferredOccupation;
                applicant.IsPrivate = applicantRequest.IsPrivate;
                applicant.ReadyToWork = applicantRequest.ReadyToWork;
                applicant.About = applicantRequest.About;

                List<WorkExperienceEntry> newWorkExperienceEntries = [];

                foreach (var requestEntry in applicantRequest.WorkExperience)
                {
                    var entry = applicant.WorkExperience.Find(we => we.Id == requestEntry.Id);

                    if (entry is null)
                    {
                        entry = new WorkExperienceEntry { Applicant = applicant };
                        newWorkExperienceEntries.Add(entry);
                    }

                    entry.Employer = requestEntry.Employer;
                    entry.Position = requestEntry.Position;
                    entry.StartMonth = requestEntry.StartMonth;
                    entry.StartYear = (int)requestEntry.StartYear!;
                    entry.EndMonth = requestEntry.EndMonth;
                    entry.EndYear = requestEntry.EndYear;
                    entry.Description = requestEntry.Description;
                }

                applicant.WorkExperience.RemoveAll(we => applicantRequest.WorkExperience.All(x => x.Id != we.Id));
                applicant.WorkExperience.AddRange(newWorkExperienceEntries);

                List<EducationEntry> newEducationEntries = [];

                foreach (var requestEntry in applicantRequest.Education)
                {
                    var entry = applicant.Education.Find(e => e.Id == requestEntry.Id);

                    if (entry is null)
                    {
                        entry = new EducationEntry { Applicant = applicant };
                        newEducationEntries.Add(entry);
                    }

                    entry.Institution = requestEntry.Institution;
                    entry.InstitutionLocation = requestEntry.InstitutionLocation;
                    entry.Major = requestEntry.Major;
                    entry.StartMonth = requestEntry.StartMonth;
                    entry.StartYear = (int)requestEntry.StartYear!;
                    entry.EndMonth = requestEntry.EndMonth;
                    entry.EndYear = requestEntry.EndYear;
                    entry.Degree = requestEntry.Degree;
                }

                applicant.Education.RemoveAll(e => applicantRequest.Education.All(x => x.Id != e.Id));
                applicant.Education.AddRange(newEducationEntries);

                List<CertificateOrLicense> newCertificationsAndLicenses = [];

                foreach (var requestCertificateOrLicense in applicantRequest.CertificationsAndLicenses)
                {
                    var certificateOrLicense = applicant.CertificationsAndLicenses.Find(cl =>
                        cl.Id == requestCertificateOrLicense.Id);

                    if (certificateOrLicense is null)
                    {
                        certificateOrLicense = new CertificateOrLicense { Applicant = applicant };
                        newCertificationsAndLicenses.Add(certificateOrLicense);
                    }

                    certificateOrLicense.Name = requestCertificateOrLicense.Name;
                    certificateOrLicense.Issuer = requestCertificateOrLicense.Issuer;
                    certificateOrLicense.IssuedMonth = requestCertificateOrLicense.IssuedMonth;
                    certificateOrLicense.IssuedYear = (int)requestCertificateOrLicense.IssuedYear!;
                    certificateOrLicense.ExpirationMonth = requestCertificateOrLicense.ExpirationMonth;
                    certificateOrLicense.ExpirationYear = requestCertificateOrLicense.ExpirationYear;
                    certificateOrLicense.Description = requestCertificateOrLicense.Description;
                }

                applicant.CertificationsAndLicenses.RemoveAll(cl =>
                    applicantRequest.CertificationsAndLicenses.All(x => x.Id != cl.Id));
                applicant.CertificationsAndLicenses.AddRange(newCertificationsAndLicenses);

                List<Skill> newSkills = [];

                foreach (var requestSkill in applicantRequest.Skills)
                {
                    Skill? skill;

                    if (requestSkill.Id is long id)
                    {
                        skill = await _skillService.GetByIdAsync(id);

                        if (skill is null)
                            throw new DoesNotExistException($"Skill with ID {id} does not exist.");
                    }
                    else
                    {
                        var existing = await _skillService.GetByNameAsync(requestSkill.Name!);

                        if (existing is not null)
                            throw new AlreadyExistsException(
                                $"Skill named '{existing.Name}' already exists with the ID of {existing.Id}.");

                        skill = new Skill { Name = requestSkill.Name! };
                    }

                    if (applicant.Skills.All(s => s.Id != skill.Id))
                        newSkills.Add(skill);
                }

                applicant.Skills.RemoveAll(s => applicantRequest.Skills.All(x => x.Id != s.Id));
                applicant.Skills.AddRange(newSkills);
            }
            else
            {
                throw new ValidationException(
                    new Dictionary<string, string[]>
                    {
                        { "type", ["Must specify applicant type and data for applicant."] }
                    });
            }
        }
        else if (user is Employer employer)
        {
            if (request is UpdateEmployerProfileRequest employerRequest)
            {
                employer.Name = employerRequest.Name;
                employer.Website = employerRequest.Website;
                employer.About = employerRequest.About;
                employer.SizeRangeLowEnd = employerRequest.SizeRangeLowEnd;
                employer.SizeRangeHighEnd = employerRequest.SizeRangeHighEnd;

                foreach (JobPost post in employer.JobPosts)
                    post.Embedding = await _aiService.GenerateVectorAsync(post);
            }
            else
            {
                throw new ValidationException(
                    new Dictionary<string, string[]>
                    {
                        { "type", ["Must specify employer type and data for employer."] }
                    });
            }
        }
        else
        {
            throw new InvalidUserException("Invalid user for updating profile.");
        }

        user.Embedding = await _aiService.GenerateVectorAsync(user);

        await _unitOfWork.CompleteAsync();
    }
}