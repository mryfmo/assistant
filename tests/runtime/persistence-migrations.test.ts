import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { Database } from "bun:sqlite";

const migrationsDir = resolve(process.cwd(), "db/migrations");

function migrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

test("M6 migrations apply cleanly on empty DB and remain forward-only", () => {
  const files = migrationFiles();
  assert.deepEqual(files, [
    "0001_init_workflows_tasks_leases_artifacts.sql",
    "0002_workflow_id_immutability.sql",
    "0003_workflow_id_idempotency_unique.sql",
    "0004_transition_constraints.sql",
  ]);

  const createdTables = new Set<string>();
  const createdIndexes = new Set<string>();
  const createdTriggers = new Set<string>();
  const sqlite = new Database(":memory:");

  try {
    sqlite.exec("PRAGMA foreign_keys = ON;");

    for (const file of files) {
      const sql = readFileSync(resolve(migrationsDir, file), "utf-8");
      assert.equal(sql.includes("-- forward_only: true"), true);
      assert.equal(/\bDROP\s+(TABLE|INDEX|TRIGGER)\b/i.test(sql), false);

      for (const match of sql.matchAll(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-z_]+)/gi)) {
        createdTables.add(match[1]);
      }
      for (const match of sql.matchAll(
        /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+([a-z_]+)/gi,
      )) {
        createdIndexes.add(match[1]);
      }
      for (const match of sql.matchAll(/CREATE\s+TRIGGER\s+IF\s+NOT\s+EXISTS\s+([a-z_]+)/gi)) {
        createdTriggers.add(match[1]);
      }

      sqlite.exec(sql);
    }

    for (const requiredTable of ["artifacts", "leases", "tasks", "workflows"]) {
      assert.equal(createdTables.has(requiredTable), true);
    }
    assert.equal(createdIndexes.has("tasks_workflow_id_idempotency_key_unique"), true);
    assert.equal(createdTriggers.size >= 4, true);

    const appliedTables = sqlite
      .query("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all() as Array<{ name: string }>;
    const tableNames = new Set(appliedTables.map((row) => row.name));

    for (const requiredTable of ["artifacts", "leases", "tasks", "workflows"]) {
      assert.equal(tableNames.has(requiredTable), true);
    }

    const appliedIndex = sqlite
      .query("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?")
      .get("tasks_workflow_id_idempotency_key_unique") as { name?: string } | null;
    assert.equal(appliedIndex?.name, "tasks_workflow_id_idempotency_key_unique");

    const appliedTriggers = sqlite
      .query("SELECT name FROM sqlite_master WHERE type = 'trigger' ORDER BY name")
      .all() as Array<{ name: string }>;
    assert.equal(appliedTriggers.length >= 4, true);
  } finally {
    sqlite.close();
  }
});
