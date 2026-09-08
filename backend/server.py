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


# ---------------------- Expedition Planning (AI curated) ---------------------- #
class MemberIn(BaseModel):
    name: str = ""
    role: str = ""
    experience: str = ""


class ExpeditionIn(BaseModel):
    destination: str = Field(min_length=2)
    start_date: str
    end_date: str
    member_count: int = Field(ge=1, le=200)
    members: List[MemberIn] = []
    experience_level: str = "intermediate"
    trip_type: str = "trek"
    notes: str = ""


PLAN_SYSTEM = (
    "You are a senior expedition planner, wilderness medic and logistics officer. "
    "You produce field-ready, quantitatively scaled expedition dossiers. "
    "ALWAYS respond with a single valid JSON object only — no markdown fences, no commentary."
)

PLAN_PROMPT = """Plan an expedition with these parameters:
Destination: {destination}
Start date: {start_date}
End date: {end_date}
Duration: {days} days
Team size: {member_count} people
Team roster: {roster}
Overall team experience level: {experience_level}
Trip type: {trip_type}
Extra notes: {notes}

Analyse the place, the exact calendar window (season, predicted weather), the team size and its experience,
then return this exact JSON schema:

{{
  "destination": "resolved location name",
  "region": "country / region",
  "coordinates": {{"lat": <float>, "lng": <float>}},
  "summary": "3-4 sentence field overview specific to this team, this size and these dates",
  "weather_forecast": {{
    "season": "season label for those dates",
    "outlook": "2-3 sentence predicted weather for that exact window",
    "temperature_range": "e.g. -6C to 14C",
    "precipitation": "short line",
    "daylight": "e.g. sunrise 06:10 / sunset 18:40, ~12h usable light",
    "periods": [
      {{"label": "Days 1-2", "conditions": "short", "temp_high": "12C", "temp_low": "1C", "risk": "low|medium|high"}}
    ]
  }},
  "terrain": {{"type": "...", "elevation": "...", "description": "2-3 sentences"}},
  "navigation": {{
    "difficulty_score": <int 1-10>,
    "difficulty_label": "Easy|Moderate|Hard|Severe",
    "reasons": ["3-4 short reasons tied to terrain/season/team size"],
    "offline_map_advice": "one paragraph on what to cache and which zoom levels / landmarks matter"
  }},
  "communication": {{
    "signal_outlook": "cell / satellite coverage reality for the area",
    "checkin_protocol": "concrete check-in schedule for a team of {member_count}",
    "recommended_devices": [{{"item": "device", "quantity": <int>, "why": "one line"}}]
  }},
  "language": {{
    "primary": "language name",
    "code": "ISO 639-1 code",
    "difficulty_score": <int 1-10>,
    "difficulty_label": "Easy|Moderate|Hard",
    "notes": "script, English penetration, dialect note"
  }},
  "water_sources": [{{"name": "...", "reliability": "high|medium|low", "notes": "purification advice"}}],
  "medical_hazards": [{{"name": "...", "severity": "low|medium|high", "advice": "one line"}}],
  "group_risk": {{
    "level": "low|medium|high",
    "factors": ["3-4 risks specific to a team of {member_count} at {experience_level} level"],
    "mitigation": ["3-4 concrete mitigations"]
  }},
  "timeline": [
    {{"day": 1, "focus": "short title", "notes": "1-2 sentences", "distance": "e.g. 12 km / +600m"}}
  ],
  "gear": [
    {{
      "category": "navigation|water|communication|medical|shelter|food|clothing",
      "name": "item name",
      "unit": "unit e.g. L, pcs, kg, sets",
      "per_person": <float or null>,
      "fixed_qty": <int or null>,
      "daily_per_person": <float or null>,
      "consumable": <bool>,
      "critical": <bool>,
      "notes": "one line on why / spec"
    }}
  ],
  "insights": [
    {{"title": "short title", "detail": "2-3 sentences of non-obvious, genuinely useful local/seasonal/team-size insight"}}
  ]
}}

RULES:
- "periods" must cover the whole trip window (3-5 entries).
- "timeline" must have exactly {days} entries (cap at 14 if longer, then summarise remaining days in the last entry).
- "gear" must contain 20-28 items spread across ALL categories. For consumables (water, food, purification tablets, fuel, batteries) set "consumable": true and give "daily_per_person" so quantities scale with team size AND trip length. For per-head equipment set "per_person" (usually 1). For shared team equipment set "fixed_qty" scaled sensibly to {member_count} people (e.g. 1 stove per 3 people, 1 tent per 2 people, 1 group trauma kit per 6).
- Exactly one of per_person / fixed_qty / daily_per_person should be non-null per item.
- Give 4-6 "insights".
- Return ONLY the JSON object."""


def _to_float(v):
    try:
        f = float(v)
        return f if f > 0 else None
    except (TypeError, ValueError):
        return None


def _duration_days(start: str, end: str) -> int:
    try:
        s = datetime.fromisoformat(start[:10])
        e = datetime.fromisoformat(end[:10])
        return max(1, (e - s).days + 1)
    except Exception:
        return 1


def _scale_gear(gear: list, members: int, days: int) -> list:
    out = []
    for i, g in enumerate(gear or []):
        if not isinstance(g, dict) or not g.get("name"):
            continue
        per_person = _to_float(g.get("per_person"))
        fixed_qty = _to_float(g.get("fixed_qty"))
        daily = _to_float(g.get("daily_per_person"))
        if daily:
            required = daily * members * days
            basis = f"{daily:g} {g.get('unit','pcs')}/person/day × {members} × {days}d"
        elif per_person:
            required = per_person * members
            basis = f"{per_person:g} {g.get('unit','pcs')}/person × {members}"
        elif fixed_qty:
            required = fixed_qty
            basis = f"{fixed_qty:g} {g.get('unit','pcs')} for the team"
        else:
            required = members
            basis = f"1 {g.get('unit','pcs')}/person × {members}"
        out.append({
            "id": f"gear-{i}",
            "category": (g.get("category") or "other").lower(),
            "name": g.get("name"),
            "unit": g.get("unit") or "pcs",
            "per_person": per_person,
            "fixed_qty": fixed_qty,
            "daily_per_person": daily,
            "consumable": bool(g.get("consumable")),
            "critical": bool(g.get("critical")),
            "notes": g.get("notes") or "",
            "required_qty": round(required, 2),
            "scaling_basis": basis,
        })
    return out


@api_router.post("/expedition/plan")
async def expedition_plan(body: ExpeditionIn, user: dict = Depends(get_current_user)):
    days = _duration_days(body.start_date, body.end_date)
    roster = ", ".join(
        [f"{m.name or 'Member'} ({m.role or 'member'}, {m.experience or 'unspecified'})" for m in body.members]
    ) or f"{body.member_count} unnamed members"
    try:
        text = await _gemini_generate(
            session_id=f"plan-{user['id']}-{body.destination[:16]}-{body.start_date}",
            system=PLAN_SYSTEM,
            prompt=PLAN_PROMPT.format(
                destination=body.destination.strip(),
                start_date=body.start_date,
                end_date=body.end_date,
                days=days,
                member_count=body.member_count,
                roster=roster,
                experience_level=body.experience_level,
                trip_type=body.trip_type,
                notes=body.notes or "none",
            ),
        )
        data = _extract_json(text)
        if not data or "weather_forecast" not in data:
            raise HTTPException(status_code=502, detail="Could not parse expedition plan")
        data["gear"] = _scale_gear(data.get("gear"), body.member_count, days)
        data["params"] = {
            "destination": body.destination.strip(),
            "start_date": body.start_date,
            "end_date": body.end_date,
            "member_count": body.member_count,
            "members": [m.model_dump() for m in body.members],
            "experience_level": body.experience_level,
            "trip_type": body.trip_type,
            "notes": body.notes,
            "duration_days": days,
        }
        data["generated_at"] = datetime.now(timezone.utc).isoformat()
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("plan error")
        raise HTTPException(status_code=500, detail=f"Expedition planning failed: {e}")


class ExpeditionSaveIn(BaseModel):
    plan: dict
    phrases: Optional[dict] = None


@api_router.post("/expeditions")
async def save_expedition(body: ExpeditionSaveIn, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["id"],
        "plan": body.plan,
        "phrases": body.phrases,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.expeditions.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@api_router.get("/expeditions")
async def list_expeditions(user: dict = Depends(get_current_user)):
    cursor = db.expeditions.find({"user_id": user["id"]}).sort("created_at", -1).limit(50)
    out = []
    async for d in cursor:
        out.append({
            "id": str(d["_id"]),
            "created_at": d.get("created_at"),
            "plan": d.get("plan"),
            "phrases": d.get("phrases"),
        })
    return {"expeditions": out}


@api_router.delete("/expeditions/{exp_id}")
async def delete_expedition(exp_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(exp_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    await db.expeditions.delete_one({"_id": oid, "user_id": user["id"]})
    return {"ok": True}


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
