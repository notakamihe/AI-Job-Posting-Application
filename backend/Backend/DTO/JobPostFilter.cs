using System.ComponentModel;
using Backend.Models;

namespace Backend.DTO;

public class JobPostFilter
{
    [Description(
        """
        Examples:
        - What jobs were posted on January 1, 2025? -> 12/31/2024
        - What jobs were posted on January 1 (if today is March 14, 2026)? -> 12/31/2025
        - What jobs were posted on Christmas Day 2024? -> 12/24/2024
        - What jobs were posted on Christmas Day (if today is March 14, 2026)? -> 12/24/2025
        - What jobs were posted yesterday (if today is March 14, 2026) -> 3/12/2026
        - What jobs were posted three days ago (if today is March 14, 2026 and three days ago was March 11) -> 3/10/2026
        - What jobs were posted in September 2024? -> 8/31/2024
        - What jobs were posted in September (if today is March 14, 2026)? -> 8/31/2025
        - What jobs were posted this month (if today is March 14, 2026)? -> 2/28/2026
        - What jobs were posted last month (if today is March 14, 2026)? -> 1/31/2026
        - What jobs were posted last year (if today is March 14, 2026)? -> 12/31/2024
        - What jobs were posted this past week (if today is March 14, 2026)? -> 3/7/2026
        - What jobs were posted between January 1, 2025 and January 12, 2025? -> 12/31/2024
        - What jobs were posted between January 1 and January 12 (if today is March 14, 2026)? -> 12/31/2025
        """)]
    public DateOnly? After { get; set; }

    [Description(
        """
        Examples:
        - What jobs were posted on January 1, 2025? -> 1/2/2025
        - What jobs were posted on January 1 (if today is March 14, 2026)? -> 1/2/2026 
        - What jobs were posted on Christmas Day 2024? -> 12/26/2024
        - What jobs were posted on Christmas Day (if today is March 14, 2026)? -> 12/26/2025
        - What jobs were posted yesterday (today is March 14, 2026) -> 3/14/2026
        - What jobs were posted three days ago (if today is March 14, 2026 and three days ago was March 11) -> 3/12/2026
        - What jobs were posted in September 2024? -> 10/1/2024
        - What jobs were posted in September (if today is March 14, 2026)? -> 10/1/2025
        - What jobs were posted this month (if today is March 14, 2026)? -> 4/1/2026
        - What jobs were posted last month (if today is March 14, 2026)? -> 3/1/2026
        - What jobs were posted last year (if today is March 14, 2026)? -> 1/1/2026
        - What jobs were posted this past week (if today is March 14, 2026)? -> 3/15/2026
        - What jobs were posted between January 1, 2025 and January 12, 2025? -> 1/13/2025
        - What jobs were posted between January 1 and January 12 (if today is March 14, 2026)? -> 1/13/2026
        """)]
    public DateOnly? Before { get; set; }

    [Description(
        """
        Minimum hourly pay in USD. 
        Set this when the user requests high-paying, well-paying, top-paying, lucrative, highest-paid, or better-paying jobs. 
        Infer a reasonable threshold if no amount is specified.
        """)]
    public decimal? MinPay { get; set; }
}

public class DiscoverJobPostFilter : JobPostFilter
{
    public EmploymentType? Type { get; set; }
    public EmploymentMedium? Medium { get; set; }
    public List<string> SkillWanted { get; set; } = [];
}
