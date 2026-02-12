declare module "bun:sqlite" {
  class Query {
    all(...params: string[]): unknown[];
    get(...params: string[]): unknown;
  }

  export class Database {
    constructor(filename: string);
    exec(sql: string): void;
    query(sql: string): Query;
    close(): void;
  }
}
