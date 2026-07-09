using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

[Table("CertificationsAndLicenses")]
public class CertificateOrLicense
{
	public long Id { get; set; }
	public string ApplicantId { get; set; } = string.Empty;
	public Applicant Applicant { get; set; } = null!;
	[Required] [MaxLength(200)] public string Name { get; set; } = string.Empty;
	[Required] [MaxLength(200)] public string Issuer { get; set; } = string.Empty;
	public int? IssuedMonth { get; set; }
	public int IssuedYear { get; set; }
	public int? ExpirationMonth { get; set; }
	public int? ExpirationYear { get; set; }
	public string? Description { get; set; }
}
