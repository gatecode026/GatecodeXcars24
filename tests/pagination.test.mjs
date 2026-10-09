import test from "node:test";
import assert from "node:assert/strict";
import { paginateQuery } from "../src/server/utils/pagination.js";

test("Pagination Utility: standard contract and page limit enforcement", async () => {
  // Mock model with 120 total records
  const mockDocs = Array.from({ length: 25 }, (_, i) => ({ _id: `id_${i + 1}`, name: `Item ${i + 1}` }));
  let capturedSkip = 0;
  let capturedLimit = 0;
  let capturedSort = null;

  const mockModel = {
    find(filter) {
      return {
        sort(s) {
          capturedSort = s;
          return this;
        },
        skip(sk) {
          capturedSkip = sk;
          return this;
        },
        limit(lim) {
          capturedLimit = lim;
          return this;
        },
        lean() {
          return this;
        },
        select() {
          return this;
        },
        populate() {
          return this;
        },
        async exec() {
          return mockDocs;
        }
      };
    },
    async countDocuments() {
      return 120;
    }
  };

  // Test standard page 1 with default limit 50
  const result1 = await paginateQuery(mockModel, {}, { page: 1, limit: 50 });
  assert.equal(result1.pagination.page, 1);
  assert.equal(result1.pagination.perPage, 50);
  assert.equal(result1.pagination.total, 120);
  assert.equal(result1.pagination.totalPages, 3);
  assert.equal(result1.pagination.hasNextPage, true);
  assert.equal(result1.pagination.hasPreviousPage, false);
  assert.equal(capturedSkip, 0);
  assert.equal(capturedLimit, 50);
  assert.deepEqual(capturedSort, { createdAt: -1, _id: -1 }, "Should add _id tiebreaker");

  // Test capping over maxLimit (100)
  const result2 = await paginateQuery(mockModel, {}, { page: 2, limit: 500, maxLimit: 100 });
  assert.equal(result2.pagination.perPage, 100, "Should cap limit to maxLimit 100");
  assert.equal(result2.pagination.page, 2);
  assert.equal(capturedSkip, 100);
  assert.equal(capturedLimit, 100);
  assert.equal(result2.pagination.hasPreviousPage, true);
});
