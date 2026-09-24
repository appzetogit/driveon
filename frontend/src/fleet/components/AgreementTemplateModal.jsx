import { useState, useEffect } from 'react';
import { colors } from '../../module/theme/colors';
import api from '../../services/api';
import { Button } from '../../components/common';

const DEFAULT_TEMPLATE = {
  title: 'DRIVEON SELF-DRIVE VEHICLE RENTAL AGREEMENT',
  companyName: 'Urban Mobility Rentals Private Limited (DriveOn)',
  companySubtitle: 'Fleet Inward Vehicle Custody & Rental Contract • Regulated under Motor Vehicles Act, 1988',
  companyAddress: 'Fleet Operations & Custody Hub, Indore (M.P.)',
  companyContact: '+91 99939 11855 | support@driveon.in',
  terms: [
    'Inspection & Handover: Hirer confirms physical inspection of vehicle condition, fuel gauge, and existing scratches before taking delivery.',
    'Authorized Driver: The vehicle shall only be driven by the Hirer holding a valid, verified Driving License. Sub-leasing, lending, or commercial ride-hailing is strictly prohibited.',
    'Traffic & Criminal Compliance: Hirer shall strictly adhere to speed limits (max 100 km/h), seatbelt laws, and zero alcohol/drugs. Any traffic challans, fines, or toll fees incurred during the tenure are exclusively the Hirer\'s liability.',
    'Accident & Damage Liability: In case of accidental damage or mechanical abuse, the Hirer is liable to indemnify repair costs and downtime charges beyond standard insurance deductibles.',
    'Return Condition: The vehicle must be returned on the agreed date/time. Late returns without prior intimation may incur penalty rates of Rs. 300/hour.',
    'Security Deposit & Collateral: Security deposit and vehicle collateral held will be refunded/returned after safe car return without damages.'
  ],
  customClauses: ''
};

const AgreementTemplateModal = ({ open, onClose, onSaveSuccess }) => {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newTermText, setNewTermText] = useState('');

  // Fetch saved template
  useEffect(() => {
    if (open) {
      setError('');
      setSuccessMsg('');
      const fetchTemplate = async () => {
        setLoading(true);
        try {
          const res = await api.get('/fleet/agreement-template');
          if (res.data?.success && res.data?.data) {
            setTemplate({
              ...DEFAULT_TEMPLATE,
              ...res.data.data,
              terms: Array.isArray(res.data.data.terms) ? res.data.data.terms : DEFAULT_TEMPLATE.terms,
            });
          }
        } catch (err) {
          console.warn('Using default agreement template:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [open]);

  if (!open) return null;

  const handleTermChange = (index, value) => {
    const updatedTerms = [...template.terms];
    updatedTerms[index] = value;
    setTemplate({ ...template, terms: updatedTerms });
  };

  const handleRemoveTerm = (index) => {
    const updatedTerms = template.terms.filter((_, i) => i !== index);
    setTemplate({ ...template, terms: updatedTerms });
  };

  const handleAddTerm = () => {
    if (!newTermText.trim()) return;
    setTemplate({ ...template, terms: [...template.terms, newTermText.trim()] });
    setNewTermText('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.put('/fleet/agreement-template', template);
      if (res.data?.success) {
        setSuccessMsg('Agreement template saved successfully!');
        if (onSaveSuccess) onSaveSuccess(res.data.data);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.data?.message || 'Failed to save template');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving agreement template');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all agreement terms and header to default DriveOn rental contract?')) {
      setTemplate(DEFAULT_TEMPLATE);
    }
  };

  const inputStyle = {
    borderColor: colors.borderMedium,
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-4xl rounded-2xl shadow-2xl border flex flex-col my-auto"
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderMedium,
          maxHeight: '94vh',
        }}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between gap-3 flex-shrink-0"
          style={{ borderBottomColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                Fleet Rental Agreement Template
              </h3>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Configure the master rental agreement used dynamically for all inward fleet car bookings.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-lg border text-gray-400 hover:text-gray-100 transition-colors"
            style={{ borderColor: colors.borderMedium }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {error && (
            <div className="p-3 rounded-lg border text-xs font-semibold text-red-500 bg-red-500/10 border-red-500/30 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-lg border text-xs font-semibold text-emerald-600 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Company & Document Header Settings */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Document Header & Company Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Agreement Title <span style={{ color: colors.accentRed }}>*</span>
                </label>
                <input
                  type="text"
                  value={template.title}
                  onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-xs outline-none font-semibold"
                  style={inputStyle}
                  placeholder="e.g. DRIVEON SELF-DRIVE VEHICLE RENTAL AGREEMENT"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Company Name <span style={{ color: colors.accentRed }}>*</span>
                </label>
                <input
                  type="text"
                  value={template.companyName}
                  onChange={(e) => setTemplate({ ...template, companyName: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-xs outline-none font-semibold"
                  style={inputStyle}
                  placeholder="e.g. Urban Mobility Rentals Private Limited (DriveOn)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Header Subtitle / Legal Reference
                </label>
                <input
                  type="text"
                  value={template.companySubtitle}
                  onChange={(e) => setTemplate({ ...template, companySubtitle: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                  style={inputStyle}
                  placeholder="e.g. Regulated under Motor Vehicles Act, 1988"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Company Contact / Support Info
                </label>
                <input
                  type="text"
                  value={template.companyContact}
                  onChange={(e) => setTemplate({ ...template, companyContact: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                  style={inputStyle}
                  placeholder="e.g. +91 99939 11855 | support@driveon.in"
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Terms & Conditions / Rental Clauses ({template.terms?.length || 0})
              </h4>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs text-blue-400 hover:underline"
              >
                Reset to Default
              </button>
            </div>

            <div className="space-y-2.5">
              {template.terms?.map((term, index) => (
                <div key={index} className="flex items-start gap-2 group">
                  <span className="w-6 text-center text-xs font-bold text-gray-500 pt-2 flex-shrink-0">
                    {index + 1}.
                  </span>
                  <textarea
                    rows={2}
                    value={term}
                    onChange={(e) => handleTermChange(index, e.target.value)}
                    className="flex-1 rounded-lg border px-3 py-2 text-xs outline-none leading-relaxed"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(index)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors pt-2 flex-shrink-0"
                    title="Delete clause"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Term */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={newTermText}
                onChange={(e) => setNewTermText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTerm();
                  }
                }}
                placeholder="Type new agreement clause and press Enter or click Add..."
                className="flex-1 rounded-lg border px-3 py-2 text-xs outline-none"
                style={inputStyle}
              />
              <Button
                type="button"
                onClick={handleAddTerm}
                disabled={!newTermText.trim()}
                className="px-4 py-2 rounded-lg text-xs font-bold"
                style={{ backgroundColor: colors.backgroundTertiary, color: colors.textWhite }}
              >
                + Add Clause
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="p-4 sm:p-5 border-t flex items-center justify-between gap-3 flex-shrink-0"
          style={{ borderTopColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
        >
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            Reset Template
          </button>

          <div className="flex items-center gap-3">
            <Button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl text-sm"
              style={{ backgroundColor: colors.backgroundLight, color: colors.textPrimary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              type="button"
              className="px-5 py-2 rounded-xl text-sm font-bold shadow-md"
              style={{ backgroundColor: colors.backgroundTertiary, color: colors.textWhite }}
            >
              {saving ? 'Saving Template...' : 'Save Agreement Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementTemplateModal;
