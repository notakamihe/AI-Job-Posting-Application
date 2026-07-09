namespace Backend.DTO;

public class SkillFilter
{
    public string? Contains { get; set; }
    public string[]? Exclude { get; set; }
    public int? Limit { get; set; }
}
