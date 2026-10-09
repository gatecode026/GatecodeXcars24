/**
 * Standardized server-side pagination helper for Mongoose queries
 * Enforces maximum page size, stable sorting with _id tie-breaker, lean queries,
 * and standard pagination contract.
 *
 * @param {import('mongoose').Model} model - Mongoose model
 * @param {object} filter - Validated query filter
 * @param {object} options - Pagination options from req.query
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @param {number} [options.maxLimit=100]
 * @param {object} [options.sort={ createdAt: -1, _id: -1 }]
 * @param {string|object} [options.select]
 * @param {string|object|Array} [options.populate]
 * @param {boolean} [options.all=false]
 * @returns {Promise<{ data: Array, pagination: { page: number, perPage: number, total: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } }>}
 */
export async function paginateQuery(model, filter = {}, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const maxLimit = options.maxLimit || 100;

  let limit;
  if (options.all === true || options.all === "true") {
    // For exports or unbounded requests, enforce safety ceiling
    limit = Math.min(parseInt(options.limit, 10) || 1000, 2000);
  } else {
    const requestedLimit = parseInt(options.limit || options.perPage, 10) || 50;
    limit = Math.max(1, Math.min(requestedLimit, maxLimit));
  }

  const skip = (page - 1) * limit;

  // Stable sorting with tie-breaker
  let sort = options.sort;
  if (!sort) {
    sort = { createdAt: -1, _id: -1 };
  } else if (typeof sort === "object" && !sort._id) {
    sort = { ...sort, _id: -1 };
  }

  let query = model.find(filter).sort(sort).skip(skip).limit(limit).lean();

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  const [data, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit) || 0;

  return {
    data,
    pagination: {
      page,
      perPage: limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}
