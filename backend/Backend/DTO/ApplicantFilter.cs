using System.ComponentModel;

namespace Backend.DTO;

public class ApplicantFilter
{
    public bool? IsReadyToWork { get; set; }
    public EducationOrTrainingLevel? MinEducationOrTrainingLevel { get; set; }

    [Description(
        """
        If the query mentions experience and no amount is specified, infer a reasonable threshold.
        If the query mentions people with a certain level of experience (e.g. 'I want experts.'), infer a reasonable threshold.
        """)]
    public int? MinWorkExperienceYears { get; set; }
}

public class DiscoverApplicantFilter : ApplicantFilter
{
    public string? PreferredOccupation { get; set; }
    public string? Industry { get; set; }
    public List<string> Skill { get; set; } = [];
}

public enum EducationOrTrainingLevel
{
    CertificateOrLicense,
    Associate,
    Bachelor,
    Master,
    Doctorate
}