namespace Backend.DTO;

public class ResultsWithCount<T>
{
    public required List<T> Results { get; set; }
    public int TotalCount { get; set; }
}

public class PaginatedResults<T> : ResultsWithCount<T>
{
    public int Page { get; set; }
    public int PageCount { get; set; }
}
