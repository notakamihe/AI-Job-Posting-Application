using System.ComponentModel.DataAnnotations;
using EntityFrameworkCore.Projectables;

namespace Backend.Models;

public class Employer : User
{
    [Required] [MaxLength(250)] public string Name { get; set; } = string.Empty;
    [MaxLength(2048)] public string? Website { get; set; }
    public string? About { get; set; }
    public int? SizeRangeLowEnd { get; set; }
    public int? SizeRangeHighEnd { get; set; }
    public List<JobPost> JobPosts { get; set; } = [];
    public List<Review> Reviews { get; set; } = [];
    public List<Applicant> Followers { get; set; } = [];

    [Projectable] public double? AverageRating => Reviews.Any() ? Reviews.Average(r => r.Rating) : null;
}
