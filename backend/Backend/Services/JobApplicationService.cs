using Backend.DTO;
using Backend.Exceptions;
using Backend.Models;
using Backend.Repositories;

namespace Backend.Services;

public class JobApplicationService : IJobApplicationService
{
    private readonly IUnitOfWork _unitOfWork;

    public JobApplicationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public Task<int> CountByJobPostAsync(JobPost post)
    {
        return _unitOfWork.JobApplications.CountByJobPost(post);
    }
    
    public Task<int> CountByUserAsync(User user)
    {
        return _unitOfWork.JobApplications.CountByUser(user);
    }

    public async Task<JobApplication> CreateAsync(Applicant applicant, JobPost post, JobApplicationRequest request)
    {
        var application = new JobApplication { Applicant = applicant, JobPost = post };
        applicant.JobApplications.Add(application);
        await SaveJobApplicationAnswersAsync(application, request);

        return application;
    }

    public async Task DeleteAsync(JobApplication application)
    {   
        application.Applicant.JobApplicationQuestionAnswers.RemoveAll(a => 
            a.JobApplicationQuestion.JobPostId == application.JobPost.Id);
        application.Applicant.JobApplications.Remove(application);
        
        await _unitOfWork.CompleteAsync();
    }

    public async Task<List<JobApplication>> GetByJobPostAsync(JobPost post, bool publicOnly = false)
    {
        var applications = await _unitOfWork.JobApplications.GetByJobPost(post, publicOnly);
        applications.Reverse();
        return applications;
    }

    public async Task<List<JobApplication>> GetByUserAsync(User user, bool publicOnly = false)
    {
        if (user is not Applicant && user is not Employer)
            throw new InvalidUserException("Cannot retrieve applications for user.");
        
        var applications = await _unitOfWork.JobApplications.GetByUser(user, publicOnly);
        applications.Reverse();
        return applications;
    }

    private async Task SaveJobApplicationAnswersAsync(JobApplication application, JobApplicationRequest request)
    {
        foreach (var question in application.JobPost.JobApplicationQuestions)
        {
            if (request.Answers.All(a => a.QuestionId != question.Id))
            {
                if (question.IsRequired)
                    throw new ValidationException(
                        new Dictionary<string, string[]>
                        {
                            { "Answers", [$"Question with ID of {question.Id} must have an answer."] }
                        });
                
                var answer = application.Applicant.JobApplicationQuestionAnswers.Find(a => 
                    a.JobApplicationQuestionId == question.Id);
                
                if (answer is not null)
                    application.Applicant.JobApplicationQuestionAnswers.Remove(answer);
            }
        }

        for (int i = 0; i < request.Answers.Count; i++)
        {
            var requestAnswer = request.Answers[i];
            var question = application.JobPost.JobApplicationQuestions.Find(q => q.Id == requestAnswer.QuestionId);

            if (question == null)
                throw new DoesNotExistException(
                    $"Question with ID of {requestAnswer.QuestionId} not found for this job post.");

            switch (question.Type)
            {
                case JobApplicationQuestionType.Binary:
                    if (requestAnswer.Answer.ToLower() != "yes" && requestAnswer.Answer.ToLower() != "no")
                        throw new ValidationException(
                            new Dictionary<string, string[]>
                            {
                                { $"Answers[{i}].Answer", ["Answer must be either 'yes' or 'no' for binary question."] }
                            });
                    break;
                case JobApplicationQuestionType.Number:
                    if (!double.TryParse(requestAnswer.Answer, out _))
                        throw new ValidationException(
                            new Dictionary<string, string[]>
                            {
                                { $"Answers[{i}].Answer", ["Answer must be numeric for question of type number."] }
                            }); 
                    break;
            }

            var answer = application.Applicant.JobApplicationQuestionAnswers.Find(a => 
                a.JobApplicationQuestion.Id == question.Id);

            if (answer is null)
            {
                answer = new JobApplicationQuestionAnswer
                {
                    JobApplicationQuestion = question,
                    Applicant = application.Applicant,
                    Answer = requestAnswer.Answer
                };
                
                application.Applicant.JobApplicationQuestionAnswers.Add(answer);
            }
            else
            {
                answer.Answer = requestAnswer.Answer;
            }
        }
        
        await _unitOfWork.CompleteAsync();
    }

    public Task UpdateAsync(JobApplication application, JobApplicationRequest request)
    {
        return SaveJobApplicationAnswersAsync(application, request);
    }
}
