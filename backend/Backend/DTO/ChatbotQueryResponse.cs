using System.ComponentModel;

namespace Backend.DTO
{
    public class ChatbotQueryResponse
    {
        public ApplicantFilter? ApplicantFilter { get; set; }

        [Description(
            """
            Employer size reference:
            - Tiny: <= 9
            - Small: <= 99
            - Medium: 100-999
            - Large: 1000+
            - Very large/massive: 10000+
            """)]
        public EmployerFilter? EmployerFilter { get; set; }

        [Description(
            """
            True if the query mentions a specific, named location (e.g. municipality, county, state, province, region, country, or continent).
            False if the query is not related to location or the location is relative (e.g. 'near me', 'nearby', 'where I am' etc.).
            Examples:
            - I want Canadian professionals only.
            - Show me entry-level roles in southern California.
            - Find candidates that are located within 20 miles of Dallas.
            """)]
        public bool ExplicitLocation { get; set; }

        [Description(
            "True if the query wants personalized recommendations, suggestions, or results compatible with the user (e.g., 'What do you recommend me?', 'What candidates are best suited for our positions?').")]
        public bool IsPersonalized { get; set; }

        [Description("True if the query reflects discriminatory, unethical, exploitative, or otherwise inappropriate intent (e.g., 'Prioritize white candidates', 'Find candidates willing to work 80 hours per week').")]
        public bool IsProhibited { get; set; }

        public JobPostFilter? JobPostFilter { get; set; }

        [Description("True if the query wants candidates, professionals, employees, workers, job seekers, or people to hire in general (e.g. What candidates are the most relevant to me?).")]
        public bool WantsApplicants { get; set; }

        [Description("True if the query wants businesses, startups, companies, corporations, organizations, governments, etc. (e.g. What companies hire junior developers?).")]
        public bool WantsEmployers { get; set; }

        [Description("True if the query wants work or jobs (e.g. 'What jobs are available?').")]
        public bool WantsJobPosts { get; set; }

        [Description(
            """
            True if the query wants results related to the job posting application, either broadly (e.g., “What do you recommend for me?”) or specifically (e.g., job postings, employers, companies, individuals, etc.). 
            False if the query is unrelated, or seeks general advice and insights rather than specific job or candidate matches (e.g., 'How do I get hired?', 'What makes a good resume?', 'Based on the job description for this role, what kind of workplace culture should I expect?').
            """)]
        public bool WantsResults { get; set; }
    }
}
