import type { ErrorResponse } from './types.js';

export async function apiRequest<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data: unknown = await response.json();

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new Error(data.error);
    }
    throw new Error(`Request failed: ${response.status}`);
  }

  return data as T;
}

function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ErrorResponse).error === 'string'
  );
}
