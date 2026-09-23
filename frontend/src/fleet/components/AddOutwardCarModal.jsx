import { useEffect, useMemo, useState } from 'react';
import { colors } from '../../module/theme/colors';
import { Button } from '../../components/common';
import { FLEET_CAR_TYPES } from '../constants/fleetConstants';

const isValidPhone = (value) => {
  if (!value) return false;
  const digits = String(value).replace(/\D/g, '');
  return digits.length === 10;
};

const isValidCarNumber = (num) => {
  if (!num) return false;
  const cleaned = String(num).replace(/[^A-Z0-9]/g, '').toUpperCase();
  const regex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
  return regex.test(cleaned);
};

const AddOutwardCarModal = ({ open, onClose, onCreate, vendors = [] }) => {
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [carName, setCarName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [carNumberTouched, setCarNumberTouched] = useState(false);
  const [carImages, setCarImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setOwnerName('');
    setOwnerPhone('');
    setCarName('');
    setBrand('');
    setModel('');
    setLocation('');
    setPricePerDay('');
    setCarNumber('');
    setCarNumberTouched(false);
    setCarImages([]);
    setImagePreviews([]);
    setSubmitting(false);
    setError('');
  }, [open]);

  // Auto-fill phone if vendor is selected
  useEffect(() => {
    if (ownerName && vendors.length > 0) {
      const matchedVendor = vendors.find(v => v.name === ownerName);
      if (matchedVendor && matchedVendor.phone) {
        setOwnerPhone(matchedVendor.phone);
      }
    }
  }, [ownerName, vendors]);

  const canSubmit = useMemo(() => {
    if (!ownerName.trim()) return false;
    if (!isValidPhone(ownerPhone)) return false;
    if (!carName.trim()) return false;
    if (!brand.trim()) return false;
    if (!model.trim()) return false;
    if (!location.trim()) return false;
    const price = Number(pricePerDay);
    if (!Number.isFinite(price) || price <= 0) return false;
    if (!carNumber.trim()) return false;
    if (!isValidCarNumber(carNumber)) return false;
    return true;
  }, [ownerName, ownerPhone, carName, brand, model, location, pricePerDay, carNumber]);

  const handleCreate = async () => {
    setError('');
    if (!canSubmit) {
      setError('Please fill all required fields with valid values.');
      return;
    }
    setSubmitting(true);
    try {
      const car = {
        id: `fleet_car_out_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name: carName.trim(),
        brand: brand.trim(),
        model: model.trim(),
        pricePerDay: Number(pricePerDay),
        location: location.trim(),
        type: FLEET_CAR_TYPES.OUTWARD,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        carNumber: carNumber.trim().toUpperCase(),
        carImages: carImages,
        createdAt: new Date().toISOString(),
      };
      await onCreate(car);
      onClose();
    } catch (e) {
      setError(e?.message || 'Failed to create car');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl rounded-xl shadow-xl border"
        style={{
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.borderMedium,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5 border-b" style={{ borderBottomColor: colors.borderMedium }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>
                Add Outward Car
              </h2>
              <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Enter owner details + car details (saved locally in this browser).
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border"
              style={{ borderColor: colors.borderMedium, color: colors.textPrimary }}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                Owner Name <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                list="vendor-list"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                placeholder="Enter owner name"
              />
              <datalist id="vendor-list">
                {vendors.map(v => (
                  <option key={v._id} value={v.name}>{v.phone ? `(${v.phone})` : ''}</option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                Owner Number <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setOwnerPhone(val);
                }}
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]{10}"
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                placeholder="Enter 10-digit phone number"
              />
              {ownerPhone && ownerPhone.length > 0 && ownerPhone.length < 10 && (
                <p className="text-xs mt-1" style={{ color: colors.accentRed }}>
                  Mobile number must be exactly 10 digits.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                Car Name <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                placeholder="e.g. City Ride"
              />
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                Brand <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                placeholder="e.g. Maruti"
              />
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                Model <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                placeholder="e.g. Swift"
              />
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                Location <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                placeholder="e.g. Indore"
              />
            </div>

            <div>
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                Price/Day <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                placeholder="e.g. 1200"
              />
            </div>

            {/* Car Registration Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium" style={{ color: colors.textPrimary }}>
                Car Number (Registration) <span style={{ color: colors.accentRed }}>*</span>
              </label>
              <input
                value={carNumber}
                onChange={(e) => setCarNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                onBlur={() => setCarNumberTouched(true)}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none uppercase font-mono tracking-wider"
                style={{ borderColor: colors.borderMedium, backgroundColor: colors.backgroundPrimary }}
                placeholder="e.g. MP09AB1234"
              />
              {carNumberTouched && carNumber && !isValidCarNumber(carNumber) && (
                <p className="text-xs mt-1.5" style={{ color: colors.accentRed }}>
                  Invalid format. E.g., MP41HG5263
                </p>
              )}
            </div>

            {/* Car Images */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>
                Car Images (Front & Back)
              </label>
              <div className="flex gap-3 flex-wrap">
                {/* Camera Capture */}
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-gray-50" style={{ borderColor: colors.borderMedium }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Capture</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setCarImages(prev => [...prev, file]);
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result]);
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
                {/* File Upload */}
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer hover:bg-gray-50" style={{ borderColor: colors.borderMedium }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setCarImages(prev => [...prev, ...files]);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result]);
                        reader.readAsDataURL(file);
                      });
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border" style={{ borderColor: colors.borderMedium }}>
                      <img src={preview} alt={`Car ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setCarImages(prev => prev.filter((_, i) => i !== idx));
                          setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>Capture front & back of car using camera or upload files</p>
            </div>
          </div>

          {error ? (
            <p className="text-sm" style={{ color: colors.accentRed }}>
              {error}
            </p>
          ) : null}
        </div>

        <div className="p-5 border-t flex justify-end gap-2" style={{ borderTopColor: colors.borderMedium }}>
          <Button
            onClick={onClose}
            className="px-4 py-2"
            style={{
              backgroundColor: colors.backgroundLight,
              color: colors.textPrimary,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canSubmit || submitting}
            className="px-4 py-2"
            style={{
              backgroundColor: colors.backgroundTertiary,
              color: colors.textWhite,
              opacity: !canSubmit || submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Saving...' : 'Add Car'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddOutwardCarModal;

