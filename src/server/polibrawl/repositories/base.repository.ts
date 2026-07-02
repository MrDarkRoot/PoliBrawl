import "server-only";

import { queryMany, queryOne } from "@/server/polibrawl/db";
import type { ListQueryOptions, Uuid } from "@/types/polibrawl";

type FilterValue =
  | string
  | number
  | boolean
  | null
  | readonly string[]
  | readonly number[]
  | readonly boolean[];

type FilterMap = Record<string, FilterValue | undefined>;

type CrudRepositoryConfig = {
  tableName: string;
  insertableColumns: readonly string[];
  updatableColumns: readonly string[];
  filterableColumns: readonly string[];
  defaultOrderBy?: string;
  slugColumn?: string;
  archive: {
    archivedAtColumn: string;
    statusColumn?: string;
    archivedStatusValue?: string;
  };
};

function isPresent(value: unknown) {
  if (value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

function pickColumns(
  input: Record<string, unknown>,
  allowedColumns: readonly string[],
) {
  return Object.entries(input).filter(
    ([key, value]) => allowedColumns.includes(key) && value !== undefined,
  );
}

function buildWhereClause(
  filters: FilterMap,
  allowedColumns: readonly string[],
  startIndex = 1,
) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  let parameterIndex = startIndex;

  for (const [key, rawValue] of Object.entries(filters)) {
    if (!allowedColumns.includes(key) || !isPresent(rawValue)) {
      continue;
    }

    if (rawValue === null) {
      clauses.push(`${key} is null`);
      continue;
    }

    if (Array.isArray(rawValue)) {
      clauses.push(`${key} = any($${parameterIndex})`);
      values.push(rawValue);
      parameterIndex += 1;
      continue;
    }

    clauses.push(`${key} = $${parameterIndex}`);
    values.push(rawValue);
    parameterIndex += 1;
  }

  return {
    clause: clauses.length > 0 ? `where ${clauses.join(" and ")}` : "",
    values,
    nextIndex: parameterIndex,
  };
}

export function createCrudRepository<
  TRecord extends { id: Uuid },
  TCreate extends Record<string, unknown>,
  TUpdate extends Record<string, unknown>,
  TFilters extends FilterMap,
>(config: CrudRepositoryConfig) {
  const defaultOrderBy = config.defaultOrderBy ?? "updated_at desc";

  return {
    async list(filters: TFilters = {} as TFilters, options: ListQueryOptions = {}) {
      const { clause, values, nextIndex } = buildWhereClause(
        filters,
        config.filterableColumns,
      );

      const limitClause =
        typeof options.limit === "number" ? ` limit $${nextIndex}` : "";
      const offsetClause =
        typeof options.offset === "number"
          ? ` offset $${typeof options.limit === "number" ? nextIndex + 1 : nextIndex}`
          : "";

      const queryValues = [...values];

      if (typeof options.limit === "number") {
        queryValues.push(options.limit);
      }

      if (typeof options.offset === "number") {
        queryValues.push(options.offset);
      }

      return queryMany<TRecord>(
        `select * from ${config.tableName} ${clause} order by ${defaultOrderBy}${limitClause}${offsetClause}`,
        queryValues,
      );
    },

    async findById(id: Uuid) {
      return queryOne<TRecord>(
        `select * from ${config.tableName} where id = $1 limit 1`,
        [id],
      );
    },

    async findOne(filters: TFilters) {
      const { clause, values } = buildWhereClause(filters, config.filterableColumns);

      return queryOne<TRecord>(
        `select * from ${config.tableName} ${clause} order by ${defaultOrderBy} limit 1`,
        values,
      );
    },

    async findBySlug(slug: string) {
      if (!config.slugColumn) {
        throw new Error(`${config.tableName} does not support slug lookups.`);
      }

      return queryOne<TRecord>(
        `select * from ${config.tableName} where ${config.slugColumn} = $1 limit 1`,
        [slug],
      );
    },

    async insert(input: TCreate) {
      const entries = pickColumns(input, config.insertableColumns);

      if (entries.length === 0) {
        throw new Error(`No insertable fields were provided for ${config.tableName}.`);
      }

      const columns = entries.map(([key]) => key);
      const placeholders = entries.map((_, index) => `$${index + 1}`);
      const values = entries.map(([, value]) => value);

      return queryOne<TRecord>(
        `insert into ${config.tableName} (${columns.join(", ")}) values (${placeholders.join(", ")}) returning *`,
        values,
      );
    },

    async update(id: Uuid, input: TUpdate) {
      const entries = pickColumns(input, config.updatableColumns);

      if (entries.length === 0) {
        throw new Error(`No updatable fields were provided for ${config.tableName}.`);
      }

      const setClauses = entries.map(
        ([key], index) => `${key} = $${index + 1}`,
      );
      const values = entries.map(([, value]) => value);

      return queryOne<TRecord>(
        `update ${config.tableName} set ${setClauses.join(", ")} where id = $${
          values.length + 1
        } returning *`,
        [...values, id],
      );
    },

    async archive(id: Uuid) {
      const setClauses = [`${config.archive.archivedAtColumn} = now()`];
      const values: unknown[] = [];

      if (config.archive.statusColumn && config.archive.archivedStatusValue) {
        setClauses.unshift(`${config.archive.statusColumn} = $1`);
        values.push(config.archive.archivedStatusValue);
      }

      return queryOne<TRecord>(
        `update ${config.tableName} set ${setClauses.join(", ")} where id = $${
          values.length + 1
        } returning *`,
        [...values, id],
      );
    },
  };
}
