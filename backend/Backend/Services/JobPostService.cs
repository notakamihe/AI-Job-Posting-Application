using Backend.DTO;
using Backend.Exceptions;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services;

public class JobPostService : IJobPostService
{
    private readonly IAiService _aiService;
    private readonly IEntityQueryRepository _entityQueryRepository;
    private readonly ISkillService _skillService;
    private readonly IUserService _userService;
    private readonly IUnitOfWork _unitOfWork;
    
    public JobPostService(
        IAiService aiService,
        IEntityQueryRepository entityQueryRepository,
        ISkillService skillService, 
        IUserService userService, 
        IUnitOfWork unitOfWork)
    {
        _aiService = aiService;
        _entityQueryRepository = entityQueryRepository;
        _skillService = skillService;
        _userService = userService;
        _unitOfWork = unitOfWork;
    }

    public async Task<JobPost> CreateAsync(CreateJobPostRequest request)
    {
        var employer = await _userService.GetEmployerByIdAsync(request.EmployerId ?? "");
        
        if (employer is null)
            throw new DoesNotExistException($"Employer with ID of {request.EmployerId} not found.");
                
        var post = new JobPost { Employer = employer };
        _unitOfWork.JobPosts.Add(post);

        return await SaveAsync(post, request);
    }

    public async Task DeleteAsync(JobPost post)
    {
        _unitOfWork.JobPosts.Remove(post);
        await _unitOfWork.CompleteAsync();
    }

    public async Task<List<JobPost>> GetAllAsync()
    {
        return await _unitOfWork.JobPosts.GetAllAsync();
    }
    
    public async Task<JobPost?> GetByIdAsync(long id)
    {
        return await _unitOfWork.JobPosts.GetByIdAsync(id);
    }

    public async Task<List<JobPost>> GetSimilarAsync(JobPost post)
    {
        var queryVector = await _aiService.GenerateVectorAsync(post);
        var filter = new EntityFilter { Types = [EntityQueryType.JobPost] };
        var posts = await _entityQueryRepository.GetRelevantEntitiesAsync(queryVector, filter, top: 6);

        return posts.Select(p => (JobPost)p).Where(p => p.Id != post.Id).ToList();
    }

    private async Task<JobPost> SaveAsync(JobPost post, JobPostRequest request)
    {
        post.Title = request.Title;
        post.Summary = request.Summary;
        post.PayLowEnd = request.PayLowEnd;
        post.PayHighEnd = request.PayHighEnd;
        post.Medium = request.Medium;
        post.EmploymentType = request.EmploymentType ?? EmploymentType.FullTime;
        post.Schedule = request.Schedule;
        post.AdditionalDetails = request.AdditionalDetails;

        List<Skill> newSkills = [];

        foreach (var skillWanted in request.SkillsWanted)
        {
            Skill? skill;

            if (skillWanted.Id is long id)
            {
                skill = await _skillService.GetByIdAsync(id);

                if (skill is null)
                    throw new DoesNotExistException($"Skill with ID {id} does not exist.");
            }
            else 
            {
                var existing = await _skillService.GetByNameAsync(skillWanted.Name!);

                if (existing is not null)
                    throw new AlreadyExistsException(
                        $"Skill named '{existing.Name}' already exists with the ID of {existing.Id}.");

                skill = new Skill { Name = skillWanted.Name! };
            }

            if (post.Skills.All(s => s.Id != skill.Id))
                newSkills.Add(skill);
        }

        post.Skills.RemoveAll(s => request.SkillsWanted.All(x => x.Id != s.Id));
        post.Skills.AddRange(newSkills);

        List<Qualification> newQualifications = [];

        foreach (var requestQualification in request.Qualifications)
        {
            var qualification = post.Qualifications.Find(q => q.Id == requestQualification.Id);

            if (qualification is null)
            {
                qualification = new Qualification { JobPost = post };
                newQualifications.Add(qualification);
            }

            qualification.Description = requestQualification.Description;
        }
        
        post.Qualifications.RemoveAll(q => request.Qualifications.All(x => x.Id != q.Id));
        post.Qualifications.AddRange(newQualifications);

        List<Responsibility> newResponsibilities = [];

        foreach (var requestResponsibility in request.Responsibilities)
        {
            var responsibility = post.Responsibilities.Find(r => r.Id == requestResponsibility.Id);

            if (responsibility is null)
            {
                responsibility = new Responsibility { JobPost = post };
                newResponsibilities.Add(responsibility);
            }

            responsibility.Description = requestResponsibility.Description;
        }

        post.Responsibilities.RemoveAll(r => request.Responsibilities.All(x => x.Id != r.Id));
        post.Responsibilities.AddRange(newResponsibilities);

        List<JobApplicationQuestion> newQuestions = [];

        foreach (var requestQuestion in request.ApplicationQuestions)
        {
            var question = post.JobApplicationQuestions.Find(q => q.Id == requestQuestion.Id);

            if (question is null)
            {
                question = new JobApplicationQuestion { JobPost = post };
                newQuestions.Add(question);
            }

            question.Question = requestQuestion.Question;
            question.IsRequired = requestQuestion.IsRequired;

            JobApplicationQuestionType type = requestQuestion.Type ?? JobApplicationQuestionType.Text;

            if (question.Type != type)
            {
                switch (type)
                {
                    case JobApplicationQuestionType.Number:
                        question.JobApplicationQuestionAnswers.RemoveAll(a => !double.TryParse(a.Answer, out _));
                        break;
                    case JobApplicationQuestionType.Binary:
                        question.JobApplicationQuestionAnswers.RemoveAll(a => 
                            a.Answer.ToLower() != "yes" && a.Answer.ToLower() != "no");
                        break; 
                }

                question.Type = type;
            }
        }

        post.JobApplicationQuestions.RemoveAll(q => request.ApplicationQuestions.All(x => x.Id != q.Id));
        post.JobApplicationQuestions.AddRange(newQuestions);
        
        post.Embedding = await _aiService.GenerateVectorAsync(post);

        await _unitOfWork.CompleteAsync();
        return post;
    }

    public async Task UpdateAsync(JobPost post, JobPostRequest request)
    {
        await SaveAsync(post, request);
    }
}