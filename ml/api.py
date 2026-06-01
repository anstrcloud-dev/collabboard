from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os

app = FastAPI(title="Flowbit Priority Predictor")

# Allow requests from Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://flowbit-iota.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and vectorizer at startup
model = joblib.load("ml/model/priority_model.pkl")
vectorizer = joblib.load("ml/model/vectorizer.pkl")

class TaskInput(BaseModel):
    title: str
    description: str = ""

class PriorityOutput(BaseModel):
    priority: str
    confidence: float

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PriorityOutput)
def predict_priority(task: TaskInput):
    # Combine title and description
    text = task.title + " " + task.description
    
    # Transform using same vectorizer as training
    X = vectorizer.transform([text])
    
    # Predict priority
    priority = model.predict(X)[0]
    
    # Get confidence score
    proba = model.predict_proba(X)[0]
    confidence = float(max(proba))
    
    return PriorityOutput(priority=priority, confidence=round(confidence, 2))