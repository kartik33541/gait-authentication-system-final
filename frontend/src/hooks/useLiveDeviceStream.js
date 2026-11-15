import { useState, useEffect } from 'react';
import { socketClient } from '../lib/socket';

/**
 * Custom hook to stream live authentication attempts in real time via WebSockets/Simulation.
 * @param {string} workspaceId
 * @param {string} serverState
 */
export function useLiveDeviceStream(workspaceId, serverState = 'LIVE') {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!workspaceId) return;

    // Connect to WebSocket / simulation engine
    socketClient.connect(workspaceId);
    socketClient.setServerState(serverState);

    // Initial simulated backlog so the screen isn't empty on load
    const initialEvent = {
      id: `EVT_INIT_1001`,
      status: 'ACCESS GRANTED',
      personName: 'Kartik Rawat',
      deviceId: 'DEV_3991',
      timestamp: new Date(Date.now() - 35000).toISOString(),
      similarityScore: 0.942,
      energyScore: 1.45,
      explanation: 'High confidence match (94.2%) against enrolled 256-D temporal vault. Dynamic stride physics conform to authorized pattern.'
    };
    setEvents([initialEvent]);

    const unsubscribe = socketClient.on('auth_event', (newEvent) => {
      setEvents((prev) => [newEvent, ...prev].slice(0, 40)); // keep last 40 events
    });

    return () => {
      unsubscribe();
      socketClient.disconnect();
    };
  }, [workspaceId]);

  // Keep simulation paused if server state is stopped
  useEffect(() => {
    socketClient.setServerState(serverState);
  }, [serverState]);

  return {
    events,
    clearEvents: () => setEvents([])
  };
}

export default useLiveDeviceStream;
