"""Backend tests for Expedition Guardian API (iteration 2).

Covers auth, expedition planning (Gemini), gear scaling, expedition CRUD,
phrases and legacy briefing/checklist endpoints.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://offline-prepared.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@expedition.com"
ADMIN_PASSWORD = "Guardian2026!"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------- Auth ----------
def test_auth_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
    assert r.status_code == 401


def test_auth_me(auth_headers):
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"


# ---------- Expedition plan (Gemini) ----------
@pytest.fixture(scope="session")
def plan_small(auth_headers):
    body = {
        "destination": "Ladakh, India",
        "start_date": "2026-07-10",
        "end_date": "2026-07-16",
        "member_count": 2,
        "members": [
            {"name": "Alice", "role": "leader", "experience": "advanced"},
            {"name": "Bob", "role": "medic", "experience": "intermediate"},
        ],
        "experience_level": "intermediate",
        "trip_type": "trek",
        "notes": "test small team",
    }
    r = requests.post(f"{API}/expedition/plan", headers=auth_headers, json=body, timeout=120)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def plan_large(auth_headers):
    body = {
        "destination": "Ladakh, India",
        "start_date": "2026-07-10",
        "end_date": "2026-07-16",
        "member_count": 10,
        "members": [{"name": f"M{i}", "role": "member", "experience": "intermediate"} for i in range(10)],
        "experience_level": "intermediate",
        "trip_type": "trek",
        "notes": "test large team",
    }
    r = requests.post(f"{API}/expedition/plan", headers=auth_headers, json=body, timeout=120)
    assert r.status_code == 200, r.text
    return r.json()


def test_plan_structure(plan_small):
    p = plan_small
    for key in ["destination", "summary", "weather_forecast", "terrain", "navigation",
                "communication", "language", "water_sources", "medical_hazards",
                "group_risk", "timeline", "gear", "insights", "params"]:
        assert key in p, f"missing {key}"
    assert isinstance(p["gear"], list) and len(p["gear"]) > 0
    assert isinstance(p["timeline"], list) and len(p["timeline"]) > 0
    assert isinstance(p["insights"], list) and len(p["insights"]) > 0
    assert isinstance(p["weather_forecast"].get("periods"), list)
    assert p["navigation"].get("difficulty_score") is not None


def test_plan_gear_has_required_and_basis(plan_small):
    for g in plan_small["gear"]:
        assert "required_qty" in g and g["required_qty"] is not None
        assert "scaling_basis" in g and isinstance(g["scaling_basis"], str)
        assert g["scaling_basis"]  # non-empty


def test_gear_scales_with_members(plan_small, plan_large):
    """Consumable required_qty should scale up with member count."""
    def cons_sum(plan):
        return sum(g["required_qty"] for g in plan["gear"] if g.get("consumable"))
    s = cons_sum(plan_small)
    l = cons_sum(plan_large)
    assert l > s, f"large team consumables ({l}) should exceed small team ({s})"


def test_gear_scaling_basis_mentions_members(plan_large):
    days = plan_large["params"]["duration_days"]
    members = plan_large["params"]["member_count"]
    joined = " ".join(g["scaling_basis"] for g in plan_large["gear"])
    assert str(members) in joined
    # daily items should reference days
    daily_items = [g for g in plan_large["gear"] if g.get("daily_per_person")]
    if daily_items:
        assert any(str(days) in g["scaling_basis"] for g in daily_items)


# ---------- Expedition CRUD ----------
def test_expedition_save_list_delete(auth_headers, plan_small):
    r = requests.post(f"{API}/expeditions", headers=auth_headers,
                      json={"plan": plan_small, "phrases": None}, timeout=30)
    assert r.status_code == 200, r.text
    saved = r.json()
    assert "id" in saved and "_id" not in saved
    exp_id = saved["id"]

    r2 = requests.get(f"{API}/expeditions", headers=auth_headers, timeout=30)
    assert r2.status_code == 200
    ids = [e["id"] for e in r2.json()["expeditions"]]
    assert exp_id in ids

    r3 = requests.delete(f"{API}/expeditions/{exp_id}", headers=auth_headers, timeout=30)
    assert r3.status_code == 200


# ---------- Phrases ----------
def test_phrases(auth_headers):
    r = requests.post(f"{API}/phrases", headers=auth_headers,
                      json={"destination": "Ladakh, India", "language": "Ladakhi"}, timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["emergency", "navigation", "medical"]:
        assert isinstance(d.get(k), list) and len(d[k]) > 0


# ---------- Legacy endpoints still healthy ----------
def test_legacy_checklist_template(auth_headers):
    r = requests.get(f"{API}/checklist/template", headers=auth_headers, timeout=15)
    assert r.status_code == 200
    assert "categories" in r.json()


def test_unauthenticated_blocked():
    r = requests.get(f"{API}/auth/me", timeout=15)
    assert r.status_code == 401
