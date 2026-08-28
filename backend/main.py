import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

app = FastAPI(title="ClipFlow AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise RuntimeError("GROQ_API_KEY belum dipasang di Render")

client = Groq(api_key=api_key)


class PromptRequest(BaseModel):
    prompt: str


@app.get("/")
def home():
    return {
        "status": "online",
        "service": "ClipFlow AI",
        "ai": "Groq"
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "ai": "Groq"
    }


@app.post("/enhance")
def enhance(req: PromptRequest):

    if not req.prompt.strip():
        raise HTTPException(
            status_code=400,
            detail="Prompt tidak boleh kosong"
        )

    system_prompt = """
You are ClipFlow AI Director.

Turn the user's simple idea into a professional
cinematic AI video prompt.

Improve:
- subject
- environment
- action
- camera movement
- lens
- lighting
- atmosphere
- composition
- depth
- cinematic style
- realistic motion

Keep the original idea.
Do not invent unrelated characters or objects.

Return ONLY the final video prompt.
"""

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": req.prompt
                }
            ],
            temperature=0.7,
            max_completion_tokens=1000
        )

        result = response.choices[0].message.content

        return {
            "ok": True,
            "prompt": result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
  )
