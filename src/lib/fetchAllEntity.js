export async function fetchAllEntity(entityApi, sort = '-created_date', pageSize = 500) {
  const rows = [];
  let skip = 0;

  while (true) {
    const batch = await entityApi.list(sort, pageSize, skip);
    if (!batch?.length) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    skip += pageSize;
  }

  return rows;
}