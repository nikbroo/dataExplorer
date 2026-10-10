import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUERY,
  applyQueryPatch,
  parseOrdersQuery,
  serializeOrdersQuery,
} from "./useOrderQueryParams";

describe("order query params", () => {
  it("parses a full URL into a typed query", () => {
    const query = parseOrdersQuery(
      new URLSearchParams("q=alex&status=shipped&sortBy=totalAmount&sortOrder=asc&page=3&limit=50"),
    );
    expect(query).toEqual({
      q: "alex",
      status: "shipped",
      sortBy: "totalAmount",
      sortOrder: "asc",
      page: 3,
      limit: 50,
    });
  });

  it("falls back to defaults for invalid values", () => {
    const query = parseOrdersQuery(
      new URLSearchParams("status=lost&sortBy=evil&sortOrder=sideways&page=-2&limit=9999"),
    );
    expect(query).toEqual(DEFAULT_QUERY);
  });

  it("omits defaults when serializing so URLs stay short and round-trip", () => {
    expect(serializeOrdersQuery(DEFAULT_QUERY).toString()).toBe("");
    const custom = { ...DEFAULT_QUERY, q: "alex", status: "shipped" as const, page: 2 };
    expect(parseOrdersQuery(serializeOrdersQuery(custom))).toEqual(custom);
  });

  it("resets to page 1 when filters, sort or page size change", () => {
    const current = { ...DEFAULT_QUERY, page: 7 };
    expect(applyQueryPatch(current, { q: "x" }).page).toBe(1);
    expect(applyQueryPatch(current, { status: "pending" }).page).toBe(1);
    expect(applyQueryPatch(current, { sortOrder: "asc" }).page).toBe(1);
    expect(applyQueryPatch(current, { limit: 100 }).page).toBe(1);
    expect(applyQueryPatch(current, { page: 8 }).page).toBe(8);
    expect(applyQueryPatch(current, { q: "" }).page).toBe(7);
  });
});
