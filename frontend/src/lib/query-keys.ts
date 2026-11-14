/** Centralised query keys so invalidation is precise and typo-proof. */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  doctors: {
    all: ['doctors'] as const,
    list: (params: object) => ['doctors', 'list', params] as const,
    detail: (id: string) => ['doctors', 'detail', id] as const,
    patients: (id: string, params: object) => ['doctors', 'detail', id, 'patients', params] as const,
    facets: ['doctors', 'facets'] as const,
    options: ['doctors', 'options'] as const,
  },
  patients: {
    all: ['patients'] as const,
    list: (params: object) => ['patients', 'list', params] as const,
    facets: ['patients', 'facets'] as const,
  },
  stats: (range: string) => ['stats', range] as const,
};
