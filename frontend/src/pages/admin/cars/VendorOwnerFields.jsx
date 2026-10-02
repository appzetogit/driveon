import { useEffect, useState } from 'react';
import { colors } from '../../../module/theme/colors';
import { Input } from '../../../components/common';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';
import { crmService } from '../../../services/crm.service';

export const emptyVendorInfo = {
  vendorId: '',
  vendorAgreementType: 'daily',
  agreementPricePerDay: '',
  agreementPricePerMonth: '',
};

const AGREEMENT_TYPES = [
  { value: 'daily', label: 'Per Day Wise' },
  { value: 'monthly', label: 'Fixed / Month' },
];

/**
 * Owner details for a vendor-owned (outward) car: CRM vendor + agreement terms.
 * Shared by AddCarPage and EditCarPage.
 */
const VendorOwnerFields = ({ value, onChange }) => {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    crmService.getVendors()
      .then((response) => setVendors(response.data?.vendors || []))
      .catch((error) => console.error('Failed to load CRM vendors', error));
  }, []);

  const vendor = vendors.find((v) => v._id === value.vendorId);
  const isMonthly = value.vendorAgreementType === 'monthly';
  const amountKey = isMonthly ? 'agreementPricePerMonth' : 'agreementPricePerDay';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
      <AdminCustomSelect
        label="Vendor *"
        placeholder="Select onboarded vendor"
        value={value.vendorId}
        onChange={(vendorId) => onChange({ ...value, vendorId })}
        options={vendors.map((v) => ({
          value: v._id,
          label: `${v.name} (${v.phone || 'No Phone'})`,
        }))}
      />
      <Input
        label="Vendor Mobile Number"
        placeholder="Auto-filled from vendor"
        value={vendor?.phone || ''}
        readOnly
        className="bg-gray-50"
      />
      <Input
        label="Vendor Email"
        placeholder="Auto-filled from vendor"
        value={vendor?.email || ''}
        readOnly
        className="bg-gray-50"
      />
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Agreement Type *</label>
        <div className="flex p-1 rounded-lg bg-gray-100 border border-gray-200">
          {AGREEMENT_TYPES.map((type) => {
            const isSelected = value.vendorAgreementType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => onChange({ ...value, vendorAgreementType: type.value })}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
                  isSelected ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                style={{ color: isSelected ? colors.backgroundTertiary : undefined }}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>
      <Input
        type="number"
        min="0"
        label={`Agreement Amount / ${isMonthly ? 'month' : 'day'} (₹)`}
        placeholder={isMonthly ? 'e.g. 5000, 20000' : 'e.g. 200, 800'}
        value={value[amountKey]}
        onChange={(e) => onChange({ ...value, [amountKey]: e.target.value })}
      />
    </div>
  );
};

export default VendorOwnerFields;
