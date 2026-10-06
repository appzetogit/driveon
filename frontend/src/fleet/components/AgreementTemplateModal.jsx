import { useState, useEffect } from 'react';
import { colors } from '../../module/theme/colors';
import api from '../../services/api';
import { Button } from '../../components/common';

const DEFAULT_TEMPLATE = {
  title: 'GUEST VEHICLE USE, BOOKING & BAILMENT AGREEMENT',
  companyName: 'URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON)',
  companySubtitle: 'Vehicle Rental Aggregator & Guest Bailment Agreement • Ahmedabad, Gujarat',
  companyAddress: 'Floor No.: 4, Building No./Flat No.: 429-430, Name Of Premises/Building: Patel Avenue, Road/Street: Sarkhej Gandhi Nagar Highway, Locality/Sub Locality: Bodakdev, City/Town/Village: Ahmedabad, District: Ahmedabad, State: Gujarat, PIN Code: 380054',
  companyContact: '+91 7610416911 | driveon721@gmail.com',
  customClauses: `The Platform Operator and Guest are individually a “Party” and collectively the “Parties”.

WHEREAS URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON) is a vehicle rental aggregator, facilitating bookings between Guests and independent vehicle owners, Hosts and fleet operators. URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON) may facilitate KYC and verification, booking, payment collection, vehicle handover/return coordination and customer support. Unless expressly stated otherwise, URBAN MOBILITY RENTALS PRIVATE LIMITED (DRIVEON) does not own the Vehicle; ownership remains with the respective Host/vehicle owner, while the Guest receives temporary possession and use subject to this Agreement, Booking terms and Applicable Law.`,
  terms: [
    'VEHICLE AND BOOKING: The Vehicle is owned by/under the lawful control of Host, is provided to the Guest for temporary use, subject to this Agreement, the Booking terms and Applicable Law. Ownership and title in the Vehicle shall remain with the Host/registered owner. The Guest receives only temporary possession and use of the Vehicle during the Booking Period and acquires no ownership, lien or other proprietary interest in it.',
    'GUEST ELIGIBILITY AND VERIFICATION: The Guest confirms that the Guest is legally competent, holds a valid driving license for the Vehicle and has provided genuine and accurate identity and verification documents. The Guest shall provide valid KYC/identity documents, residence proof, driving licence and such other documents as reasonably required by the Platform Operator. The Guest shall immediately notify the Platform Operator if the Guest\'s driving licence becomes invalid, suspended, cancelled or revoked and shall not drive thereafter. The Platform Operator may refuse, suspend or cancel the Booking where verification is incomplete, information is false or unverifiable, or continued use presents a legal, safety or security concern.',
    'USE AND POSSESSION OF VEHICLE: Only the Guest may drive or operate the Vehicle unless another driver is expressly approved in writing by the Platform Operator/Host. The Guest shall not sell, lease, sub-let, rent, lend, transfer, assign or otherwise part with possession of the Vehicle. The Vehicle shall be used only for lawful purposes and in accordance with all applicable traffic, motor vehicle, transport and safety laws. The Guest shall bear all liability, costs, penalties, claims and expenses arising from any illegal, unlawful or criminal use of the Vehicle or any act or omission attributable to the Guest. The Guest shall not use or permit the Vehicle to be used for any offence or for transportation or possession of narcotic drugs, psychotropic substances, illegal arms or ammunition, stolen property, contraband or other prohibited material. The Guest shall not use the Vehicle for taxi, cab, ride-hailing, commercial passenger transport, sub-rental or other commercial exploitation unless expressly permitted by Applicable Law and the Booking terms. The Guest shall not use the Vehicle for racing, rallies, stunt driving, drifting, speed testing, organized motorsport, dangerous off-road activities or any other unsafe use. The Guest shall not drive under the influence of alcohol, drugs or any substance impairing safe driving. The Guest shall not take the Vehicle outside India or any restricted territory, or modify, dismantle, tune or tamper with the Vehicle or its safety, GPS or telematics systems. The Guest shall exercise reasonable care and shall not knowingly drive through flooded roads, deep water or other hazardous conditions where a reasonable driver would avoid doing so.',
    'HANDOVER AND RETURN: The Vehicle shall be handed over against an inspection/photographic record noting, where applicable, its condition, existing damage, odometer, fuel level, keys, accessories and documents. Damage or defects recorded at handover shall be treated as pre-existing. The Guest shall be responsible only for damage or loss attributable to the Guest\'s breach, negligence, wilful misconduct, prohibited use, unauthorised driver or other act or omission. The Guest shall return the Vehicle on the agreed date, time and location in substantially the same condition as received, subject to ordinary wear and tear. Damage identified upon return may be assessed using photographs, inspection records, telematics, repair estimates, invoices, insurance assessments and other relevant evidence. Late or unauthorized retention of the Vehicle may result in applicable additional charges and reasonable recovery costs.',
    'FINES, TOLLS, FUEL AND OTHER CHARGES: The Guest shall comply with all traffic laws, speed limits, parking restrictions and road regulations. All traffic fines, e-challans, parking charges, tolls, FASTag charges, statutory charges and other amounts attributable to the Guest\'s use of the Vehicle during the Booking Period shall be borne by the Guest. Where disclosed in the Booking terms, reasonable administrative charges for processing fines, tolls, statutory notices or similar matters may also be recovered from the Guest. The Guest shall return the Vehicle with the same fuel level as recorded at handover and shall bear any fuel shortfall and applicable refueling charge. Any towing, flushing, repair or replacement costs resulting from incorrect or contaminated fuel shall be borne by the Guest.',
    'ACCIDENT, THEFT AND INCIDENTS: The Guest shall immediately notify the Platform Operator and Host, wherever reasonably practicable, of any accident, theft, attempted theft, breakdown, seizure, detention, material damage, loss of keys/documents or other material incident involving the Vehicle. The Guest shall promptly notify the police, insurer, emergency service or other competent authority where required by law or circumstances and shall take reasonable steps to prevent further damage. The Guest shall fully cooperate with the Host, Platform Operator, insurer, police and other competent authorities and shall provide truthful information and documents. The Guest shall not make false statements, conceal material facts, admit liability or enter into any settlement on behalf of the Host or Platform Operator without authority, where such authority can reasonably be obtained. Booking, KYC, payment, photographs, GPS, telematics and other relevant records may be preserved and disclosed to competent authorities where required or permitted by law.',
    'DAMAGE AND FINANCIAL LIABILITY: The Guest shall be liable for reasonable and documented costs arising from damage to, loss of or recovery of the Vehicle to the extent directly attributable to the Guest\'s breach, negligence, willful misconduct, prohibited use, unauthorized driving or other act or omission. The Guest shall bear all liability, costs, penalties, claims and expenses arising from any illegal, unlawful or criminal use of the Vehicle or any act or omission attributable to the Guest. In the event of damage, accident, police seizure/impoundment, detention, abandonment or legal dispute arising from the Guest\'s use of the Vehicle, the agreed daily rental shall continue to accrue until the Vehicle is physically recovered and formally handed over to the Platform Operator/Host, subject to Applicable Law. The Guest shall not be liable for ordinary wear and tear, pre-existing defects or mechanical failure not caused by the Guest. Where damage attributable to the Guest prevents use of the Vehicle, reasonable and documented loss of use for the reasonably required repair period may be recovered, subject to Applicable Law.',
    'SECURITY DEPOSIT: The Guest shall provide a refundable Security Deposit of not less than INR 10,000/-, or such higher amount as specified at the time of Booking. Subject to Applicable Law, the Platform Operator may adjust the Security Deposit against properly established amounts payable by the Guest, including damage, fines, tolls, fuel shortfall, recovery expenses and other contractual charges. The balance shall be refunded after completion of the Booking and reconciliation of applicable charges, subject to any pending claim or statutory charge. Payment of the Security Deposit shall not limit the Guest\'s liability for amounts lawfully exceeding the deposit.',
    'GPS, TELEMATICS AND DATA: The Vehicle may be equipped with GPS, telematics, speed monitoring, keyless access, immobilisation or other technology for safety, security, trip administration, fraud prevention and vehicle recovery. The Guest shall not tamper with, disconnect, remove, shield or bypass such systems and shall bear reasonable repair or replacement costs resulting from such tampering. Personal, location and Vehicle data may be collected, processed, stored and disclosed in accordance with Applicable Law, the applicable Privacy Policy and lawful requests of competent authorities. Electronic Booking records, OTPs, digital acknowledgements, photographs, payment records, GPS/telematics records and inspection records may be relied upon as evidence of the relevant transaction, subject to Applicable Law.',
    'INDEMNITY: The Guest shall indemnify the Host and Platform Operator against reasonable and documented losses, damages, third party claims, costs and legal expenses directly arising from the Guest\'s breach of this Agreement, unlawful or prohibited use, unauthorised driving or possession, negligence, wilful misconduct, false information, failure to return the Vehicle or damage/loss for which the Guest is responsible. The Guest shall not indemnify the Platform Operator for loss arising solely from the Platform Operator\'s fraud, wilful misconduct or breach of Applicable Law.',
    'SUSPENSION, TERMINATION AND RECOVERY: The Platform Operator may suspend or terminate the Booking where the Guest provides false information, loses driving eligibility, materially breaches this Agreement, uses the Vehicle unlawfully, creates a safety/security risk or violates the Booking terms. Immediate termination may be effected in cases of unlawful use, unauthorised driving, intoxicated driving, abandonment or refusal to return the Vehicle, material tampering or prohibited commercial use. Upon expiry or termination, the Guest shall immediately stop using and return the Vehicle to the designated location. If the Guest fails to return the Vehicle, the Host and/or Platform Operator may take all lawful and reasonable steps necessary to recover the Vehicle, including approaching competent authorities.',
    'PLATFORM LIABILITY: To the maximum extent permitted by Applicable Law, the Platform Operator shall not be liable for indirect, incidental, special or consequential loss, loss of time or inconvenience arising from the Guest\'s use of the Vehicle. The Platform Operator shall not be responsible for personal belongings left in the Vehicle or mechanical defects attributable solely to the Vehicle/Host, except for liability which cannot legally be excluded. Nothing in this Agreement shall exclude or limit liability which cannot lawfully be excluded or limited.',
    'GOVERNING LAW AND DISPUTE RESOLUTION: This Agreement shall be governed by the laws of India. Any contractual dispute capable of arbitration shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, as amended. The Parties shall endeavour to mutually appoint a sole arbitrator within thirty (30) days of a written notice invoking arbitration, failing which either Party may seek appointment in accordance with law. The seat of arbitration shall be Ahmedabad, Gujarat, and the proceedings shall be conducted in English. Subject to arbitration and Applicable Law, courts having competent jurisdiction at Ahmedabad, Gujarat shall have jurisdiction in relation to proceedings arising from this Agreement.',
    'GENERAL: This Agreement, together with the Booking confirmation and applicable Platform terms/policies, constitutes the agreement between the Parties concerning the Booking. If any provision is held invalid or unenforceable, the remaining provisions shall continue to the extent permitted by Applicable Law. No failure or delay in exercising any right shall constitute a waiver. The Guest shall not assign or transfer rights or obligations under this Agreement without prior written consent. Provisions relating to payment, damage, indemnity, liability, data, records and dispute resolution shall survive expiry or termination to the extent applicable.'
  ]
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
          const [res, settingsRes] = await Promise.all([
            api.get('/fleet/agreement-template').catch(() => null),
            api.get('/common/settings').catch(() => null)
          ]);
          
          let initialTpl = { ...DEFAULT_TEMPLATE };
          if (settingsRes?.data?.settings) {
            const s = settingsRes.data.settings;
            if (s.companyName) initialTpl.companyName = s.companyName;
            if (s.supportPhone || s.supportEmail) {
              initialTpl.companyContact = [s.supportPhone, s.supportEmail].filter(Boolean).join(' | ');
            }
            if (s.address) initialTpl.companyAddress = s.address;
          }

          if (res?.data?.success && res.data?.data) {
            setTemplate({
              ...initialTpl,
              ...res.data.data,
              terms: Array.isArray(res.data.data.terms) && res.data.data.terms.length > 0 
                ? res.data.data.terms 
                : initialTpl.terms,
              customClauses: (
                res.data.data.customClauses !== undefined && res.data.data.customClauses !== ''
                  ? res.data.data.customClauses
                  : initialTpl.customClauses
              ).replace(/^This Agreement is executed on[^\n]+(\r?\n)+/i, '').trim(),
              companyAddress: res.data.data.companyAddress || initialTpl.companyAddress || '',
            });
          } else {
            setTemplate(initialTpl);
          }
        } catch (err) {
          console.warn('Error loading agreement template:', err);
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
                  placeholder="e.g. +91 7610416911 | driveon721@gmail.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: colors.textPrimary }}>
                  Company Registered Address / Operations Hub
                </label>
                <input
                  type="text"
                  value={template.companyAddress || ''}
                  onChange={(e) => setTemplate({ ...template, companyAddress: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-xs outline-none"
                  style={inputStyle}
                  placeholder="e.g. Fleet Operations & Custody Hub, Indore (M.P.) - 452001, India"
                />
              </div>
            </div>
          </div>

          {/* Agreement Recitals ("WHEREAS..." / Bailment Clauses) */}
          <div className="space-y-2 border rounded-xl p-4" style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: colors.textPrimary }}>
                Agreement Recitals & Platform Terms (WHEREAS Clauses)
              </label>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
              Yeh text rental agreement ke header ke baad First Party (Platform Operator), Host aur Guest ke beech bailment relationship aur aggregator platform terms define karta hai:
            </p>
            <textarea
              rows={7}
              value={template.customClauses || ''}
              onChange={(e) => setTemplate({ ...template, customClauses: e.target.value })}
              className="w-full rounded-lg border p-3 text-xs outline-none leading-relaxed font-mono"
              style={inputStyle}
              placeholder="Enter Agreement recitals (e.g. The Platform Operator and Guest are individually a 'Party' and collectively the 'Parties'... WHEREAS URBAN MOBILITY RENTALS PRIVATE LIMITED is a vehicle rental aggregator...)"
            />
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
