const VAULT_KEY = "expedition_guardian_vault";

export function readVault() {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveVaultEntry(entry) {
  const list = readVault();
  const id = `vault-${Date.now()}`;
  const record = {
    id,
    savedAt: new Date().toISOString(),
    ...entry,
  };
  list.unshift(record);
  localStorage.setItem(VAULT_KEY, JSON.stringify(list));
  return record;
}

export function deleteVaultEntry(id) {
  const list = readVault().filter((r) => r.id !== id);
  localStorage.setItem(VAULT_KEY, JSON.stringify(list));
  return list;
}
