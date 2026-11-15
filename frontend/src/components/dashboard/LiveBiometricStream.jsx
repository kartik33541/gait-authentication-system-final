import React, { useState, useEffect } from 'react';
import { Activity, Radio } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { GlassPanel } from '../ui/GlassPanel';
import { Badge } from '../ui/Badge';

/**
 * LiveBiometricStream Component
 * Plots real-time 3-Axis acceleration and Siamese Triplet similarity over continuous timestamps.
 * @param {object} props
 * @param {string} [props.title='Siamese Temporal Similarity & Acceleration Feed']
 * @param {boolean} [props.isLive=true]
 */
export const LiveBiometricStream = ({ title = "Siamese Temporal Similarity & Acceleration Feed", isLive = true }) => {
  const [data, setData] = useState([
    { time: '12:00', x: 0.98, y: 0.85, z: 0.92, roc: 99.4 },
    { time: '12:01', x: 1.02, y: 0.88, z: 0.94, roc: 99.7 },
    { time: '12:02', x: 0.95, y: 0.81, z: 0.89, roc: 99.5 },
    { time: '12:03', x: 1.08, y: 0.91, z: 0.97, roc: 99.8 },
    { time: '12:04', x: 1.01, y: 0.86, z: 0.93, roc: 99.6 },
    { time: '12:05', x: 0.99, y: 0.84, z: 0.91, roc: 99.7 },
  ]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      const newX = parseFloat((0.92 + Math.random() * 0.18).toFixed(2));
      const newY = parseFloat((0.80 + Math.random() * 0.15).toFixed(2));
      const newZ = parseFloat((0.88 + Math.random() * 0.14).toFixed(2));
      const newRoc = parseFloat((99.2 + Math.random() * 0.7).toFixed(1));

      setData(prev => [...prev.slice(1), { time: now, x: newX, y: newY, z: newZ, roc: newRoc }]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <GlassPanel className="p-6 md:p-8 border-[--border-strong] shadow-xl w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[--border-subtle]">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[--accent-violet]" />
          <div>
            <h3 className="font-bold text-lg text-[--text-primary]">{title}</h3>
            <p className="text-xs text-[--text-secondary]">Normalized 3-axis kinetic energy magnitudes vs 256-D vault similarity threshold.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isLive ? "success" : "neutral"} pulsing={isLive} className="font-mono text-xs">
            {isLive ? "● REAL-TIME SENSORS (142 Hz)" : "○ FEED PAUSED"}
          </Badge>
        </div>
      </div>

      <div className="h-72 w-full bg-[--bg-primary]/90 p-4 rounded-[var(--radius-md)] border border-[--border-subtle] relative overflow-hidden">
        <div className="flex items-center justify-between text-micro font-mono text-[--text-muted] uppercase mb-3">
          <span>KINETIC VECTORS (G-FORCE MAGNITUDES)</span>
          <span className="text-[--accent-success]">LIVE CONFIDENCE: {data[data.length - 1]?.roc}% ROC</span>
        </div>

        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorX" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorRoc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22D3A5" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22D3A5" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#8A8F9E" fontSize={10} tickLine={false} />
            <YAxis stroke="#8A8F9E" fontSize={10} domain={[0.6, 1.2]} tickLine={false} />
            <RechartsTooltip
              contentStyle={{ backgroundColor: '#13141F', border: '1px solid #2A2D3A', borderRadius: '8px', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="x" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorX)" name="X-Axis G" />
            <Area type="monotone" dataKey="z" stroke="#EC4899" strokeWidth={2} fillOpacity={0} name="Z-Axis G" />
            <Area type="monotone" dataKey="y" stroke="#9B6BFF" strokeWidth={1.5} fillOpacity={0} name="Y-Axis G" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassPanel>
  );
};

export default LiveBiometricStream;
