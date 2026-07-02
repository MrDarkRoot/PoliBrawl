declare module "pg" {
  export interface QueryResultRow {
    [column: string]: unknown;
  }

  export class Pool {
    constructor(config?: {
      connectionString?: string;
      ssl?: {
        rejectUnauthorized?: boolean;
      };
    });

    query<TResult extends QueryResultRow = QueryResultRow>(
      text: string,
      values?: readonly unknown[],
    ): Promise<{ rows: TResult[] }>;

    end(): Promise<void>;
  }
}
