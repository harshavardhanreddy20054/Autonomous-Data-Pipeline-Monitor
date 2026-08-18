import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';

const DownloadButton = ({ reportContent, filename = 'pipeline_alert.md' }) => {
  const API_URL = 'http://localhost:8000';

  const handleDownload = async () => {
    try {
      // If reportContent is provided, download directly from client
      if (reportContent) {
        const blob = new Blob([reportContent], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }

      // Otherwise fetch from backend
      const response = await fetch(`${API_URL}/download`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pipeline_alert.md';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading report: ' + error.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="mt-8"
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDownload}
        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 font-semibold text-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 blur-xl" />
        </div>

        <span className="relative flex items-center justify-center gap-3">
          <FileText className="h-5 w-5" />
          <span>Download Report (Markdown)</span>
          <Download className="h-5 w-5 transition-transform duration-300 group-hover:translate-y-1" />
        </span>
      </motion.button>
      
      <p className="mt-3 text-center text-sm text-gray-500">
        Downloads the generated report from the backend
      </p>
    </motion.div>
  );
};

export default DownloadButton;
