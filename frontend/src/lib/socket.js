/**
 * @file socket.js
 * @description WebSocket / Real-time simulation singleton for live perimeter monitoring and training logs.
 * Falls back to realistic biometric data streaming when physical backend server is offline.
 */

class BiometricSocketClient {
  constructor() {
    this.listeners = new Map();
    this.isConnected = false;
    this.simulationTimer = null;
    this.serverState = 'LIVE'; // LIVE or STOPPED
  }

  connect(workspaceId) {
    this.workspaceId = workspaceId;
    this.isConnected = true;
    this.emit('connect', { workspaceId });
    this.startSimulation();
  }

  disconnect() {
    this.isConnected = false;
    this.stopSimulation();
    this.emit('disconnect');
  }

  setServerState(state) {
    this.serverState = state;
    this.emit('server_state_change', { state });
    if (state === 'STOPPED') {
      this.stopSimulation();
    } else if (this.isConnected) {
      this.startSimulation();
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, callbacks);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }

  // Realistic simulation engine to bring UI alive with authentic GaitAuth events
  startSimulation() {
    this.stopSimulation();
    if (this.serverState === 'STOPPED') return;

    const names = ['Kartik Rawat', 'Praveen Kumar Patel', 'Nikhil Dangi', 'Abhishek Gupta'];
    const anomalyTypes = ['STATIC DETECTED', 'ANOMALY DETECTED', 'ACCESS DENIED'];
    
    this.simulationTimer = setInterval(() => {
      if (!this.isConnected || this.serverState === 'STOPPED') return;

      const rand = Math.random();
      const personName = names[Math.floor(Math.random() * names.length)];
      const timestamp = new Date().toISOString();

      let eventData = {};
      
      if (rand < 0.75) {
        // Normal Granted Attempt
        const similarity = 0.78 + Math.random() * 0.18; // 0.78 to 0.96
        const energy = 1.1 + Math.random() * 0.6;
        eventData = {
          id: `EVT_${Date.now()}`,
          status: 'ACCESS GRANTED',
          personName,
          deviceId: `DEV_${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp,
          similarityScore: similarity,
          energyScore: energy,
          explanation: `High confidence match (${(similarity * 100).toFixed(1)}%) against enrolled 256-D temporal vault. Dynamic stride physics conform to authorized pattern.`
        };
      } else if (rand < 0.88) {
        // Static Spoof Attempt
        const energy = 0.2 + Math.random() * 0.5; // Below 1.0
        eventData = {
          id: `EVT_${Date.now()}`,
          status: 'STATIC DETECTED',
          personName: 'Unknown Device',
          deviceId: `DEV_${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp,
          similarityScore: 0.81,
          energyScore: energy,
          explanation: `Physics Guard triggered: 3D acceleration energy (${energy.toFixed(2)}) fell below kinematic threshold 1.0. Rejected static video/accelerometer replay attempt.`
        };
      } else {
        // Denied / Anomaly
        const similarity = 0.35 + Math.random() * 0.30;
        const energy = 1.3 + Math.random() * 0.5;
        eventData = {
          id: `EVT_${Date.now()}`,
          status: 'ACCESS DENIED',
          personName,
          deviceId: `DEV_${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp,
          similarityScore: similarity,
          energyScore: energy,
          explanation: `Siamese LSTM verification rejected: similarity score (${(similarity * 100).toFixed(1)}%) below required 75% threshold. Cadence and pelvic roll mismatch.`
        };
      }

      this.emit('auth_event', eventData);
    }, 4500 + Math.random() * 3000);
  }

  stopSimulation() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  // Simulate model training streaming logs
  streamTrainingProgress(onProgress, onComplete) {
    let step = 0;
    const totalSteps = 25;
    const logs = [
      "Initializing Siamese LSTM neural core...",
      "Loading 5x60s raw sensor time-series per participant...",
      "Trimming first 10 seconds of stabilization variance...",
      "Extracting 3D magnitude kinematic feature vectors...",
      "Building positive & negative anchor contrastive pairs...",
      "Epoch 1/50 - Loss: 0.8942 - Validation AUC: 0.61",
      "Epoch 10/50 - Loss: 0.5412 - Validation AUC: 0.83",
      "Epoch 25/50 - Loss: 0.2104 - Validation AUC: 0.94",
      "Epoch 40/50 - Loss: 0.0812 - Validation AUC: 0.988",
      "Epoch 50/50 - Loss: 0.0231 - Validation AUC: 0.997",
      "Generating 256-D invariant biometric vaults...",
      "Serializing cryptographic model weights into vault.json...",
      "Compiling per-person delivery APK wrappers...",
      "Model optimization complete. Perimeter ready for deployment."
    ];

    const interval = setInterval(() => {
      step++;
      const progress = Math.min(100, Math.floor((step / totalSteps) * 100));
      const logIdx = Math.min(logs.length - 1, Math.floor((step / totalSteps) * logs.length));
      
      onProgress({ progress, log: logs[logIdx] });

      if (step >= totalSteps) {
        clearInterval(interval);
        onComplete({
          modelHash: "LSTM_VAULT_256D_" + Math.random().toString(16).substring(2, 10).toUpperCase(),
          accuracy: 99.7,
        });
      }
    }, 400);

    return () => clearInterval(interval);
  }
}

export const socketClient = new BiometricSocketClient();
export default socketClient;
