import React, { useEffect, useMemo, useState } from "react";
import { Plus, Users, CalendarDays, Sparkles, CheckCircle2, AlertCircle, Minus } from "lucide-react";

const TRIP_TYPES = ["Trek / Hike", "Alpine Climb", "Desert Crossing", "Jungle Traverse", "Winter Expedition", "Kayak / River", "Cycling Tour"];
const LEVELS = ["beginner", "intermediate", "advanced", "professional"];

const Err = ({ msg, testId }) =>
  msg ? (
    <div className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "#B94040" }} data-testid={testId}>
      <AlertCircle size={12} /> {msg}
    </div>
  ) : null;

export default function ExpeditionForm({ onSubmit, loading, disabled }) {
  const today = new Date().toISOString().slice(0, 10);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [memberCount, setMemberCount] = useState(4);
  const [experience, setExperience] = useState("intermediate");
  const [tripType, setTripType] = useState(TRIP_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [members, setMembers] = useState([{ name: "", role: "", experience: "intermediate" }]);
  const [showErrors, setShowErrors] = useState(false);

  // The roster always holds exactly `memberCount` people — no more, no fewer.
  useEffect(() => {
    const n = Math.max(1, Math.min(60, Number(memberCount) || 1));
    setMembers((prev) => {
      if (prev.length === n) return prev;
      if (prev.length > n) return prev.slice(0, n);
      return [
        ...prev,
        ...Array.from({ length: n - prev.length }, () => ({ name: "", role: "", experience: "intermediate" })),
      ];
    });
  }, [memberCount]);

  const errors = useMemo(() => {
    const e = {};
    if (destination.trim().length < 2) e.destination = "¿A dónde vas? Introduce un destino.";
    if (!startDate) e.startDate = "Elige la fecha de inicio.";
    if (!endDate) e.endDate = "Elige la fecha de fin.";
    if (startDate && endDate && endDate < startDate) e.endDate = "La fecha de fin debe ser igual o posterior al inicio.";
    const n = Number(memberCount);
    if (!n || n < 1) e.memberCount = "Al menos un miembro.";
    if (n > 60) e.memberCount = "Máximo 60 miembros.";
    const incomplete = members.filter((m) => !m.name.trim() || !m.role.trim()).length;
    if (incomplete) e.members = `Cada uno de los ${members.length} miembros necesita nombre y rol (${incomplete} sin completar).`;
    return e;
  }, [destination, startDate, endDate, memberCount, members]);

  const checks = [
    { id: "destination", label: "Destino", ok: !errors.destination },
    { id: "dates", label: "Fechas", ok: !errors.startDate && !errors.endDate },
    { id: "team", label: "Tamaño del equipo", ok: !errors.memberCount },
    { id: "roster", label: "Datos de los miembros", ok: !errors.members },
  ];
  const complete = checks.filter((c) => c.ok).length;
  const valid = complete === checks.length;

  const updateMember = (i, key, value) =>
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));

  const submit = (e) => {
    e.preventDefault();
    if (!valid) {
      setShowErrors(true);
      return;
    }
    onSubmit({
      destination: destination.trim(),
      start_date: startDate,
      end_date: endDate,
      member_count: members.length,
      members,
      experience_level: experience,
      trip_type: tripType,
      notes: notes.trim(),
    });
  };

  const show = (key) => (showErrors ? errors[key] : null);

  return (
    <form onSubmit={submit} className="parchment-card p-5 sm:p-8" data-testid="expedition-setup-form" noValidate>
      <div className="caption flex items-center gap-1.5">
        <Sparkles size={12} style={{ color: "var(--gold)" }} /> Configuración de la Expedición
      </div>
      <h2 className="font-serif-display text-xl sm:text-3xl mt-1 mb-1" style={{ color: "var(--text)" }}>
        Redacta el expediente
      </h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        Lugar, ventana de fechas y equipo. Todo lo demás se analiza y se escala por ti.
      </p>

      {/* completion tracker */}
      <div className="p-3 rounded mb-5" style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }} data-testid="plan-completion-tracker">
        <div className="flex items-center justify-between gap-2">
          <span className="caption">Obligatorio · {complete} de {checks.length} completo</span>
          {valid && <CheckCircle2 size={15} style={{ color: "var(--gold)" }} />}
        </div>
        <div className="score-track mt-2" style={{ height: 5 }}>
          <div className="score-fill" style={{ width: `${(complete / checks.length) * 100}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {checks.map((c) => (
            <span key={c.id} className="text-xs flex items-center gap-1" style={{ color: c.ok ? "var(--gold)" : "var(--text-muted)" }} data-testid={`check-${c.id}`}>
              {c.ok ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="caption block mb-1.5">Destino *</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Torres del Paine · Ladakh · Atlas Mountains"
            className="chic-input"
            style={show("destination") ? { borderColor: "#B94040" } : undefined}
            data-testid="expedition-destination-input"
          />
          <Err msg={show("destination")} testId="error-destination" />
        </div>

        <div>
          <label className="caption mb-1.5 flex items-center gap-1.5">
            <CalendarDays size={11} style={{ color: "var(--gold)" }} /> Fecha de inicio *
          </label>
          <input
            type="date"
            value={startDate}
            min={today}
            onChange={(e) => setStartDate(e.target.value)}
            className="chic-input"
            style={show("startDate") ? { borderColor: "#B94040" } : undefined}
            data-testid="expedition-start-date-input"
          />
          <Err msg={show("startDate")} testId="error-start-date" />
        </div>
        <div>
          <label className="caption mb-1.5 flex items-center gap-1.5">
            <CalendarDays size={11} style={{ color: "var(--gold)" }} /> Fecha de fin *
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || today}
            onChange={(e) => setEndDate(e.target.value)}
            className="chic-input"
            style={show("endDate") ? { borderColor: "#B94040" } : undefined}
            data-testid="expedition-end-date-input"
          />
          <Err msg={show("endDate")} testId="error-end-date" />
        </div>

        <div>
          <label className="caption mb-1.5 flex items-center gap-1.5">
            <Users size={11} style={{ color: "var(--gold)" }} /> Tamaño del equipo *
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMemberCount((v) => Math.max(1, (Number(v) || 1) - 1))}
              className="step-btn shrink-0"
              data-testid="member-count-minus"
              aria-label="Fewer members"
            >
              <Minus size={13} />
            </button>
            <input
              type="number"
              min={1}
              max={60}
              value={memberCount}
              onChange={(e) => setMemberCount(e.target.value)}
              className="chic-input text-center"
              style={show("memberCount") ? { borderColor: "#B94040" } : undefined}
              data-testid="expedition-member-count-input"
            />
            <button
              type="button"
              onClick={() => setMemberCount((v) => Math.min(60, (Number(v) || 0) + 1))}
              className="step-btn shrink-0"
              data-testid="member-count-plus"
              aria-label="More members"
            >
              <Plus size={13} />
            </button>
          </div>
          <Err msg={show("memberCount")} testId="error-member-count" />
        </div>
        <div>
          <label className="caption block mb-1.5">Experiencia del equipo</label>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className="chic-input" data-testid="expedition-experience-select">
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="caption block mb-1.5">Tipo de viaje</label>
          <select value={tripType} onChange={(e) => setTripType(e.target.value)} className="chic-input" data-testid="expedition-trip-type-select">
            {TRIP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border-gold)" }}>
        <div className="caption">Equipo · {members.length} {members.length === 1 ? "miembro" : "miembros"} *</div>
        <p className="text-xs mt-1 mb-3" style={{ color: "var(--text-muted)" }}>
          Una fila por miembro — usa Tamaño del equipo arriba para añadir o quitar personas. Cada fila necesita nombre y rol.
        </p>
        <div className="space-y-3">
          {members.map((m, i) => (
            <div
              key={i}
              className="p-3 rounded space-y-2"
              style={{
                border: `1px solid ${showErrors && (!m.name.trim() || !m.role.trim()) ? "#B94040" : "var(--border-gold)"}`,
              }}
              data-testid={`member-row-${i}`}
            >
              <div className="caption" style={{ color: "var(--gold)" }}>Miembro {i + 1}</div>
              <input
                value={m.name}
                onChange={(e) => updateMember(i, "name", e.target.value)}
                placeholder="Nombre completo"
                className="chic-input"
                data-testid={`member-name-input-${i}`}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={m.role}
                  onChange={(e) => updateMember(i, "role", e.target.value)}
                  placeholder="Rol (líder, médico, navegante…)"
                  className="chic-input flex-1"
                  data-testid={`member-role-input-${i}`}
                />
                <select
                  value={m.experience}
                  onChange={(e) => updateMember(i, "experience", e.target.value)}
                  className="chic-input sm:w-44"
                  data-testid={`member-experience-select-${i}`}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        <Err msg={show("members")} testId="error-members" />
      </div>

      <div className="mt-5">
        <label className="caption block mb-1.5">Notas para el analista (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="p. ej. dos miembros con asma, sin apoyo de vehículo, equipo económico"
          className="chic-input"
          data-testid="expedition-notes-input"
        />
      </div>

      <button
        type="submit"
        disabled={loading || disabled}
        className="pill-btn pill-btn-primary w-full mt-6"
        style={{ padding: "0.8rem 1.5rem", opacity: valid || loading ? 1 : 0.75 }}
        data-testid="generate-expedition-button"
      >
        {loading
          ? "Analizando lugar, temporada y equipo…"
          : disabled
          ? "Sin conexión — carga un expediente guardado"
          : valid
          ? "Generar expediente de expedición"
          : `Completa ${checks.length - complete} campo${checks.length - complete > 1 ? "s" : ""} más`}
      </button>
    </form>
  );
}
