"use client";

// AI Command Center: Conversational chat interface for interacting with Hermes
// Replaces old command/task list with modern chat UI

import { HermesChat } from "./HermesChat";

export function AgentPage() {
  return (
    <div className="h-full">
      <HermesChat />
    </div>
  );
}
