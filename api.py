"""
FastAPI Backend for Autonomous Data Pipeline Monitor
"""
import os
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path

# Import the core logic functions from main.py
from main import validate_data, detect_anomalies, generate_report

app = FastAPI(
    title="Autonomous Data Pipeline Monitor API",
    description="API for data validation and anomaly detection",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Global variable to store the latest report path
latest_report_path = None


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file, process it, and return validation results.
    """
    global latest_report_path
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400, 
            detail="Only CSV files are allowed"
        )
    
    try:
        # Save uploaded file to uploads directory
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Temporarily update the global CSV_FILE in main.py
        import main
        original_csv_file = main.CSV_FILE
        main.CSV_FILE = str(file_path)
        
        # Run the core logic
        validation_result = validate_data()
        anomaly_result = detect_anomalies()
        
        # Generate report
        report_content = generate_report(validation_result, anomaly_result)
        
        # Store report path
        latest_report_path = main.OUTPUT_FILE
        
        # Restore original CSV_FILE
        main.CSV_FILE = original_csv_file
        
        # Parse results for JSON response
        missing_values_data = parse_missing_values(validation_result)
        anomalies_data = parse_anomalies(anomaly_result)
        
        # Calculate summary statistics
        import pandas as pd
        df = pd.read_csv(file_path)
        total_rows = len(df)
        total_columns = len(df.columns)
        total_cells = total_rows * total_columns
        
        # Calculate health score
        health_score = calculate_health_score(
            missing_values_data["count"], 
            anomalies_data["count"], 
            total_rows, 
            total_cells
        )
        
        return {
            "success": True,
            "message": "File processed successfully",
            "missing_values": missing_values_data,
            "anomalies": anomalies_data,
            "summary": {
                "totalRows": total_rows,
                "totalColumns": total_columns,
                "totalCells": total_cells,
                "healthScore": health_score,
            },
            "report": report_content,
            "filename": file.filename
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing file: {str(e)}"
        )


@app.get("/download")
async def download_report():
    """
    Download the generated markdown report.
    """
    global latest_report_path
    
    # Default to the standard output file if no report generated yet
    report_file = latest_report_path or "pipeline_alert.md"
    
    if not os.path.exists(report_file):
        raise HTTPException(
            status_code=404, 
            detail="No report available. Please upload and process a file first."
        )
    
    return FileResponse(
        path=report_file,
        filename="pipeline_alert.md",
        media_type="text/markdown"
    )


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "service": "Autonomous Data Pipeline Monitor"}


def parse_missing_values(validation_result):
    """Parse validation results into structured format."""
    details = []
    
    for item in validation_result:
        if "Missing value" in item or "Row" in item:
            # Parse format: "Row X: Missing value in 'column'"
            try:
                parts = item.split(":")
                if len(parts) >= 2:
                    row_part = parts[0].strip()
                    col_part = parts[1].strip()
                    
                    # Extract row number
                    row_num = int(row_part.replace("Row", "").strip())
                    
                    # Extract column name
                    if "in" in col_part and "'" in col_part:
                        col_start = col_part.find("'") + 1
                        col_end = col_part.find("'", col_start)
                        column = col_part[col_start:col_end] if col_end > col_start else "unknown"
                    else:
                        column = "unknown"
                    
                    details.append({
                        "row": row_num,
                        "column": column,
                        "type": "Missing Value"
                    })
            except (ValueError, IndexError):
                continue
    
    # Group by column for summary
    column_counts = {}
    for d in details:
        col = d["column"]
        column_counts[col] = column_counts.get(col, 0) + 1
    
    summary_details = [
        {"column": col, "count": count, "percentage": 0}  # Percentage calculated later
        for col, count in column_counts.items()
    ]
    
    return {
        "count": len(details),
        "details": summary_details[:10]  # Limit to first 10 for display
    }


def parse_anomalies(anomaly_result):
    """Parse anomaly results into structured format."""
    details = []
    
    for item in anomaly_result:
        if "Row" in item and ("Negative" in item or "High" in item or "anomaly" in item.lower()):
            try:
                parts = item.split(":")
                if len(parts) >= 2:
                    row_part = parts[0].strip()
                    desc_part = parts[1].strip()
                    
                    # Extract row number
                    row_num = int(row_part.replace("Row", "").strip())
                    
                    # Determine type
                    if "Negative" in desc_part:
                        anomaly_type = "Negative Value"
                    elif "High" in desc_part:
                        anomaly_type = "High Value"
                    else:
                        anomaly_type = "Anomaly"
                    
                    # Extract value (inside parentheses if present)
                    value = "unknown"
                    if "(" in desc_part and ")" in desc_part:
                        val_start = desc_part.find("(") + 1
                        val_end = desc_part.find(")")
                        value = desc_part[val_start:val_end]
                    
                    details.append({
                        "row": row_num,
                        "type": anomaly_type,
                        "column": "sales",  # Default column for sales anomalies
                        "value": value,
                        "description": desc_part
                    })
            except (ValueError, IndexError):
                continue
    
    return {
        "count": len(details),
        "details": details[:10]  # Limit to first 10 for display
    }


def calculate_health_score(missing_count, anomaly_count, total_rows, total_cells):
    """Calculate a health score based on data quality."""
    if total_cells == 0:
        return 100
    
    # Calculate penalties
    missing_penalty = (missing_count / total_cells) * 50 if total_cells > 0 else 0
    anomaly_penalty = (anomaly_count / total_rows) * 50 if total_rows > 0 else 0
    
    score = max(0, min(100, 100 - missing_penalty - anomaly_penalty))
    return round(score)

@app.get("/")
def home():
    return {
        "message": "Autonomous Data Pipeline Monitor API running",
        "docs": "http://localhost:8000/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
