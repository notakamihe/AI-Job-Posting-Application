export interface FormState<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ProblemDetails {
  type: string;
	title: string;
	status: number;
	traceId: string;
	detail?: string;
	errors?: Record<string, string[]>;	
}

export interface Pagination {
  page: number;
  pageCount: number;
  totalCount: number;
}

export interface PaginatedResults<T> extends Pagination {
  results: T[];
}