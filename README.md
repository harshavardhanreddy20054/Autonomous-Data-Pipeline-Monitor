# Autonomous Data Pipeline Monitor

A modern, full-stack data validation and anomaly detection system built with **React**, **FastAPI**, and **Tailwind CSS**. Features a beautiful glassmorphism UI with real-time data analysis capabilities.

![Data Pipeline Monitor](https://img.shields.io/badge/React-18-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green) ![Python](https://img.shields.io/badge/Python-3.8+-yellow)

## Features

- **CSV Data Validation**: Upload and validate CSV files for missing values and anomalies
- **Anomaly Detection**: Automatically detects negative values and extreme outliers
- **Interactive Dashboard**: Real-time metrics with health scoring
- **Glassmorphism UI**: Modern dark theme with blur effects and animations
- **Report Generation**: Download detailed markdown reports
- **Responsive Design**: Works on desktop and mobile devices

## Screenshots

- Dashboard with data metrics and health score
- Missing values analysis table
- Anomaly detection cards
- Dark theme with gradient backgrounds

## Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **Pandas** - Data manipulation and analysis
- **CrewAI** - AI agent framework (optional)
- **Python-multipart** - File upload handling

### Frontend
- **React 18** - UI library with hooks
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### 1. Clone and Setup

```bash
cd "d:\Capgemani\Primary Track-Data Validation\Practice\Agenitic AI\team"
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the backend server
python main.py
```

Backend runs at: `http://localhost:8000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 4. Open in Browser

Navigate to `http://localhost:5173` and upload a CSV file to begin analysis.

## Usage

1. **Upload CSV**: Click the upload icon or drag-and-drop a CSV file
2. **Analyze**: Click "Upload & Analyze" to process the data
3. **View Results**: 
   - Dashboard shows total rows, missing values, anomalies, health score
   - Missing values table displays columns with missing data
   - Anomaly cards show negative values and extreme outliers
4. **Download Report**: Click the download button to save markdown report

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload CSV file for analysis |
| `/download` | GET | Download generated markdown report |
| `/health` | GET | Health check endpoint |

### Sample API Response

```json
{
  "missing_values": [
    "Row 2: Missing value in 'sales'",
    "Row 5: Missing value in 'name'"
  ],
  "anomalies": [
    "Row 4: Negative value in 'sales' (-100.0)",
    "Row 6: Extreme value in 'sales' (15000.0)"
  ],
  "total_rows": 120,
  "report": "# 🚨 Data Pipeline Alert Report\n\n..."
}
```

## Project Structure

```
team/
├── main.py                 # FastAPI backend
├── requirements.txt        # Python dependencies
├── GUIDE.txt              # Detailed setup guide
├── file.csv               # Sample test data
├── uploads/               # Uploaded files (auto-created)
├── pipeline_alert.md      # Generated reports (auto-created)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── components/
        │   ├── FileUpload.jsx
        │   ├── StatsCard.jsx
        │   ├── MissingTable.jsx
        │   ├── AnomalyCard.jsx
        │   └── DownloadButton.jsx
        ├── pages/
        │   └── Home.jsx
        └── index.css
```

## Data Health Score

The health score is calculated using the formula:

```
score = 100 - ((missing_values + anomalies) / total_rows * 100)
```

- **Green (80-100)**: Good data quality
- **Yellow (60-79)**: Moderate issues
- **Red (0-59)**: Poor data quality, attention needed

## Customization

### Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
```

Note: The system works without an API key for basic validation.

### Port Configuration

- Backend: Edit `main.py` line 304 - change `port=8000`
- Frontend: Edit `vite.config.js` to modify the dev server port

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure backend is running on port 8000 |
| Port already in use | Frontend auto-switches to next available port |
| Module not found | Run `pip install -r requirements.txt` or `npm install` |
| File upload fails | Check that `uploads/` directory exists and is writable |

## Sample Data

A sample CSV file is included for testing:

```csv
id,name,age,city,sales,profit
1,Ravi,25,Hyderabad,500,50
2,Sita,30,Delhi,,60
3,John,28,Mumbai,300,40
4,Anil,35,Chennai,-100,20
```

## Development

### Backend Development

The backend uses FastAPI with automatic reloading disabled. To add new endpoints, edit `main.py` and add new `@app.route()` decorated functions.

### Frontend Development

Components are in `frontend/src/components/`:
- `StatsCard.jsx` - Metric display cards
- `MissingTable.jsx` - Missing values table
- `AnomalyCard.jsx` - Anomaly detail cards
- `FileUpload.jsx` - File upload area
- `DownloadButton.jsx` - Report download button

## License

MIT License - feel free to use and modify.

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI powered by [Tailwind CSS](https://tailwindcss.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)

---

**Created**: April 2025  
**Version**: 1.0.0
