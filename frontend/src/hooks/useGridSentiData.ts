"use client";

import { useEffect, useState, useRef } from "react";
import { getAllNodes } from "@/services/node.service";
import { getActiveAlerts } from "@/services/alert.service";
import { getRecentEvents, getLatestSystemDetection } from "@/services/fault.service";
import { getPublicWarnings } from "@/services/publicWarning.service";
import { APP_CONFIG } from "@/config/app.config";
import type { MonitoringNode, Alert, EventLogItem, PublicWarning } from "@/types";

export interface GridSentiDataState {
  nodes: MonitoringNode[];
  alerts: Alert[];
  events: EventLogItem[];
  latestDetection: any;
  publicWarnings: PublicWarning[];
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
  const [publicWarnings, setPublicWarnings] = useState<PublicWarning[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isFetchingRef = useRef<boolean>(false);

  const fetchData = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // Core endpoints: nodes, alerts, events, latestDetection
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
      console.warn("[useGridSentiData] Core backend connection unavailable:", error);
      setIsConnected(false);
    }

    // Optional Batch 2 endpoints: public warnings (do NOT trigger backend disconnect if unavailable)
    try {
      const fetchedWarnings = await getPublicWarnings();
      setPublicWarnings(fetchedWarnings);
    } catch (warningError) {
      console.warn("[useGridSentiData] Optional public warnings endpoint unavailable:", warningError);
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
    publicWarnings,
    isConnected,
    lastUpdated,
    isLoading,
    refresh: fetchData,
  };
}
