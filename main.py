import os, time, base64
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from google import genai
from google.genai import types

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY belum diatur")

client = genai.Client(api_key=API_KEY)
app = FastAPI(title="ClipFlow AI API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

OUT = Path("outputs")
OUT.mkdir(exist_ok=True)

class GenerateRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "9:16"
    resolution: str = "720p"
    mode: str = "fast"

def enhance_prompt(p: str) -> str:
    return f"""Create a polished cinematic video based on this idea:
{p}
Use professional composition, realistic lighting, coherent motion, detailed environment,
natural camera movement, strong subject continuity, and a clear beginning-to-end visual action.
Do not add text, logos, watermarks, or unrelated objects."""

@app.get("/health")
def health():
    return {"ok": True, "service": "ClipFlow AI"}

@app.post("/enhance")
def enhance(req: GenerateRequest):
    return {"prompt": enhance_prompt(req.prompt)}

@app.post("/generate")
def generate(req: GenerateRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "Prompt kosong")

    model = "veo-3.1-generate-preview"
    # Fast/Quality is intentionally kept as a product-level switch.
    # The API model can be changed here later without changing the Android app.
    final_prompt = enhance_prompt(req.prompt)

    try:
        op = client.models.generate_videos(
            model=model,
            prompt=final_prompt,
            config=types.GenerateVideosConfig(
                aspect_ratio=req.aspect_ratio,
                resolution=req.resolution,
            ),
        )

        while not op.done:
            time.sleep(5)
            op = client.operations.get(op)

        if not op.response or not op.response.generated_videos:
            raise HTTPException(500, "AI tidak mengembalikan video")

        video = op.response.generated_videos[0].video
        filename = f"clip_{int(time.time())}.mp4"
        path = OUT / filename
        client.files.download(file=video)
        video.save(str(path))

        return {"ok": True, "filename": filename, "url": f"/video/{filename}"}

    except Exception as e:
        raise HTTPException(500, f"Generation error: {e}")

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    safe = Path(file.filename or "upload.bin").name
    target = OUT / f"upload_{int(time.time())}_{safe}"
    target.write_bytes(await file.read())
    return {"ok": True, "filename": target.name, "url": f"/video/{target.name}"}

@app.get("/video/{filename}")
def video(filename: str):
    path = OUT / Path(filename).name
    if not path.exists():
        raise HTTPException(404, "File tidak ditemukan")
    return FileResponse(path, media_type="video/mp4")
