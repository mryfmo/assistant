import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type PostgresHarness = {
  dsn: string;
  schema: string;
  runSql: (sql: string) => Promise<string>;
  queryValue: (sql: string) => Promise<string | undefined>;
};

function randomSchema(): string {
  const suffix = Math.random().toString(16).slice(2, 10);
  return `runtime_${Date.now()}_${suffix}`;
}

export function postgresTestDsn(): string | undefined {
  const dsn = process.env.ORCH_TEST_POSTGRES_DSN;
  if (dsn === undefined || dsn.trim().length === 0) {
    return undefined;
  }
  return dsn;
}

async function psql(dsn: string, sql: string): Promise<string> {
  const { stdout } = await execFileAsync("psql", [
    dsn,
    "-v",
    "ON_ERROR_STOP=1",
    "-t",
    "-A",
    "-q",
    "-F",
    "\t",
    "-c",
    sql,
  ]);
  return stdout.trim();
}

function schemaSql(schema: string, sql: string): string {
  return `SET search_path TO ${schema};\n${sql}`;
}

async function initSchema(dsn: string, schema: string): Promise<void> {
  await psql(
    dsn,
    `CREATE SCHEMA ${schema};
SET search_path TO ${schema};

CREATE TABLE workflows (
  workflow_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflows(workflow_id),
  task_type TEXT NOT NULL,
  state TEXT NOT NULL,
  spec_json JSONB NOT NULL,
  priority INTEGER NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  next_retry_unix_ms BIGINT NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE UNIQUE INDEX tasks_workflow_id_idempotency_key_unique
ON tasks (workflow_id, idempotency_key);

CREATE TABLE leases (
  task_id TEXT PRIMARY KEY REFERENCES tasks(task_id),
  workflow_id TEXT NOT NULL REFERENCES workflows(workflow_id),
  worker_id TEXT NOT NULL,
  issued_unix_ms BIGINT NOT NULL,
  expires_unix_ms BIGINT NOT NULL
);

CREATE TABLE artifacts (
  artifact_id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflows(workflow_id),
  task_id TEXT NOT NULL REFERENCES tasks(task_id),
  uri TEXT NOT NULL,
  digest TEXT NOT NULL,
  created_at BIGINT NOT NULL
);`,
  );
}

export async function withPostgresHarness(
  fn: (harness: PostgresHarness) => Promise<void>,
): Promise<boolean> {
  const dsn = postgresTestDsn();
  if (dsn === undefined) {
    return false;
  }

  const schema = randomSchema();
  await initSchema(dsn, schema);

  const runSql = async (sql: string): Promise<string> => psql(dsn, schemaSql(schema, sql));
  const queryValue = async (sql: string): Promise<string | undefined> => {
    const output = await runSql(sql);
    const [firstLine] = output.split("\n").filter((line) => line.length > 0);
    return firstLine;
  };

  try {
    await fn({ dsn, schema, runSql, queryValue });
    return true;
  } finally {
    await psql(dsn, `DROP SCHEMA IF EXISTS ${schema} CASCADE;`);
  }
}
