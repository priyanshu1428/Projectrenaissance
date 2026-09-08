from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import json
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---------------------- Setup ---------------------- #
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("expedition")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Expedition Guardian API")
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
    }


# ---------------------- Models ---------------------- #
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class DestinationIn(BaseModel):
    destination: str = Field(min_length=2)


# ---------------------- Auth Routes ---------------------- #
def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )


@api_router.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "name": body.name,
        "password_hash": hash_password(body.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    token = create_access_token(str(result.inserted_id), email)
    _set_auth_cookie(response, token)
    return {"id": str(result.inserted_id), "email": email, "name": body.name, "role": "user", "token": token}


@api_router.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user["_id"]), email)
    _set_auth_cookie(response, token)
    return {
        "id": str(user["_id"]),
        "email": email,
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
        "token": token,
    }


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------------------- Gemini helpers ---------------------- #
def _extract_json(text: str) -> dict:
    """Extract first JSON object from LLM text."""
    # try direct
    try:
        return json.loads(text)
    except Exception:
        pass
    # find first { ... } block
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return {}


async def _gemini_generate(session_id: str, system: str, prompt: str) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("gemini", "gemini-3-flash-preview")
    resp = await chat.send_message(UserMessage(text=prompt))
    if isinstance(resp, str):
        return resp
    # some responses may be objects
    return str(resp)


# ---------------------- Destination Briefing ---------------------- #
BRIEFING_SYSTEM = (
    "You are an expert wilderness expedition briefer. Provide accurate, concise, "
    "field-ready intelligence for the given destination. ALWAYS respond with a single JSON object only, "
    "no markdown fences, no commentary."
)

BRIEFING_PROMPT = """Destination: {destination}

Return a JSON object with this exact schema:
{{
  "destination": "resolved location name",
  "region": "country / region",
  "coordinates": {{"lat": <float>, "lng": <float>}},
  "weather": {{
    "current_season": "short label",
    "temperature_range": "e.g. -5C to 12C",
    "conditions": "short paragraph"
  }},
  "terrain": {{
    "type": "mountain / desert / jungle / etc",
    "elevation": "e.g. 800m - 2400m",
    "description": "2-3 sentences"
  }},
  "water_sources": [
    {{"name": "source name", "reliability": "high|medium|low", "notes": "purification advice"}}
  ],
  "medical_hazards": [
    {{"name": "hazard", "severity": "low|medium|high", "advice": "one line"}}
  ],
  "language": {{
    "primary": "language name",
    "code": "ISO 639-1 code",
    "dialect_note": "regional note"
  }}
}}

Fill each field. Include 3-4 water sources and 3-4 medical hazards. Return only the JSON."""


@api_router.post("/briefing")
async def create_briefing(body: DestinationIn, user: dict = Depends(get_current_user)):
    dest = body.destination.strip()
    try:
        text = await _gemini_generate(
            session_id=f"briefing-{user['id']}-{dest[:20]}",
            system=BRIEFING_SYSTEM,
            prompt=BRIEFING_PROMPT.format(destination=dest),
        )
        data = _extract_json(text)
        if not data or "weather" not in data:
            raise HTTPException(status_code=502, detail="Could not parse briefing")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("briefing error")
        raise HTTPException(status_code=500, detail=f"Briefing failed: {e}")


# ---------------------- Language Phrase Pack ---------------------- #
PHRASE_SYSTEM = (
    "You are an expert linguist and survival translator. Generate accurate offline "
    "phrase packs for expeditions. ALWAYS respond with a single JSON object only, no markdown."
)

PHRASE_PROMPT = """Destination: {destination}
Primary language: {language}

Generate an offline emergency phrase pack. Return this exact JSON schema:
{{
  "language": "{language}",
  "code": "iso code",
  "emergency": [
    {{"en": "English phrase", "local": "local script", "phonetic": "roman phonetic"}}
  ],
  "navigation": [
    {{"en": "...", "local": "...", "phonetic": "..."}}
  ],
  "medical": [
    {{"en": "...", "local": "...", "phonetic": "..."}}
  ]
}}

Include 6 phrases per category. Phrases should be practical for wilderness/expedition use (asking for help, water, directions, injuries, etc). Return only JSON."""


class PhraseIn(BaseModel):
    destination: str
    language: str


@api_router.post("/phrases")
async def create_phrases(body: PhraseIn, user: dict = Depends(get_current_user)):
    try:
        text = await _gemini_generate(
            session_id=f"phrase-{user['id']}-{body.destination[:20]}",
            system=PHRASE_SYSTEM,
            prompt=PHRASE_PROMPT.format(destination=body.destination, language=body.language),
        )
        data = _extract_json(text)
        if not data or "emergency" not in data:
            raise HTTPException(status_code=502, detail="Could not parse phrase pack")
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("phrase error")
        raise HTTPException(status_code=500, detail=f"Phrase pack failed: {e}")


# ---------------------- Checklist Template ---------------------- #
@api_router.get("/checklist/template")
async def checklist_template(user: dict = Depends(get_current_user)):
    return {
        "categories": [
            {
                "id": "navigation",
                "name": "Navigation",
                "items": [
                    {"id": "nav-1", "text": "Download offline maps for the region"},
                    {"id": "nav-2", "text": "Pack a physical compass & backup GPS"},
                    {"id": "nav-3", "text": "Mark checkpoints and rally points"},
                    {"id": "nav-4", "text": "Study elevation profile & escape routes"},
                ],
            },
            {
                "id": "water",
                "name": "Water",
                "items": [
                    {"id": "wtr-1", "text": "Acquire water purification tablets"},
                    {"id": "wtr-2", "text": "Carry min. 3L capacity hydration"},
                    {"id": "wtr-3", "text": "Map known water sources"},
                    {"id": "wtr-4", "text": "Pack ceramic or hollow-fiber filter"},
                ],
            },
            {
                "id": "communication",
                "name": "Communication",
                "items": [
                    {"id": "com-1", "text": "Charge satellite messenger / PLB"},
                    {"id": "com-2", "text": "Share itinerary with base contact"},
                    {"id": "com-3", "text": "Pack spare power bank"},
                    {"id": "com-4", "text": "Test whistle & signal mirror"},
                ],
            },
            {
                "id": "medical",
                "name": "First Aid",
                "items": [
                    {"id": "med-1", "text": "Trauma kit with tourniquet & gauze"},
                    {"id": "med-2", "text": "Pack personal medications"},
                    {"id": "med-3", "text": "Insect repellent & anti-venom info"},
                    {"id": "med-4", "text": "Sunscreen & lip protection"},
                ],
            },
        ]
    }


# ---------------------- Startup ---------------------- #
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    # seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@expedition.com").lower()
    admin_pass = os.environ.get("ADMIN_PASSWORD", "Guardian2026!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_pass),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user: {admin_email}")


@app.on_event("shutdown")
async def shutdown():
    client.close()


@api_router.get("/")
async def root():
    return {"service": "Expedition Guardian", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
