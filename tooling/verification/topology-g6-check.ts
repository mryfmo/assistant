import { resolve } from "node:path";

import { buildRuntimeLogEventRecord } from "../../src/core/runtime/logging/logger";
import { validateGateTraceability } from "./lib/acceptance-trace";

type TopologyMode = "local" | "remote";

type TopologyDefinition = {
  mode: TopologyMode;
  planAgents: string[];
  executionAgents: Array<{
    id: string;
    endpoint: string;
  }>;
};

type SimulatedDispatchEvent = {
  workflowId: string;
  requestId: string;
  taskId: string;
  assignedAgentId: string;
  topologyMode: TopologyMode;
};

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function simulateDispatch(topology: TopologyDefinition): SimulatedDispatchEvent[] {
  const workflowId = topology.mode === "local" ? "wf-local-001" : "wf-remote-001";
  const requestId = topology.mode === "local" ? "req-local-001" : "req-remote-001";
  const taskIds = ["task-001", "task-002", "task-003"];

  return taskIds.map((taskId, index) => {
    const assignedAgent = topology.executionAgents[index % topology.executionAgents.length];
    return {
      workflowId,
      requestId,
      taskId,
      assignedAgentId: assignedAgent.id,
      topologyMode: topology.mode,
    };
  });
}

function validateTopologyDefinition(topology: TopologyDefinition): void {
  assertCondition(
    topology.planAgents.length === 1,
    `${topology.mode} topology must define exactly one plan agent`,
  );
  assertCondition(
    topology.executionAgents.length >= 2,
    `${topology.mode} topology must define Task Execution Agent xN (N >= 2)`,
  );

  for (const executionAgent of topology.executionAgents) {
    if (topology.mode === "local") {
      assertCondition(
        executionAgent.endpoint.startsWith("local://"),
        `Local topology agent endpoint must use local:// (${executionAgent.id})`,
      );
      continue;
    }

    assertCondition(
      executionAgent.endpoint.startsWith("grpcs://"),
      `Remote topology agent endpoint must use grpcs:// (${executionAgent.id})`,
    );
  }
}

function validateSimulatedEvents(events: SimulatedDispatchEvent[]): void {
  assertCondition(events.length > 0, "Topology simulation produced no dispatch events");

  for (const event of events) {
    const runtimeRecord = buildRuntimeLogEventRecord({
      eventType: "task_dispatched",
      message: `Dispatched ${event.taskId} in ${event.topologyMode} topology`,
      context: {
        workflowId: event.workflowId,
        taskId: event.taskId,
        requestId: event.requestId,
        workerId: event.assignedAgentId,
      },
      data: {
        topology_mode: event.topologyMode,
      },
    });

    assertCondition(
      runtimeRecord.workflow_id === event.workflowId,
      "Simulated event workflow_id mismatch",
    );
    assertCondition(runtimeRecord.task_id === event.taskId, "Simulated event task_id mismatch");
    assertCondition(
      runtimeRecord.request_id === event.requestId,
      "Simulated event request_id mismatch",
    );
  }
}

function main(): void {
  const repoRoot = resolve(__dirname, "../..");
  const result = validateGateTraceability(repoRoot, "G6");

  const localTopology: TopologyDefinition = {
    mode: "local",
    planAgents: ["plan-agent-local-1"],
    executionAgents: [
      { id: "exec-local-1", endpoint: "local://worker/1" },
      { id: "exec-local-2", endpoint: "local://worker/2" },
    ],
  };

  const remoteTopology: TopologyDefinition = {
    mode: "remote",
    planAgents: ["plan-agent-remote-1"],
    executionAgents: [
      { id: "exec-remote-1", endpoint: "grpcs://worker-a.internal:8443" },
      { id: "exec-remote-2", endpoint: "grpcs://worker-b.internal:8443" },
    ],
  };

  validateTopologyDefinition(localTopology);
  validateTopologyDefinition(remoteTopology);
  validateSimulatedEvents(simulateDispatch(localTopology));
  validateSimulatedEvents(simulateDispatch(remoteTopology));

  process.stdout.write(
    `G6 topology validation passed for: ${result.validatedRequirementIds.join(", ")}\n`,
  );
}

main();
