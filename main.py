import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

# Define response models
class FactClaim(BaseModel):
    claim: str
    verdict: str
    explanation: str

class Perspective(BaseModel):
    stakeholder: str
    viewpoint: str

class BiasAnalysis(BaseModel):
    objectivity_score: int
    summary: str
    key_claims: list[FactClaim]
    perspectives: list[Perspective]

app = FastAPI(title="Bias Checker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ArticleRequest(BaseModel):
    text: str
    api_key: str

@app.post("/analyze", response_model=BiasAnalysis)
async def analyze_article(request: ArticleRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="No text provided.")

    client = genai.Client(api_key=request.api_key)

    prompt = f"""
    Analyze the following news article as an independent, critical journalistic auditor.
    
    Article Text:
    {request.text}
    """

    models_to_try = ['gemini-3.8-flash']

    # Try max. 4 times during a temporary peak (503/429)
    for model_name in models_to_try:
        for attempt in range(4):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=BiasAnalysis,
                        temperature=0.1,
                    ),
                )
                return BiasAnalysis.model_validate_json(response.text)
            except Exception as e:
                error_msg = str(e)
                print(f"--> REAL ERROR ({model_name}, attempt {attempt + 1}): {error_msg}")
                
                # Wait time (3s, 6s, 9s, 12s)
                if any(err in error_msg for err in ["503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED"]):
                    await asyncio.sleep(3 * (attempt + 1))
                    continue
                
                if "404" in error_msg or "NOT_FOUND" in error_msg:
                    break
                
                raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(status_code=503, detail="Gemini API is currently unreachable or servers are overloaded.")