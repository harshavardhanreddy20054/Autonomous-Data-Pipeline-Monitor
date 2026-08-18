import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, BarChart3, Activity, Database } from 'lucide-react';

const ResultDisplay = ({ results }) => {
  if (!results) return null;

  const { missingValues, anomalies, summary } = results;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-8 space-y-6"
    >
      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-6 hover:neon-border transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <Database className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-gray-400 text-sm">Total Rows</span>
          </div>
          <p className="text-3xl font-bold text-white">{summary.totalRows.toLocaleString()}</p>
        </div>

        <div className="glass-card rounded-xl p-6 hover:neon-border transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-yellow-500/20 p-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <span className="text-gray-400 text-sm">Missing Values</span>
          </div>
          <p className="text-3xl font-bold text-white">{missingValues.count}</p>
          <p className="text-xs text-gray-500 mt-1">
            {((missingValues.count / summary.totalCells) * 100).toFixed(2)}% of data
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 hover:neon-border transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-red-500/20 p-2">
              <Activity className="h-5 w-5 text-red-400" />
            </div>
            <span className="text-gray-400 text-sm">Anomalies Detected</span>
          </div>
          <p className="text-3xl font-bold text-white">{anomalies.count}</p>
          <p className="text-xs text-gray-500 mt-1">
            {((anomalies.count / summary.totalRows) * 100).toFixed(2)}% of rows
          </p>
        </div>
      </motion.div>

      {/* Missing Values Section */}
      {missingValues.details.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">Missing Values</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Column</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Missing Count</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {missingValues.details.map((item, index) => (
                  <motion.tr
                    key={item.column}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 text-white">{item.column}</td>
                    <td className="py-3 px-4 text-yellow-400">{item.count}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-12">{item.percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Anomalies Section */}
      {anomalies.details.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="h-6 w-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Anomalies Detected</h3>
          </div>
          <div className="space-y-3">
            {anomalies.details.map((anomaly, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl bg-red-500/10 border border-red-500/20 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-red-500/20 p-1 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{anomaly.type}</p>
                    <p className="text-sm text-gray-400 mt-1">{anomaly.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Column: <span className="text-red-400">{anomaly.column}</span></span>
                      <span>Row: <span className="text-red-400">{anomaly.row}</span></span>
                      <span>Value: <span className="text-red-400">{anomaly.value}</span></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Health Score */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-6 w-6 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Data Health Score</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <svg className="h-32 w-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
                fill="none"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 351.86' }}
                animate={{ strokeDasharray: `${(summary.healthScore / 100) * 351.86} 351.86` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{summary.healthScore}%</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-400">
              Overall data quality based on missing values and anomalies detection.
            </p>
            <div className="flex items-center gap-2 mt-3">
              {summary.healthScore >= 80 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-medium">Excellent</span>
                </>
              ) : summary.healthScore >= 60 ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Needs Attention</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="text-red-400 font-medium">Critical Issues</span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultDisplay;
