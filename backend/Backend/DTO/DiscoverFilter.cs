namespace Backend.DTO;

public class DiscoverFilter
{
    public List<EntityQueryType> Type { get; set; } = [];
    public string? Location { get; set; }
    public DiscoverJobPostFilter? JobPost { get; set; }
    public DiscoverEmployerFilter? Employer { get; set; }
    public DiscoverApplicantFilter? Applicant { get; set; }
}
