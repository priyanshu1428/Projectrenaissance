import React, { useState } from "react";
import { Plus, X, Users, CalendarDays, Sparkles } from "lucide-react";

const TRIP_TYPES = ["Trek / Hike", "Alpine Climb", "Desert Crossing", "Jungle Traverse", "Winter Expedition", "Kayak / River", "Cycling Tour"];
const LEVELS = ["beginner", "intermediate", "advanced", "professional"];

export default function ExpeditionForm({ onSubmit, loading, disabled }) {
  const today = new Date().toISOString().slice(0, 10);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [memberCount, setMemberCount] = useState(4);
  const [experience, setExperience] = useState("intermediate");
  const [tripType, setTripType] = useState(TRIP_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [members, setMembers] = useState([{ name: "", role: "Lead", experience: "intermediate" }]);

  const updateMember = (i, key, value) =>
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: value } : m)));

  const addMember = () =>
    setMembers((prev) => [...prev, { name: "", role: "Member", experience: "intermediate" }]);

  const removeMember = (i) => setMembers((prev) => prev.filter((_, idx) => idx !== i));

  const submit = (e) => {
    e.preventDefault();
    if (!destination.trim()) return;
    onSubmit({
      destination: destination.trim(),
      start_date: startDate,
      end_date: endDate,
      member_count: Math.max(1, Number(memberCount) || 1),
      members: members.filter((m) => m.name.trim() || m.role.trim()),
      experience_level: experience,
      trip_type: tripType,
      notes: notes.trim(),
    });
  };

  return (
    <form onSubmit={submit} className="parchment-card p-6 sm:p-8" data-testid="expedition-setup-form">
      <div className="caption flex items-center gap-1.5">
        <Sparkles size={12} style={{ color: "var(--gold)" }} /> Expedition Setup
      </div>
      <h2 className="font-serif-display text-xl sm:text-3xl mt-1 mb-1" style={{ color: "var(--text)" }}>
        Draft the dossier
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Place, window and team. Everything else is analysed and scaled for you.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="caption block mb-1.5">Destination</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Torres del Paine · Ladakh · Atlas Mountains"
            className="chic-input"
            data-testid="expedition-destination-input"
          />
        </div>

        <div>
          <label className="caption block mb-1.5 flex items-center gap-1.5">
            <CalendarDays size={11} style={{ color: "var(--gold)" }} /> Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="chic-input"
            data-testid="expedition-start-date-input"
          />
        </div>
        <div>
          <label className="caption block mb-1.5 flex items-center gap-1.5">
            <CalendarDays size={11} style={{ color: "var(--gold)" }} /> End date
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="chic-input"
            data-testid="expedition-end-date-input"
          />
        </div>

        <div>
          <label className="caption block mb-1.5 flex items-center gap-1.5">
            <Users size={11} style={{ color: "var(--gold)" }} /> Team size
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={memberCount}
            onChange={(e) => setMemberCount(e.target.value)}
            className="chic-input"
            data-testid="expedition-member-count-input"
          />
        </div>
        <div>
          <label className="caption block mb-1.5">Team experience</label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="chic-input"
            data-testid="expedition-experience-select"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="caption block mb-1.5">Trip type</label>
          <select
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
            className="chic-input"
            data-testid="expedition-trip-type-select"
          >
            {TRIP_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--border-gold)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="caption">Roster ({members.length})</div>
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
                data-testid={`member-name-input-${i}`}
              />
              <input
                value={m.role}
                onChange={(e) => updateMember(i, "role", e.target.value)}
                placeholder="Role (medic, navigator…)"
                className="chic-input sm:w-48"
                data-testid={`member-role-input-${i}`}
              />
              <select
                value={m.experience}
                onChange={(e) => updateMember(i, "experience", e.target.value)}
                className="chic-input sm:w-40"
                data-testid={`member-experience-select-${i}`}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {members.length > 1 && (
                <button type="button" onClick={() => removeMember(i)} className="pill-btn" style={{ padding: "0.5rem 0.7rem" }} data-testid={`remove-member-${i}`}>
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
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
        style={{ padding: "0.8rem 1.5rem" }}
        data-testid="generate-expedition-button"
      >
        {loading ? "Analysing place, season & team…" : disabled ? "Offline — load a saved dossier" : "Generate expedition dossier"}
      </button>
    </form>
  );
}
