import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText,
  Database,
  BarChart3,
  Percent,
  Shield,
  Sparkles
} from 'lucide-react';
import FileUpload from '../components/FileUpload';
import DownloadButton from '../components/DownloadButton';
import StatsCard from '../components/StatsCard';
import MissingTable from '../components/MissingTable';
import AnomalyCard from '../components/AnomalyCard';

const API_URL = 'http://localhost:8000';

// ============ DATA PARSING FUNCTIONS ============

const parseColumnFromMissingValue = (str) => {
  // Format: "Row 2: Missing value in 'sales'"
  const match = str.match(/in ['"]([^'"]+)['"]/);
  return match ? match[1] : 'unknown';
};

const parseRowFromAnomaly = (str) => {
  // Format: "Row 4: Negative value in 'sales' (-100.0)"
  const match = str.match(/Row\s+(\d+):/);
  return match ? parseInt(match[1]) : 0;
};

const parseColumnFromAnomaly = (str) => {
  // Format: "Row 4: Negative value in 'sales' (-100.0)"
  const match = str.match(/in ['"]([^'"]+)['"]/);
  return match ? match[1] : 'unknown';
};

const parseValueFromAnomaly = (str) => {
  // Format: "Row 4: Negative value in 'sales' (-100.0)" or "Row 6: Extreme value in 'sales' (15000.0)"
  const match = str.match(/\(([-+]?\d+(?:\.\d+)?)\)/);
  return match ? match[1] : '';
};

const categorizeAnomaly = (str) => {
  if (str.includes('Negative')) return 'Negative Value';
  if (str.includes('Extreme') || str.includes('High')) return 'High Value';
  return 'Anomaly';
};

const groupMissingValues = (missingValues, totalRows) => {
  // Handle backend format: { count: number, details: [{column, count}, ...] }
  if (missingValues && typeof missingValues === 'object' && !Array.isArray(missingValues)) {
    if (missingValues.details && Array.isArray(missingValues.details)) {
      return missingValues.details.map(item => ({
        column: item.column,
        count: item.count,
        percentage: totalRows > 0 ? ((item.count / totalRows) * 100) : 0,
      })).sort((a, b) => b.count - a.count);
    }
    return [];
  }

  // Handle old array format
  if (!missingValues || !Array.isArray(missingValues)) return [];
  
  const actualMissing = missingValues.filter(v => 
    v.includes('Missing') && !v.includes('No missing')
  );
  
  if (actualMissing.length === 0) return [];

  const columnCounts = {};
  actualMissing.forEach(item => {
    const column = parseColumnFromMissingValue(item);
    columnCounts[column] = (columnCounts[column] || 0) + 1;
  });

  return Object.entries(columnCounts)
    .map(([column, count]) => ({
      column,
      count,
      percentage: totalRows > 0 ? ((count / totalRows) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
};

const parseAnomalies = (anomalies) => {
  // Handle backend format: { count: number, details: [...] }
  if (anomalies && typeof anomalies === 'object' && !Array.isArray(anomalies)) {
    if (anomalies.details && Array.isArray(anomalies.details)) {
      return anomalies.details.map(item => ({
        row: item.row || 0,
        column: item.column || 'unknown',
        value: item.value || '',
        type: item.type || 'Anomaly',
        description: item.description || '',
      }));
    }
    return [];
  }

  // Handle old array format
  if (!anomalies || !Array.isArray(anomalies)) return [];
  
  const actualAnomalies = anomalies.filter(a => 
    !a.includes('No anomalies') && a.includes('Row')
  );
  
  if (actualAnomalies.length === 0) return [];

  return actualAnomalies.map(item => ({
    row: parseRowFromAnomaly(item),
    column: parseColumnFromAnomaly(item),
    value: parseValueFromAnomaly(item),
    type: categorizeAnomaly(item),
    description: item,
  }));
};

const calculateHealthScore = (missingCount, anomalyCount, totalRows) => {
  if (totalRows === 0) return 100;
  const penalty = ((missingCount + anomalyCount) / totalRows) * 100;
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
};

const getHealthColor = (score) => {
  if (score >= 80) return { color: 'green', label: 'Good' };
  if (score >= 60) return { color: 'yellow', label: 'Moderate' };
  return { color: 'red', label: 'Poor' };
};

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [notification, setNotification] = useState(null);

  // Create a ref for file input
  const fileInputRef = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const uploadFile = async (file) => {
    if (!file) return;

    setIsLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to upload file');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Extract raw arrays from backend (handle both old and new formats)
      const rawMissing = data.missing_values || [];
      const rawAnomalies = data.anomalies || [];
      const totalRows = data.total_rows || data.summary?.totalRows || 0;
      const totalColumns = data.total_columns || data.summary?.totalColumns || 0;

      // Parse and group data
      const missingGrouped = groupMissingValues(rawMissing, totalRows);
      const parsedAnomalies = parseAnomalies(rawAnomalies);

      // Calculate totals - handle both formats
      let totalMissing = 0;
      if (Array.isArray(rawMissing)) {
        totalMissing = rawMissing.filter(v => 
          typeof v === 'string' && v.includes('Missing') && !v.includes('No missing')
        ).length;
      } else if (rawMissing && typeof rawMissing === 'object') {
        totalMissing = rawMissing.count || 0;
      }

      const totalAnomalies = parsedAnomalies.length;

      const healthScore = calculateHealthScore(totalMissing, totalAnomalies, totalRows);
      const healthStatus = getHealthColor(healthScore);

      setResults({
        totalRows,
        totalColumns,
        totalMissing,
        totalAnomalies,
        missingPercentage: totalRows > 0 ? ((totalMissing / totalRows) * 100).toFixed(1) : '0',
        anomalyPercentage: totalRows > 0 ? ((totalAnomalies / totalRows) * 100).toFixed(1) : '0',
        healthScore,
        healthStatus,
        missingGrouped,
        parsedAnomalies,
        report: data.report,
        filename: data.filename || file.name,
      });

      showNotification('File processed successfully!', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showNotification(error.message || 'Error uploading file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmptyStateClick = () => {
    // Trigger file input click
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setResults(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl 
                backdrop-blur-md shadow-2xl border ${
                notification.type === 'success' 
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl 
            bg-gradient-to-br from-blue-500/20 to-purple-500/10 
            backdrop-blur-md border border-blue-500/30">
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Data Pipeline Monitor
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload your CSV file for intelligent data validation and anomaly detection
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="glass-card rounded-3xl p-6 md:p-10">
            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
                <Activity className="h-4 w-4 text-green-400" />
                <span className="text-sm text-gray-300">System Active</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              </div>
            </div>

            <FileUpload
              onFileSelect={handleFileSelect}
              onUpload={uploadFile}
              isLoading={isLoading}
              selectedFile={selectedFile}
            />
          </div>
        </motion.div>

        {/* Results Dashboard */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Dashboard Metrics */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Dashboard Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatsCard
                    title="Total Rows"
                    value={results.totalRows.toLocaleString()}
                    subtitle="Records Analyzed"
                    icon={Database}
                    color="blue"
                    delay={0}
                  />
                  <StatsCard
                    title="Missing Values"
                    value={results.totalMissing.toLocaleString()}
                    subtitle={`${results.missingPercentage}% of data`}
                    icon={AlertTriangle}
                    color={results.totalMissing > 10 ? 'red' : 'yellow'}
                    delay={0.1}
                  />
                  <StatsCard
                    title="Anomalies"
                    value={results.totalAnomalies.toLocaleString()}
                    subtitle={`${results.anomalyPercentage}% of data`}
                    icon={Activity}
                    color={results.totalAnomalies > 10 ? 'red' : results.totalAnomalies > 0 ? 'yellow' : 'green'}
                    delay={0.2}
                  />
                  <StatsCard
                    title="Missing Percentage"
                    value={`${results.missingPercentage}%`}
                    subtitle="Data Completeness"
                    icon={Percent}
                    color={parseFloat(results.missingPercentage) > 10 ? 'red' : 'green'}
                    delay={0.3}
                  />
                  <StatsCard
                    title="Anomaly Rate"
                    value={`${results.anomalyPercentage}%`}
                    subtitle="Data Quality Issues"
                    icon={AlertTriangle}
                    color={parseFloat(results.anomalyPercentage) > 10 ? 'red' : parseFloat(results.anomalyPercentage) > 0 ? 'yellow' : 'green'}
                    delay={0.4}
                  />
                  <StatsCard
                    title="Data Health Score"
                    value={`${results.healthScore}/100`}
                    subtitle={results.healthStatus.label}
                    icon={Shield}
                    color={results.healthStatus.color}
                    delay={0.5}
                  />
                </div>
              </div>

              {/* Missing Values Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Missing Values Analysis
                </h2>
                <MissingTable
                  missingData={results.missingGrouped}
                  totalRows={results.totalRows}
                />
              </div>

              {/* Anomalies Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-400" />
                  Anomalies Detected
                  <span className="ml-2 px-2 py-1 rounded-full bg-rose-500/20 text-rose-400 text-sm">
                    {results.totalAnomalies}
                  </span>
                </h2>
                {results.parsedAnomalies.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 backdrop-blur-md border border-emerald-500/20 p-8 text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-emerald-400 mb-2">No Anomalies Found</h3>
                    <p className="text-gray-400">Your dataset passed all anomaly checks.</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.parsedAnomalies.map((anomaly, index) => (
                      <AnomalyCard key={index} anomaly={anomaly} index={index} />
                    ))}
                  </div>
                )}
              </div>

              {/* Download Report */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-8 border-t border-white/10"
              >
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">Download Report</h3>
                      <p className="text-gray-400 text-sm">Get a detailed markdown report of the analysis</p>
                    </div>
                    <DownloadButton
                      reportContent={results.report}
                      filename={`report-${results.filename.replace('.csv', '')}.md`}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              title: 'Real-time Detection',
              description: 'Instant anomaly detection using advanced ML algorithms',
              icon: '⚡',
            },
            {
              title: 'Comprehensive Analysis',
              description: 'Deep insights into missing values, outliers, and data patterns',
              icon: '🔍',
            },
            {
              title: 'Export Reports',
              description: 'Download detailed markdown reports for documentation',
              icon: '📊',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card rounded-2xl p-6 hover:neon-border transition-all duration-300"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-gray-500">
            Autonomous Data Pipeline Monitor v1.0 • Built with React, FastAPI & Framer Motion
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Home;
