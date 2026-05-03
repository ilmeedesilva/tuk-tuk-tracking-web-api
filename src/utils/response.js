// All endpoints return { success, data } or { success, error }.
/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*} data        - payload
 * @param {number} status - HTTP status (default 200)
 * @param {object} meta   - optional pagination / totals
 */
export const sendSuccess = (res, data, status = 200, meta = null) => {
  const body = { success: true, data };
  if (meta) {
    body.meta = meta;
  }
  return res.status(status).json(body);
};

//Send a created (201) response.
export const sendCreated = (res, data) => sendSuccess(res, data, 201);

// Build a paginated meta block from query params and total count.
export const buildPaginationMeta = (page, limit, total) => ({
  pagination: {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  },
});

//Parse and validate pagination query params.
//Returns { page, limit, skip } safe for Prisma.
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Parse sort query: ?sort=createdAt&order=desc
//Returns Prisma orderBy array.
export const parseSort = (
  query,
  allowedFields = ["createdAt", "updatedAt"],
) => {
  const defaultField = allowedFields.length ? allowedFields[0] : "createdAt";
  const field = allowedFields.includes(query.sort) ? query.sort : defaultField;
  const direction = query.order === "asc" ? "asc" : "desc";
  return [{ [field]: direction }];
};
