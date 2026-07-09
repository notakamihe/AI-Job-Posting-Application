using System.Text.Json.Serialization;

namespace Backend.DTO;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EntityQueryType
{
	Employer,
	Applicant,
	JobPost
}