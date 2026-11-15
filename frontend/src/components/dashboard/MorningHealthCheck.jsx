import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { checkBiometricServerHealth, getMlApiBaseUrl } from '../../lib/biometricApi';

/**
 * MorningHealthCheck — The 3-second Morning Executive Health Check.
 * 
 * Provides 4 instant summary numbers right at the top of the dashboard:
 * 1. Total entries today (real count from access_logs for the current calendar day)
 * 2. Smooth entry rate (percentage of granted entries today)
 * 3. Flagged issues (count of denied, spoofed, or paused entries today)
 * 4. Door sensor status (live perimeter node status)
 * 
 * 100% REAL DATA — NO MOCK VALUES.
 */
export const MorningHealthCheck = ({ tenantId }) => {
  const [metrics, setMetrics] = useState({
    totalEntriesToday: 0,
    smoothEntryRate: 100,
    flaggedIssuesToday: 0,
    totalAllTime: 0
  });
  const [sensorStatus, setSensorStatus] = useState('ONLINE'); // 'ONLINE' | 'OFFLINE'
  const [isLoading, setIsLoading] = useState(true);

  // 1. Listen in real time to the company's access_logs collection
  useEffect(() => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    const logsRef = collection(db, 'organizations', tenantId, 'access_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalToday = 0;
      let grantedToday = 0;
      let flaggedToday = 0;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const empId = String(data.employee_id || '').trim().toUpperCase();
        if (empId === 'POLICY' || empId === 'LOCKDOWN' || empId === 'POLICY-SYS') {
          return;
        }

        let logTime = null;

        if (data.timestamp?.toMillis) {
          logTime = data.timestamp.toMillis();
        } else if (data.timestamp) {
          logTime = new Date(data.timestamp).getTime();
        }

        // Check if log occurred today
        const isToday = logTime ? logTime >= startOfDay : true; // if no timestamp yet, count as today

        if (isToday) {
          totalToday += 1;
          const status = (data.status || '').toUpperCase();
          const incidentStatus = (data.incident_status || (status === 'GRANTED' ? 'RESOLVED' : 'UNRESOLVED')).toUpperCase();

          if (status === 'GRANTED') {
            grantedToday += 1;
          } else if (incidentStatus !== 'DISMISSED') {
            flaggedToday += 1;
          }
        }
      });

      const smoothRate = totalToday > 0 ? Math.round((grantedToday / totalToday) * 100) : 100;

      setMetrics({
        totalEntriesToday: totalToday,
        smoothEntryRate: smoothRate,
        flaggedIssuesToday: flaggedToday,
        totalAllTime: snapshot.size
      });
      setIsLoading(false);
    }, (err) => {
      console.error("Firestore MorningHealthCheck error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // 2. Real-time Door Sensor / Python Backend Health Check (truthful ONLINE vs OFFLINE)
  useEffect(() => {
    let isCancelled = false;

    const checkSensorNode = async () => {
      try {
        await checkBiometricServerHealth(2500);
        if (!isCancelled) {
          setSensorStatus('ONLINE');
        }
      } catch {
        if (!isCancelled) {
          setSensorStatus('OFFLINE');
        }
      }
    };

    checkSensorNode();
    const interval = setInterval(checkSensorNode, 15000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isSensorActive = sensorStatus === 'ONLINE';

  return (
    <div className="w-full">
      {/* Eyebrow Label */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#A8A8B8]">
            The Morning Health Check
          </span>
          <span className="text-[10px] text-white/30 font-mono">
            • Real-Time Perimeter Telemetry
          </span>
        </div>
        <span className="text-[11px] text-[#A8A8B8] font-mono">
          {isLoading ? 'Syncing...' : `${metrics.totalEntriesToday} events today`}
        </span>
      </div>

      {/* 4 Quick Summary Numbers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        
        {/* Metric 1: Total entries today */}
        <div className="p-5 rounded-[1.5rem] bg-[#09090b] border border-white/5 hover:border-white/10 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Total Entries Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Fingerprint className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight leading-none mb-1.5">
              {isLoading ? '—' : metrics.totalEntriesToday}
            </div>
            <p className="text-[12px] text-white/40 font-light">
              {metrics.totalEntriesToday === 0 
                ? 'No authentications recorded yet' 
                : `${metrics.totalEntriesToday} ${metrics.totalEntriesToday === 1 ? 'person' : 'people'} entered`}
            </p>
          </div>
        </div>

        {/* Metric 2: Smooth entry rate */}
        <div className="p-5 rounded-[1.5rem] bg-[#09090b] border border-white/5 hover:border-white/10 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Smooth Entry Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#7EDDB5]/10 border border-[#7EDDB5]/20 flex items-center justify-center text-[#7EDDB5]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-[#7EDDB5] tracking-tight leading-none mb-1.5">
              {isLoading ? '—' : `${metrics.smoothEntryRate}%`}
            </div>
            <p className="text-[12px] text-white/40 font-light">
              {metrics.totalEntriesToday === 0 
                ? 'Ready for authentications' 
                : `${metrics.smoothEntryRate}% verified without incident`}
            </p>
          </div>
        </div>

        {/* Metric 3: Flagged issues */}
        <div className="p-5 rounded-[1.5rem] bg-[#09090b] border border-white/5 hover:border-white/10 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Flagged Issues
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              metrics.flaggedIssuesToday > 0 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-white/[0.03] border-white/10 text-white/40'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-3xl font-bold font-mono tracking-tight leading-none mb-1.5 ${
              metrics.flaggedIssuesToday > 0 ? 'text-rose-400' : 'text-white'
            }`}>
              {isLoading ? '—' : metrics.flaggedIssuesToday}
            </div>
            <p className="text-[12px] text-white/40 font-light">
              {metrics.flaggedIssuesToday === 0 
                ? 'Zero security issues today' 
                : `${metrics.flaggedIssuesToday} ${metrics.flaggedIssuesToday === 1 ? 'entry' : 'entries'} blocked or paused`}
            </p>
          </div>
        </div>

        {/* Metric 4: Door sensor status */}
        <div className="p-5 rounded-[1.5rem] bg-[#09090b] border border-white/5 hover:border-white/10 transition-all shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Door Sensor Status
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-3 w-3">
                {isSensorActive && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  isSensorActive ? 'bg-emerald-400' : 'bg-rose-400'
                }`} />
              </span>
              <span className="text-[17px] font-semibold text-white tracking-tight">
                {isSensorActive ? 'All sensors online' : 'Sensors offline'}
              </span>
            </div>
            <p className="text-[12px] text-white/40 font-light">
              {isSensorActive 
                ? 'Continuous Siamese LSTM listening' 
                : `Server unreachable (${getMlApiBaseUrl()})`}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MorningHealthCheck;

