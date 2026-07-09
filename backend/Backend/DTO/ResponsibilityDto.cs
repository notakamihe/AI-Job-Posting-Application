using System.ComponentModel.DataAnnotations;

namespace Backend.DTO;

public class ResponsibilityDto
{
    public long Id { get; set; }
    [Required] [MaxLength(500)] public string Description { get; set; } = string.Empty;
}
