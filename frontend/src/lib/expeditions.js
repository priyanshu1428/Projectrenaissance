import { STORES, idbAll, idbGet, idbPut, idbDelete } from "./idb";

export async function listExpeditions() {
  const rows = (await idbAll(STORES.expeditions)) || [];
  return rows.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
}

export async function saveExpedition({ plan, phrases, id }) {
  const record = {
    id: id || `exp-${Date.now()}`,
    savedAt: new Date().toISOString(),
    plan,
    phrases: phrases || null,
  };
  await idbPut(STORES.expeditions, record);
  return record;
}

export const deleteExpedition = (id) => idbDelete(STORES.expeditions, id);

export const getGearState = (id) => idbGet(STORES.gear, id);

export const putGearState = (id, items) => idbPut(STORES.gear, { id, items, at: Date.now() });

export const CATEGORY_LABELS = {
  navigation: "Navigation",
  water: "Water",
  communication: "Communication",
  medical: "First Aid",
  shelter: "Shelter",
  food: "Food & Fuel",
  clothing: "Clothing",
  other: "Other",
};

export function computeReadiness(gear, items) {
  const byCat = {};
  let weight = 0;
  let score = 0;
  (gear || []).forEach((g) => {
    const st = items[g.id] || { packed: 0 };
    const req = g.required_qty || 1;
    const ratio = Math.min(1, (st.packed || 0) / req);
    const w = g.critical ? 2 : 1;
    const cat = g.category || "other";
    if (!byCat[cat]) byCat[cat] = { weight: 0, score: 0, items: 0, ready: 0 };
    byCat[cat].weight += w;
    byCat[cat].score += ratio * w;
    byCat[cat].items += 1;
    if (ratio >= 1) byCat[cat].ready += 1;
    weight += w;
    score += ratio * w;
  });
  const categories = Object.entries(byCat).map(([id, v]) => ({
    id,
    name: CATEGORY_LABELS[id] || id,
    percent: v.weight ? Math.round((v.score / v.weight) * 100) : 0,
    ready: v.ready,
    items: v.items,
  }));
  return { overall: weight ? Math.round((score / weight) * 100) : 0, categories };
}

export function daysOfSupply(gear, items, members) {
  const rows = (gear || [])
    .filter((g) => g.consumable && g.daily_per_person && members > 0)
    .map((g) => {
      const st = items[g.id] || { packed: 0, consumed: 0 };
      const available = Math.max(0, (st.packed || 0) - (st.consumed || 0));
      const burn = g.daily_per_person * members;
      return {
        id: g.id,
        name: g.name,
        unit: g.unit,
        available: Math.round(available * 100) / 100,
        burn: Math.round(burn * 100) / 100,
        days: burn ? Math.round((available / burn) * 10) / 10 : 0,
      };
    })
    .sort((a, b) => a.days - b.days);
  return rows;
}
