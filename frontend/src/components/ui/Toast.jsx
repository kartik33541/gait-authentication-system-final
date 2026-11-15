import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Custom Toast Item primitive matching the theme
 * @param {object} props
 * @param {string} props.message
 * @param {'success' | 'error' | 'warning' | 'info'} [props.type='info']
 */
export const Toast = ({ message, type = 'info' }) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[--accent-success]" />,
    error: <XCircle className="w-5 h-5 text-[--accent-danger]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[--accent-warning]" />,
    info: <Info className="w-5 h-5 text-[--accent-indigo]" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] bg-[--bg-elevated] border border-[--border-strong] text-[--text-primary] text-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-w-[280px]"
      )}
    >
      <div className="shrink-0">{icons[type] || icons.info}</div>
      <div className="font-medium">{message}</div>
    </motion.div>
  );
};

export default Toast;
