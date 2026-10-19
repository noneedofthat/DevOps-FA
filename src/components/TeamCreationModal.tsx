"use client";

import React, { useState } from 'react';
import { X, Users, Sparkles, AlertCircle } from 'lucide-react';

interface TeamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (teamData: { name: string; event: string; description: string }) => Promise<void> | void;
  availableEvents?: { id: string; title: string }[];
}

const DEFAULT_EVENTS = [
  { id: 'campus-sprint-2026', title: 'Campus Innovation Sprint 2026' },
  { id: 'ai-for-good-2026', title: 'AI for Good Hackathon' },
  { id: 'design-the-future-2026', title: 'Design the Future' },
  { id: 'greentech-buildathon-2026', title: 'GreenTech Buildathon' },
];

export default function TeamCreationModal({
  isOpen,
  onClose,
  onSubmit,
  availableEvents = DEFAULT_EVENTS,
}: TeamCreationModalProps) {
  const [teamName, setTeamName] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(DEFAULT_EVENTS[0].title);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 50) {
      setTeamName(val);
      if (validationError) setValidationError('');
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 200) {
      setDescription(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const trimmedName = teamName.trim();
    if (!trimmedName) {
      setValidationError('Team name is required.');
      return;
    }

    // Strict No Emoji & ASCII validation
    const asciiRegex = /^[\x00-\x7F]*$/;
    if (!asciiRegex.test(trimmedName) || !asciiRegex.test(description)) {
      setValidationError('Special symbols and emojis are prohibited. Use standard alphanumeric text.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: trimmedName,
        event: selectedEvent,
        description: description.trim(),
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError(err?.message || 'Failed to create team. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <div>
            <h3 id="modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
              Create a new team
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Set up your team for a hackathon and start collaborating.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Team Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Team name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="e.g. Pixel Pioneers"
              value={teamName}
              onChange={handleNameChange}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
            />
            <div className="text-right text-[11px] font-mono text-slate-400 mt-1">
              {teamName.length}/50
            </div>
          </div>

          {/* Select Event */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select event <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition font-medium"
            >
              {availableEvents.map((evt) => (
                <option key={evt.id} value={evt.title}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>

          {/* Team Description (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Team description <span className="text-slate-400 text-[11px] font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={200}
              placeholder="We build innovative solutions for a better tomorrow."
              value={description}
              onChange={handleDescriptionChange}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition resize-none font-medium"
            />
            <div className="text-right text-[11px] font-mono text-slate-400 mt-1">
              {description.length}/200
            </div>
          </div>

          {/* Team Size (Static Capacity Indicator, NOT a slider) */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Team size
              </span>
              <span className="text-[11px] text-slate-400">
                You can add members later
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Users size={16} className="text-blue-600" />
                <span>1 / 4 members</span>
              </div>
              <div className="w-36 sm:w-44 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: '25%' }}
                  role="progressbar"
                  aria-valuenow={1}
                  aria-valuemin={1}
                  aria-valuemax={4}
                  aria-label="Initial squad capacity (1 of 4 slots reserved for Team Lead)"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
