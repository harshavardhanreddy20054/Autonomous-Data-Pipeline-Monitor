import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X } from 'lucide-react';

const FileUpload = ({ onFileSelect, onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        alert('Please upload a CSV file only');
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.csv')) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        alert('Please upload a CSV file only');
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const clearFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full"
    >
      <div
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10 neon-border'
            : 'border-white/20 bg-white/5 hover:border-white/40'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
          disabled={isLoading}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 cursor-pointer hover:from-blue-500/30 hover:to-purple-500/30 transition-all"
              onClick={handleButtonClick}
            >
              <Upload className="h-8 w-8 text-blue-400" />
            </motion.div>
            
            <div className="space-y-2">
              <p className="text-lg font-medium text-white">
                Drop your CSV file here, or{' '}
                <span
                  onClick={handleButtonClick}
                  className="cursor-pointer text-blue-400 hover:text-blue-300 transition-colors"
                >
                  browse
                </span>
              </p>
              <p className="text-sm text-gray-400">Only CSV files are supported</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <File className="h-6 w-6 text-blue-400" />
              <div className="text-left">
                <p className="font-medium text-white truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!isLoading && (
                <button
                  onClick={clearFile}
                  className="ml-2 rounded-full p-1 hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {selectedFile && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onUpload && onUpload(selectedFile)}
          disabled={isLoading}
          className={`mt-6 w-full rounded-xl py-4 font-semibold text-white transition-all duration-300 ${
            isLoading
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 neon-glow'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Processing...</span>
            </div>
          ) : (
            'Upload & Analyze'
          )}
        </motion.button>
      )}
    </motion.div>
  );
};

export default FileUpload;
