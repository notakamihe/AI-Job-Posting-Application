using Backend.Models;
using System.Text;

namespace Backend.Extensions
{
    public static class EmbeddingExtensions
    {
        public static string ToEmbeddingInputString(this JobPost post, bool asListItem = false)
        {
            var stringBuilder = new StringBuilder();
            var indent = asListItem ? "    " : "";

            if (!asListItem)
                stringBuilder.AppendLine("Item Type: Job Post");

            stringBuilder.AppendLine(
                $"""
                {(asListItem ? "  - " : "Title: ")}{post.Title}
                {indent}Summary: {post.Summary.Replace("\r", " ").Replace("\n", " ")}
                {indent}Posted At: {post.PostedAt}
                """);

            if (!asListItem)
            {
                var website = !string.IsNullOrEmpty(post.Employer.Website) ? $" ({post.Employer.Website})" : "";
                var industry = !string.IsNullOrEmpty(post.Employer.Industry) ? ", " + post.Employer.Industry : "";
                var about = post.Employer.About?.Replace("\r", " ").Replace("\n", " ");
                var size = "";

                if (post.Employer.SizeRangeLowEnd is not null && post.Employer.SizeRangeHighEnd is not null)
                    size = $", {post.Employer.SizeRangeLowEnd} to {post.Employer.SizeRangeHighEnd} employees";
                else if (post.Employer.SizeRangeLowEnd is not null)
                    size = $", {post.Employer.SizeRangeLowEnd}+ employees";
                else if (post.Employer.SizeRangeHighEnd is not null)
                    size = $", Up to {post.Employer.SizeRangeHighEnd} employees";

                stringBuilder.AppendLine($"Posted By {post.Employer.Name}{website}{industry}{size}. {about}");
            }

            stringBuilder.AppendLine(
                $"""
                {indent}Schedule: {post.Schedule.Replace("\r", " ").Replace("\n", " ")}
                {indent}Type: {post.EmploymentType}
                """);

            if (post.Medium != null)
                stringBuilder.AppendLine($"{indent}Medium: {post.Medium}");

            if (post.PayLowEnd is not null && post.PayHighEnd is not null)
                stringBuilder.AppendLine($"{indent}Pay: ${post.PayLowEnd} to ${post.PayHighEnd}");
            else if (post.PayLowEnd is not null)
                stringBuilder.AppendLine($"{indent}Pay: ${post.PayLowEnd}+");
            else if (post.PayHighEnd is not null)
                stringBuilder.AppendLine($"{indent}Pay: Up to ${post.PayHighEnd}");

            if (post.Skills.Count > 0)
                stringBuilder.AppendLine($"{indent}Skills: {string.Join(", ", post.Skills.Select(s => s.Name))}");

            if (post.Qualifications.Count > 0)
            {
                stringBuilder.AppendLine($"{indent}Qualifications: ");

                foreach (var qualification in post.Qualifications)
                    stringBuilder.AppendLine($"{indent}- {qualification.Description}");
            }

            if (post.Responsibilities.Count > 0)
            {
                stringBuilder.AppendLine($"{indent}Responsibilities: ");

                foreach (var responsibility in post.Responsibilities)
                    stringBuilder.AppendLine($"{indent}- {responsibility.Description}");
            }

            if (!string.IsNullOrEmpty(post.AdditionalDetails))
                stringBuilder.AppendLine(
                    $"{indent}Additional Details: {post.AdditionalDetails.Replace("\r", " ").Replace("\n", " ")}");

            if (!asListItem && !string.IsNullOrEmpty(post.Employer.Location))
                stringBuilder.AppendLine($"Location: {post.Employer.Location}");

            return stringBuilder.ToString();
        }

        public static string ToEmbeddingInputString(this User user)
        {
            var stringBuilder = new StringBuilder();

            if (user is Employer)
            {
                var employer = (Employer)user;
                
                stringBuilder.AppendLine($"Name: {employer.Name}");
                stringBuilder.AppendLine("Item Type: Employer");

                if (!string.IsNullOrEmpty(employer.About))
                    stringBuilder.AppendLine($"About: {employer.About.Replace("\r", " ").Replace("\n", " ")}");

                if (!string.IsNullOrEmpty(employer.Website))
                    stringBuilder.AppendLine($"Website: {employer.Website}");

                if (employer.SizeRangeLowEnd is not null && employer.SizeRangeHighEnd is not null)
                    stringBuilder.AppendLine(
                        $"Size: {employer.SizeRangeLowEnd} to {employer.SizeRangeHighEnd} employees");
                else if (employer.SizeRangeLowEnd is not null)
                    stringBuilder.AppendLine($"Size: {employer.SizeRangeLowEnd}+ employees");
                else if (employer.SizeRangeHighEnd is not null)
                    stringBuilder.AppendLine($"Size: Up to {employer.SizeRangeHighEnd} employees");
            }
            else if (user is Applicant)
            {
                var applicant = (Applicant)user;

                stringBuilder.AppendLine($"Name: {applicant.FirstName} {applicant.MiddleName} {applicant.LastName}");
                stringBuilder.AppendLine("Item Type: Applicant");

                if (!string.IsNullOrEmpty(applicant.PreferredOccupation))
                    stringBuilder.AppendLine($"Preferred Occupation: {applicant.PreferredOccupation}");

                if (!string.IsNullOrEmpty(applicant.About))
                    stringBuilder.AppendLine($"About: {applicant.About.Replace("\r", " ").Replace("\n", " ")}");

                stringBuilder.AppendLine($"Ready To Work: {(applicant.ReadyToWork ? "Yes" : "No")}");
            }

            if (!string.IsNullOrEmpty(user.Location))
                stringBuilder.AppendLine($"Location: {user.Location}.");
            if (!string.IsNullOrEmpty(user.Industry))
                stringBuilder.AppendLine($"Industry: {user.Industry}.");

            if (user is Employer)
            {
                var employer = (Employer)user;

                if (employer.JobPosts.Count > 0)
                {
                    stringBuilder.AppendLine("Job Posts: ");
                    
                    foreach (var post in employer.JobPosts)
                        stringBuilder.Append(post.ToEmbeddingInputString(true));
                }
            }
            else if (user is Applicant)
            {
                var applicant = (Applicant)user;

                if (applicant.Skills.Count > 0)
                    stringBuilder.AppendLine($"Skills: {string.Join(", ", applicant.Skills.Select(s => s.Name))}");

                if (applicant.WorkExperience.Count > 0)
                {
                    stringBuilder.AppendLine("Work Experience:");
                    
                    foreach (var entry in applicant.WorkExperience)
                    {
                        var startMonth = entry.StartMonth?.ToString("00");
                        var start = $"{(startMonth is not null ? startMonth + "/" : "")}{entry.StartYear}";
                        var endMonth = entry.EndMonth?.ToString("00");
                        var end = entry.EndMonth is null && entry.EndYear is null
                            ? "present"
                            : $"{(endMonth is not null ? endMonth + "/" : "")}{entry.EndYear ?? DateTime.UtcNow.Year}";
                            
                        var description = entry.Description?.Replace("\n", " ").Replace("\r", " ");

                        stringBuilder.AppendLine($"- {entry.Position} at {entry.Employer}, {start}-{end}. {description}");
                    }
                }

                if (applicant.Education.Count > 0)
                {
                    stringBuilder.AppendLine("Education:");

                    foreach (var entry in applicant.Education)
                    {
                        var degreeAndMajor = !string.IsNullOrEmpty(entry.Degree)
                            ? $"{entry.Degree}{(!string.IsNullOrEmpty(entry.Major) ? $" in {entry.Major}" : "")} from "
                            : !string.IsNullOrEmpty(entry.Major) ? $"Majoring in {entry.Major} at " : "";
                        var location = !string.IsNullOrEmpty(entry.InstitutionLocation) 
                            ? ", " + entry.InstitutionLocation 
                            : "";

                        var startMonth = entry.StartMonth?.ToString("00");
                        var start = $"{(startMonth is not null ? startMonth + "/" : "")}{entry.StartYear}";
                        var endMonth = entry.EndMonth?.ToString("00");
                        var end = entry.EndMonth is null && entry.EndYear is null
                            ? "present"
                            : $"{(endMonth is not null ? endMonth + "/" : "")}{entry.EndYear ?? DateTime.UtcNow.Year}";

                        stringBuilder.AppendLine($"- {degreeAndMajor}{entry.Institution}{location}, {start}-{end}.");
                    }
                }

                if (applicant.CertificationsAndLicenses.Count > 0)
                {
                    stringBuilder.AppendLine("Certifications And Licenses:");

                    foreach (var certificateOrLicense in applicant.CertificationsAndLicenses)
                    {
                        var issuedMonth = certificateOrLicense.IssuedMonth?.ToString("00");
                        var issued = $"{(issuedMonth is not null ? issuedMonth + "/" : "")}{certificateOrLicense.IssuedYear}";
                        var expiryMonth = certificateOrLicense.ExpirationMonth?.ToString("00");
                        var expiryYear = certificateOrLicense.ExpirationYear ?? DateTime.UtcNow.Year;
                        var expiry = 
                            certificateOrLicense.ExpirationMonth is not null || certificateOrLicense.ExpirationYear is not null
                                ? $", Expires {(expiryMonth is not null ? expiryMonth + "/" : "")}{expiryYear}"
                                : "";

                        var description = certificateOrLicense.Description?.Replace("\n", " ").Replace("\r", " ");

                        stringBuilder.AppendLine(
                            $"- {certificateOrLicense.Name} by {certificateOrLicense.Issuer}, Issued {issued}{expiry}. {description}");
                    }
                }
            }

            return stringBuilder.ToString();
        }
    }
}
