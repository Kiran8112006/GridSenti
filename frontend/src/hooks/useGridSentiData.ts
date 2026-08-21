"use client";

import { useEffect, useState, useRef } from "react";
import { getAllNodes } from "@/services/node.service";
import { getActiveAlerts } from "@/services/alert.service";
import { getRecentEvents, getLatestSystemDetection } from "@/services/fault.service";
import { APP_CONFIG } from "@/config/app.config";
import type { MonitoringNode, Alert, EventLogItem } from "@/types";

export interface GridSentiDataState {
  nodes: MonitoringNode[];
  alerts: Alert[];
  events: EventLogItem[];
  latestDetection: any;
  isConnected: boolean;
  lastUpdated: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useGridSentiData(): GridSentiDataState {
  const [nodes, setNodes] = useState<MonitoringNode[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [latestDetection, setLatestDetection] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isFetchingRef = useRef<boolean>(false);

  const fetchData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const [fetchedNodes, fetchedAlerts, fetchedEvents, fetchedDetection] =
        await Promise.all([
          getAllNodes(),
          getActiveAlerts(),
          getRecentEvents(),
          getLatestSystemDetection(),
        ]);

      setNodes(fetchedNodes);
      setAlerts(fetchedAlerts);
      setEvents(fetchedEvents);
      setLatestDetection(fetchedDetection);
      setIsConnected(true);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.warn("[useGridSentiData] Backend connection unavailable:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, APP_CONFIG.pollingIntervalMs);
    return () => clearInterval(interval);
  }, []);

  return {
    nodes,
    alerts,
    events,
    latestDetection,
    isConnected,
    lastUpdated,
    isLoading,
    refresh: fetchData,
  };
}
