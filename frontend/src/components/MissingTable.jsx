import { motion } from 'framer-motion';
import { AlertCircle, Table, CheckCircle } from 'lucide-react';

const MissingTable = ({ missingData, totalRows }) => {
  if (!missingData || missingData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 
          backdrop-blur-md border border-emerald-500/20 p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-emerald-400 mb-2">No Missing Values Found</h3>
        <p className="text-gray-400">Your dataset is complete with no missing data.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 
        backdrop-blur-md border border-amber-500/20 overflow-hidden"
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <Table className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-white">Missing Values Analysis</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Column</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">Missing Count</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-gray-400">Percentage</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {missingData.map((item, index) => (
              <motion.tr
                key={item.column}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4">
                  <code className="text-amber-400 bg-amber-500/10 px-2 py-1 rounded text-sm">
                    {item.column}
                  </code>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-white font-semibold">{item.count}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          item.percentage > 20 ? 'bg-rose-500' : 
                          item.percentage > 10 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${
                      item.percentage > 20 ? 'text-rose-400' : 
                      item.percentage > 10 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.percentage > 20 ? (
                    <span className="inline-flex items-center gap-1 text-rose-400 text-sm">
                      <AlertCircle className="w-4 h-4" /> Critical
                    </span>
                  ) : item.percentage > 10 ? (
                    <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                      <AlertCircle className="w-4 h-4" /> Warning
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                      <CheckCircle className="w-4 h-4" /> Low
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default MissingTable;
