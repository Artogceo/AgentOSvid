import { createFileRoute } from "@tanstack/react-router"
import AgentsPage from "@/components/Agents/AgentsPage"

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
})
