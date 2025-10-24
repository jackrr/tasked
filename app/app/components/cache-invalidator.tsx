import { createContext, useEffect, useState } from "react";
import { QueryClient } from "@tanstack/react-query";

const WS_BASE_URI = process.env.NEXT_PUBLIC_WS_URI;

type SubscriptionPayload = {
  entityType: "tasks" | "projects";
  entityId?: string;
};

export const CacheContext = createContext({
  subscribe: (_: SubscriptionPayload) => {},
  unsubscribe: (_: SubscriptionPayload) => {},
});

type ServerUpdateEvent = {
  kind: "Create" | "Update" | "Destroy";
  entity_type: "Project" | "Task";
  entity_id: string;
};

type ClientUpdateEvent = {
  kind: "create" | "update" | "destroy";
  entityType: "projects" | "tasks";
  entityId: string;
};

function toClient(e: ServerUpdateEvent): ClientUpdateEvent {
  return {
    kind: e.kind.toLowerCase() as ClientUpdateEvent["kind"],
    entityType: e.entity_type === "Project" ? "projects" : "tasks",
    entityId: e.entity_id,
  };
}

export function useCacheInvalidator(queryClient: QueryClient) {
  const [webSocket] = useState(new WebSocket(`${WS_BASE_URI}/subscribe`));

  useEffect(() => {
    webSocket.addEventListener("message", (event) => {
      const message = toClient(JSON.parse(event.data) as ServerUpdateEvent);
      const { entityId, entityType } = message;

      // Sadly, all changes affect project list page.
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      if (entityType === "tasks") {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }

      if (!!entityId) {
        queryClient.invalidateQueries({ queryKey: [entityType, entityId] });
      }
    });

    return () => {
      webSocket.close();
    };
  }, [webSocket]);
}
