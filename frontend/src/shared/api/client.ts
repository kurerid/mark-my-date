import { initData } from '@tma.js/sdk';
import { z } from 'zod';
import { apiErrorSchema } from './schemas';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function request<S extends z.ZodType>(
  path: string,
  schema: S,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<z.infer<S>> {
  const raw = initData.raw();
  if (!raw) throw new ApiError(401, 'unauthorized', '');
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    signal: options.signal,
    headers: {
      Authorization: `tma ${raw}`,
      ...(options.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(
      await response.json().catch(() => null),
    );
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.error.code : '',
      parsed.success ? parsed.data.error.message : '',
    );
  }
  return schema.parse(
    response.status === 204 ? undefined : await response.json(),
  );
}
