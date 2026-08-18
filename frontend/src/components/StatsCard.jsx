import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', delay = 0 }) => {
  const colorStyles = {
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
    green: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    red: 'from-rose-500/20 to-red-500/10 border-rose-500/30 text-rose-400',
    yellow: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
  };

  const iconColors = {
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    red: 'bg-rose-500/20 text-rose-400',
    yellow: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorStyles[color]} 
        backdrop-blur-md border p-6 shadow-xl transition-all duration-300`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconColors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          {subtitle && (
            <span className="text-sm text-gray-400">{subtitle}</span>
          )}
        </div>
        
        <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
        <div className="text-3xl font-bold text-white">{value}</div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
