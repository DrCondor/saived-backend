// Get CSRF token from Rails meta tag
function getCsrfToken(): string {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || '';
}

interface FetchOptions extends RequestInit {
  json?: unknown;
}

interface ApiError {
  error?: string;
  errors?: string[];
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { json, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-CSRF-Token': getCsrfToken(),
    ...options.headers,
  };

  const config: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include', // Important for session auth!
  };

  if (json) {
    config.body = JSON.stringify(json);
  }

  const response = await fetch(`/api/v1${endpoint}`, config);

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({}));
    const message =
      errorData.error || errorData.errors?.join(', ') || 'Request failed';
    throw new ApiClientError(message, response.status, errorData.errors);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Client for multipart/form-data requests (file uploads)
export async function apiClientFormData<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PATCH' = 'POST'
): Promise<T> {
  const headers: HeadersInit = {
    Accept: 'application/json',
    'X-CSRF-Token': getCsrfToken(),
    // Note: Don't set Content-Type - browser sets it automatically with boundary for FormData
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
    body: formData,
  };

  const response = await fetch(`/api/v1${endpoint}`, config);

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({}));
    const message =
      errorData.error || errorData.errors?.join(', ') || 'Request failed';
    throw new ApiClientError(message, response.status, errorData.errors);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
