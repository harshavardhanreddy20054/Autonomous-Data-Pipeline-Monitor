from dotenv import load_dotenv
load_dotenv()

from crewai import Agent, Task, Crew, Process, LLM
from crewai_tools import FileReadTool
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import os
import shutil

# ================================
# CONFIG
# ================================
llm = LLM(
    model="gemini/gemini-2.0-flash",
    api_key=os.getenv("GEMINI_API_KEY")
)

UPLOAD_FOLDER = "uploads"
OUTPUT_FILE = "pipeline_alert.md"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ================================
# FASTAPI
# ================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# UNIVERSAL CSV READER
# ================================
def read_csv_safely(file_path):
    encodings = ['utf-8', 'latin1', 'cp1252']

    for enc in encodings:
        try:
            return pd.read_csv(
                file_path,
                encoding=enc,
                on_bad_lines='skip'   # skip corrupted rows
            )
        except:
            continue

    raise Exception("Unable to read CSV file")

# ================================
# VALIDATION (GENERIC)
# ================================
def validate_data(file_path):
    df = read_csv_safely(file_path)
    issues = []

    # Handle empty file
    if df.empty:
        return ["Dataset is empty"]

    for index, row in df.iterrows():
        for col in df.columns:
            if pd.isna(row[col]) or str(row[col]).strip() == "":
                issues.append(f"Row {index + 1}: Missing value in '{col}'")

    return issues if issues else ["No missing values found ✅"]

# ================================
# ANOMALY DETECTION (SMART)
# ================================
def detect_anomalies(file_path):
    df = read_csv_safely(file_path)
    anomalies = []

    # Identify numeric columns automatically
    for col in df.columns:
        # Try converting column to numeric
        numeric_col = pd.to_numeric(df[col], errors='coerce')

        if numeric_col.notna().sum() > 0:  # column has numeric data
            for index, value in numeric_col.items():

                if pd.isna(value):
                    continue

                if value < 0:
                    anomalies.append(f"Row {index + 1}: Negative value in '{col}' ({value})")

                elif value > numeric_col.mean() * 5:
                    anomalies.append(f"Row {index + 1}: Extreme value in '{col}' ({value})")

        else:
            # Detect invalid numeric-like values
            for index, val in df[col].items():
                if isinstance(val, str) and val.strip().isdigit() is False:
                    continue  # ignore pure text columns

    return anomalies if anomalies else ["No anomalies detected ✅"]

# ================================
# REPORT
# ================================
def generate_report(validation_result, anomaly_result):
    report = "# 🚨 Data Pipeline Alert Report\n\n"

    report += "## 🔍 Missing Values\n"
    for item in validation_result:
        report += f"- {item}\n"

    report += "\n## 📊 Anomalies\n"
    for item in anomaly_result:
        report += f"- {item}\n"

    report += "\n## ✅ Summary\n"
    report += "Data validation and anomaly detection completed.\n"

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(report)

    return report

# ================================
# CREW (UNCHANGED STRUCTURE)
# ================================
def run_crew_analysis():
    read_tool = FileReadTool(file_path="pipeline_data.csv")

    validator = Agent(
        role="Data Validator",
        goal="Identify missing values",
        backstory="QA bot",
        tools=[read_tool],
        llm=llm,
        verbose=True
    )

    anomaly_detector = Agent(
        role="Anomaly Detector",
        goal="Detect anomalies",
        backstory="Pattern expert",
        llm=llm,
        verbose=True
    )

    dispatcher = Agent(
        role="Alert Dispatcher",
        goal="Generate report",
        backstory="Communicator",
        llm=llm,
        verbose=True
    )

    validation_task = Task(
        description="Check missing values",
        expected_output="List",
        agent=validator
    )

    anomaly_task = Task(
        description="Check anomalies",
        expected_output="List",
        agent=anomaly_detector
    )

    report_task = Task(
        description="Generate report",
        expected_output="Markdown",
        agent=dispatcher
    )

    crew = Crew(
        agents=[validator, anomaly_detector, dispatcher],
        tasks=[validation_task, anomaly_task, report_task],
        process=Process.sequential
    )

    return crew.kickoff()

# ================================
# API
# ================================
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = f"{UPLOAD_FOLDER}/{file.filename}"

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Read CSV for stats
        df = read_csv_safely(file_path)
        total_rows = len(df)
        total_columns = len(df.columns)
        total_cells = total_rows * total_columns

        validation_result = validate_data(file_path)
        anomaly_result = detect_anomalies(file_path)
        report = generate_report(validation_result, anomaly_result)

        # Parse into structured format
        missing_count = len([v for v in validation_result if "Missing" in v])
        anomaly_count = len([a for a in anomaly_result if "No anomalies" not in a])
        
        # Calculate health score
        health_score = 100
        if total_cells > 0:
            health_score = max(0, 100 - int((missing_count / total_cells) * 50) - int((anomaly_count / total_rows) * 50))

        # Build missing values details
        missing_details = []
        for item in validation_result:
            if "Missing" in item and "Row" in item:
                try:
                    parts = item.split(":")
                    if len(parts) >= 2:
                        col_part = parts[1].strip()
                        if "'" in col_part:
                            col_start = col_part.find("'") + 1
                            col_end = col_part.find("'", col_start)
                            col = col_part[col_start:col_end] if col_end > col_start else "unknown"
                            missing_details.append({"column": col, "count": 1, "percentage": 0})
                except:
                    pass

        # Build anomalies details
        anomaly_details = []
        for item in anomaly_result:
            if "Row" in item and ("Negative" in item or "Extreme" in item):
                try:
                    parts = item.split(":")
                    if len(parts) >= 2:
                        row_num = int(parts[0].replace("Row", "").strip())
                        desc = parts[1].strip()
                        anomaly_type = "Negative Value" if "Negative" in desc else "High Value"
                        col = "unknown"
                        if "'" in desc:
                            col_start = desc.find("'") + 1
                            col_end = desc.find("'", col_start)
                            col = desc[col_start:col_end] if col_end > col_start else "unknown"
                        val = ""
                        if "(" in desc and ")" in desc:
                            val_start = desc.find("(") + 1
                            val_end = desc.find(")")
                            val = desc[val_start:val_end]
                        anomaly_details.append({
                            "row": row_num,
                            "type": anomaly_type,
                            "column": col,
                            "value": val,
                            "description": desc
                        })
                except:
                    pass

        return {
            "success": True,
            "message": "File processed successfully",
            "summary": {
                "totalRows": total_rows,
                "totalColumns": total_columns,
                "totalCells": total_cells,
                "healthScore": health_score
            },
            "missing_values": {
                "count": missing_count,
                "details": missing_details[:10]
            },
            "anomalies": {
                "count": anomaly_count,
                "details": anomaly_details[:10]
            },
            "report": report,
            "filename": file.filename
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/download")
def download_file():
    return FileResponse(
        path=OUTPUT_FILE,
        filename="pipeline_alert.md",
        media_type="text/markdown"
    )

# ================================
# RUN
# ================================
if __name__ == "__main__":
    import uvicorn
    print("🚀 Server running at http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)