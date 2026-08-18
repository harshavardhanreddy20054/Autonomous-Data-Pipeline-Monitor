import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Hash } from 'lucide-react';

const AnomalyCard = ({ anomaly, index }) => {
  const isNegative = anomaly.type === 'Negative Value';
  const isHigh = anomaly.type === 'High Value';
  
  const typeColors = {
    'Negative Value': {
      bg: 'from-rose-500/20 to-red-500/10',
      border: 'border-rose-500/30',
      icon: 'bg-rose-500/20 text-rose-400',
      text: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-400',
    },
    'High Value': {
      bg: 'from-amber-500/20 to-orange-500/10',
      border: 'border-amber-500/30',
      icon: 'bg-amber-500/20 text-amber-400',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400',
    },
    'Anomaly': {
      bg: 'from-purple-500/20 to-pink-500/10',
      border: 'border-purple-500/30',
      icon: 'bg-purple-500/20 text-purple-400',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-400',
    },
  };

  const colors = typeColors[anomaly.type] || typeColors['Anomaly'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.03, y: -4 }}
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colors.bg} 
        backdrop-blur-md border ${colors.border} p-5 shadow-lg transition-all duration-300`}
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-lg ${colors.icon}`}>
            {isNegative ? (
              <TrendingDown className="w-5 h-5" />
            ) : isHigh ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
            {anomaly.type}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-500" />
            <span className="text-gray-400 text-sm">Row</span>
            <span className="text-white font-semibold">{anomaly.row}</span>
          </div>

          <div className="flex items-center gap-2">
            <code className={`${colors.text} bg-white/10 px-2 py-1 rounded text-sm font-medium`}>
              {anomaly.column}
            </code>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Value:</span>
            <span className={`${colors.text} font-bold text-lg`}>
              {anomaly.value}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnomalyCard;
