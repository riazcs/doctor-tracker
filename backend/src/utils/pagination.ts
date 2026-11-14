import type { Model, QueryFilter, SortOrder, PopulateOptions } from 'mongoose';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginateOptions {
  page: number;
  limit: number;
  sort: Record<string, SortOrder>;
  projection?: string;
  populate?: PopulateOptions;
}

/**
 * Runs the page query and the count in parallel. When there is no filter we use
 * `estimatedDocumentCount` (collection metadata, O(1)) instead of a full count.
 */
export async function paginate<T>(
  model: Model<T>,
  filter: QueryFilter<T>,
  { page, limit, sort, projection, populate }: PaginateOptions,
) {
  let query = model
    .find(filter, projection)
    // _id tiebreaker keeps pages stable; it follows the primary direction so the
    // compound {field, _id} index can be walked forwards or backwards.
    .sort({ ...sort, _id: Object.values(sort)[0] ?? -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  if (populate) query = query.populate(populate);

  const isEmptyFilter = Object.keys(filter).length === 0;
  const [items, total] = await Promise.all([
    query.exec(),
    isEmptyFilter ? model.estimatedDocumentCount() : model.countDocuments(filter),
  ]);

  const meta: PageMeta = { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  return { items, meta };
}

export function dateRangeFilter(from?: string, to?: string) {
  if (!from && !to) return undefined;
  const range: { $gte?: Date; $lt?: Date } = {};
  if (from) range.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) {
    const end = new Date(`${to}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1); // inclusive "to" date
    range.$lt = end;
  }
  return range;
}
