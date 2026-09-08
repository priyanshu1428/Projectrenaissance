import React, { useMemo, useState } from "react";
import { Plus, X, Users, CalendarDays, Sparkles, CheckCircle2, AlertCircle, Minus } from "lucide-react";

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
  const [members, setMembers] = useState([{ name: "", role: "Lead", experience: "intermediate" }]);
  const [showErrors, setShowErrors] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (destination.trim().length < 2) e.destination = "Where are you going? Enter a destination.";
    if (!startDate) e.startDate = "Pick a start date.";
    if (!endDate) e.endDate = "Pick an end date.";
    if (startDate && endDate && endDate < startDate) e.endDate = "End date must be on or after the start date.";
    const n = Number(memberCount);
    if (!n || n < 1) e.memberCount = "At least one member.";
    const missing = members.map((m, i) => (m.name.trim() ? null : i)).filter((v) => v !== null);
    if (missing.length) e.members = `Name every member on the roster (${missing.length} missing).`;
    return e;
  }, [destination, startDate, endDate, memberCount, members]);

  const checks = [
    { id: "destination", label: "Destination", ok: !errors.destination },
    { id: "dates", label: "Dates", ok: !errors.startDate && !errors.endDate },
    { id: "team", label: "Team size", ok: !errors.memberCount },
    { id: "roster", label: "Roster names", ok: !errors.members },
  ];
  const complete = checks.filter((c) => c.ok).length;
  const valid = complete === checks.length;

  const updateMember = (i, key, value) =>
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));

  const addMember = () =>
    setMembers((prev) => [...prev, { name: "", role: "Member", experience: "intermediate" }]);

  const removeMember = (i) => setMembers((prev) => prev.filter((_, idx) => idx !== i));

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
      member_count: Math.max(1, Number(memberCount) || 1),
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
        <Sparkles size={12} style={{ color: "var(--gold)" }} /> Expedition Setup
      </div>
      <h2 className="font-serif-display text-xl sm:text-3xl mt-1 mb-1" style={{ color: "var(--text)" }}>
        Draft the dossier
      </h2>
      <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
        Place, window and team. Everything else is analysed and scaled for you.
      </p>

      {/* completion tracker */}
      <div className="p-3 rounded mb-5" style={{ backgroundColor: "var(--badge)", border: "1px solid var(--border-gold)" }} data-testid="plan-completion-tracker">
        <div className="flex items-center justify-between gap-2">
          <span className="caption">Required · {complete} of {checks.length} complete</span>
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
          <label className="caption block mb-1.5">Destination *</label>
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
            <CalendarDays size={11} style={{ color: "var(--gold)" }} /> Start date *
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
            <CalendarDays size={11} style={{ color: "var(--gold)" }} /> End date *
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
            <Users size={11} style={{ color: "var(--gold)" }} /> Team size *
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
          <label className="caption block mb-1.5">Team experience</label>
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className="chic-input" data-testid="expedition-experience-select">
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="caption block mb-1.5">Trip type</label>
          <select value={tripType} onChange={(e) => setTripType(e.target.value)} className="chic-input" data-testid="expedition-trip-type-select">
            {TRIP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border-gold)" }}>
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="caption">Roster ({members.length}) *</div>
          <button type="button" onClick={addMember} className="pill-btn" style={{ padding: "0.35rem 0.85rem", fontSize: "0.75rem" }} data-testid="add-member-button">
            <Plus size={12} /> Add member
          </button>
        </div>
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2" data-testid={`member-row-${i}`}>
              <input
                value={m.name}
                onChange={(e) => updateMember(i, "name", e.target.value)}
                placeholder={`Member ${i + 1} name`}
                className="chic-input flex-1"
                style={showErrors && !m.name.trim() ? { borderColor: "#B94040" } : undefined}
                data-testid={`member-name-input-${i}`}
              />
              <input
                value={m.role}
                onChange={(e) => updateMember(i, "role", e.target.value)}
                placeholder="Role (medic, navigator…)"
                className="chic-input sm:w-48"
                data-testid={`member-role-input-${i}`}
              />
              <div className="flex gap-2">
                <select
                  value={m.experience}
                  onChange={(e) => updateMember(i, "experience", e.target.value)}
                  className="chic-input flex-1 sm:w-40"
                  data-testid={`member-experience-select-${i}`}
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {members.length > 1 && (
                  <button type="button" onClick={() => removeMember(i)} className="pill-btn shrink-0" style={{ padding: "0.5rem 0.7rem" }} data-testid={`remove-member-${i}`}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <Err msg={show("members")} testId="error-members" />
      </div>

      <div className="mt-5">
        <label className="caption block mb-1.5">Notes for the analyst (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. two members with asthma, no vehicle support, budget gear"
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
          ? "Analysing place, season & team…"
          : disabled
          ? "Offline — load a saved dossier"
          : valid
          ? "Generate expedition dossier"
          : `Complete ${checks.length - complete} more field${checks.length - complete > 1 ? "s" : ""}`}
      </button>
    </form>
  );
}
