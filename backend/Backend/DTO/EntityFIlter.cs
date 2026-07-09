using System.ComponentModel;

namespace Backend.DTO;
public class EntityFilter
{
    public List<EntityQueryType> Types { get; set; } = [];
    
    [Description(
        """
        Must be null unless a point in time or the job's pay is EXPLICITLY mentioned.
        If the query asks for jobs but no time range is mentioned, DO NOT populate the before and after dates AT ALL. 
        
        To determine the correct date range for, first you must determine whether the query refers to a single day or range of multiple days.
        
        Examples:
        - What jobs were posted on January 1? -> Single day
        - What jobs were posted yesterday? -> Single day
        - What jobs were posted seven days ago? -> Single day
        - What jobs were posted on Christmas? -> Single day
        - What jobs were posted in March? -> Multiple days
        - What jobs were posted last year? -> Multiple days 
        - What jobs were posted this past week? -> Multiple days
        - What jobs were posted between January 1 and January 7? -> Multiple days
        
        The date range is inclusive, meaning both the before and after dates are included.
        If it is a single day, the before and after dates should be the same.
        
        Otherwise, here are some examples for determining the correct dates for multiple-day ranges:
        - What jobs were posted in March 2025? -> After date is March 1, 2025 and before date is March 31, 2025.
        - What jobs were posted last year? -> If the year is 2025, the after date is January 1, 2024 and before date is December 31, 2024.
        - What jobs were posted this past week? -> If the past week was January 1-7, 2025, the after date is January 1, 2025 and before date is January 7, 2025
        
        If the query explicitly asks for a period of time before a certain date/month/year, the before date should be the day prior. For example:
        - What jobs were posted before August 2025? -> After date is null and before date is July 31, 2025.
        
        If the query explicitly asks for a period of time before a certain date/month/year, the after date should be the following day. For example
        - What jobs were posted after July 4, 2025? -> After date is July 5, 2025 and before date is null.
        """)]
    public JobPostFilter? JobPost { get; set; }
    
    [Description(
        """
        Only set the size range low and high end filters if size of a company/employer is EXPLICITLY mentioned.
        
        Valid low and high value pairs are (respectively):
        - null and 10
        - 10 and 49
        - 50 and 99 (small)
        - 100 and 249
        - 250 and 499 (medium)
        - 500 and 999
        - 1000 and 9999 (large)
        - 10000 and null
        
        Only set the quality/rating of the employer is EXPLICITLY mentioned.
        """)]
    public EmployerFilter? Employer { get; set; }
    
    [Description("Must be null unless experience, level of education, or whether applicants are ready to work are EXPLICITLY mentioned.")]
    public ApplicantFilter? Applicant { get; set; }
}