export const getPagination = (pageValue: unknown, limitValue: unknown) => {
  const page = Math.max(Number(pageValue) || 1, 1);
  const limit = Math.min(Math.max(Number(limitValue) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const paginationMeta = (page: number, limit: number, total: number) => ({
  currentPage: page,
  limit,
  totalItems: total,
  totalPages: Math.ceil(total / limit),
});
