import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '../../../module/theme/colors';
import Card from '../../../components/common/Card';
import { Button, Input } from '../../../components/common';
import { adminService } from '../../../services/admin.service';
import toastUtils from '../../../config/toast';
import AdminCustomSelect from '../../../components/admin/common/AdminCustomSelect';

// Form validation schema
const carFormSchema = z.object({
  // Basic Information
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().optional(),
  registrationNumber: z.string()
    .min(1, 'Registration number is required')
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/, {
      message: 'Invalid registration number format. E.g., MP41HG5263'
    }),

  // Car Type & Category
  carType: z.enum(['sedan', 'suv', 'hatchback', 'luxury', 'sports', 'compact', 'muv', 'coupe']),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'petrol_cng']),
  transmission: z.enum(['manual', 'automatic', 'cvt']),
  seatingCapacity: z.number().min(2).max(10),

  // Pricing
  pricePerDay: z.number().min(0, 'Price must be positive'),
  pricePerWeek: z.number().min(0).optional(),
  pricePerMonth: z.number().min(0).optional(),
  securityDeposit: z.number().min(0, 'Security deposit must be positive'),

  // Location
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  address: z.string().optional(),

  // Additional
  description: z.string().max(1000).optional(),
  mileage: z.number().min(0).optional(),
  engineCapacity: z.string().optional(),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerEmail: z.string().email('Invalid email address').min(1, 'Owner email is required'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  isAvailable: z.boolean().default(true),
});

const AddCarPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [rcDocument, setRcDocument] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(carFormSchema),
    mode: 'onTouched',
    defaultValues: {
      isAvailable: true,
      carType: 'sedan',
      fuelType: 'petrol',
      transmission: 'manual',
      seatingCapacity: 5,
    },
  });

  // Auto-generate Owner ID
  useEffect(() => {
    const generatedId = `OWNR-${Math.floor(100000 + Math.random() * 900000)}`;
    setValue('ownerId', generatedId);
  }, [setValue]);

  // Available features
  const availableFeatures = [
    'AC', 'GPS', 'Bluetooth', 'USB Charging', 'Reverse Camera',
    'Parking Sensors', 'Sunroof', 'Leather Seats', 'Keyless Entry',
    'Push Start', 'Airbags', 'ABS', 'Cruise Control', 'Music System',
    'Power Windows', 'Power Steering', 'Fog Lights', 'Alloy Wheels',
  ];

  // Handle image selection - accumulate images
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const totalImages = selectedImages.length + files.length;
    if (totalImages > 10) {
      toastUtils.error(`Maximum 10 images allowed. You already have ${selectedImages.length}, can add ${10 - selectedImages.length} more.`);
      return;
    }
    setSelectedImages(prev => [...prev, ...files]);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Handle RC document selection - images only
  const handleRcDocumentSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Validate: only image files allowed
    if (!file.type.startsWith('image/')) {
      toastUtils.error('Only image files are allowed for RC Document. Please upload JPG, PNG, or similar image.');
      e.target.value = '';
      return;
    }
    setRcDocument(file);
  };

  // Handle feature toggle
  const toggleFeature = (feature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      // Validate minimum 2 images
      if (selectedImages.length < 2) {
        toastUtils.error('Please upload at least 2 images');
        setLoading(false);
        return;
      }

      // Log form data for debugging
      console.log('📝 Form data before submission:', data);

      // Create FormData for file uploads
      const formData = new FormData();

      // Add all form fields (ensure all required fields are sent)
      formData.append('brand', data.brand || '');
      formData.append('model', data.model || '');
      formData.append('year', data.year || '');
      if (data.color) formData.append('color', data.color);
      formData.append('registrationNumber', data.registrationNumber || '');
      formData.append('carType', data.carType || '');
      formData.append('fuelType', data.fuelType || '');
      formData.append('transmission', data.transmission || '');
      formData.append('seatingCapacity', data.seatingCapacity || '');
      formData.append('pricePerDay', data.pricePerDay || '');
      if (data.pricePerWeek) formData.append('pricePerWeek', data.pricePerWeek);
      if (data.pricePerMonth) formData.append('pricePerMonth', data.pricePerMonth);
      formData.append('securityDeposit', data.securityDeposit || '');

      // Add location fields (use both formats for compatibility)
      formData.append('location[city]', data.city || '');
      formData.append('city', data.city || ''); // Also send as flat field
      if (data.state) {
        formData.append('location[state]', data.state);
        formData.append('state', data.state);
      }
      if (data.address) {
        formData.append('location[address]', data.address);
        formData.append('address', data.address);
      }

      if (data.description) formData.append('description', data.description);
      if (data.mileage) formData.append('mileage', data.mileage);
      if (data.engineCapacity) formData.append('engineCapacity', data.engineCapacity);

      // Add owner info
      formData.append('ownerName', data.ownerName || '');
      formData.append('ownerEmail', data.ownerEmail || '');
      formData.append('ownerId', data.ownerId || '');

      formData.append('isAvailable', data.isAvailable ? 'true' : 'false');

      // Add images
      selectedImages.forEach((image) => {
        formData.append('images', image);
      });

      // Add RC document
      if (rcDocument) {
        formData.append('rcDocument', rcDocument);
      }

      // Add features as JSON string
      formData.append('features', JSON.stringify(selectedFeatures));

      // Log FormData contents for debugging
      console.log('📤 FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Call API with FormData
      const response = await adminService.createCar(formData);

      if (response.success) {
        toastUtils.success('Car added successfully! It will be reviewed by admin.');
        navigate('/admin/cars');
      } else {
        toastUtils.error(response.message || 'Failed to add car');
      }
    } catch (error) {
      console.error('Error adding car:', error);
      toastUtils.error(error.response?.data?.message || 'Failed to add car');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-6 md:px-6 md:pt-4 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <button
              onClick={() => navigate('/admin/cars')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.backgroundTertiary }}>
              Add New Car
            </h1>
          </div>
          <p className="text-sm text-gray-600 ml-10 md:ml-11">Fill in all the details to add a new car</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Brand *"
                  placeholder="e.g., Toyota"
                  error={errors.brand?.message}
                  {...register('brand')}
                />
                <Input
                  label="Model *"
                  placeholder="e.g., Camry"
                  error={errors.model?.message}
                  {...register('model')}
                />
                <Input
                  type="number"
                  label="Year *"
                  placeholder="e.g., 2023"
                  error={errors.year?.message}
                  {...register('year', { valueAsNumber: true })}
                />
                <Input
                  label="Color"
                  placeholder="e.g., White"
                  error={errors.color?.message}
                  {...register('color')}
                />
                <Input
                  label="Registration Number *"
                  placeholder="e.g., MH01AB1234"
                  error={errors.registrationNumber?.message}
                  {...register('registrationNumber', {
                    onChange: (e) => {
                      // Convert to uppercase and strip non-alphanumeric characters
                      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    }
                  })}
                  className="uppercase"
                />
              </div>
            </Card>

            {/* Owner Information */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Owner Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Owner Name *"
                  placeholder="e.g., John Doe"
                  error={errors.ownerName?.message}
                  {...register('ownerName')}
                />
                <Input
                  label="Owner Email *"
                  placeholder="e.g., john@example.com"
                  error={errors.ownerEmail?.message}
                  {...register('ownerEmail')}
                />
                <Input
                  label="Owner ID *"
                  placeholder="Generated ID"
                  error={errors.ownerId?.message}
                  readOnly
                  {...register('ownerId')}
                  className="bg-gray-50"
                  helperText="This ID is automatically generated"
                />
              </div>
            </Card>

            {/* Car Type & Specifications */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Car Type & Specifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Controller
                    name="carType"
                    control={control}
                    render={({ field }) => (
                      <AdminCustomSelect
                        label="Car Type *"
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: 'sedan', label: 'Sedan' },
                          { value: 'suv', label: 'SUV' },
                          { value: 'hatchback', label: 'Hatchback' },
                          { value: 'luxury', label: 'Luxury' },
                          { value: 'sports', label: 'Sports' },
                          { value: 'compact', label: 'Compact' },
                          { value: 'muv', label: 'MUV' },
                          { value: 'coupe', label: 'Coupe' },
                        ]}
                      />
                    )}
                  />
                  {errors.carType && <p className="text-red-500 text-xs mt-1">{errors.carType.message}</p>}
                </div>
                <div>
                  <Controller
                    name="fuelType"
                    control={control}
                    render={({ field }) => (
                      <AdminCustomSelect
                        label="Fuel Type *"
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: 'petrol', label: 'Petrol' },
                          { value: 'diesel', label: 'Diesel' },
                          { value: 'electric', label: 'Electric' },
                          { value: 'hybrid', label: 'Hybrid' },
                          { value: 'cng', label: 'CNG' },
                          { value: 'petrol_cng', label: 'Petrol + CNG' },
                        ]}
                      />
                    )}
                  />
                  {errors.fuelType && <p className="text-red-500 text-xs mt-1">{errors.fuelType.message}</p>}
                </div>
                <div>
                  <Controller
                    name="transmission"
                    control={control}
                    render={({ field }) => (
                      <AdminCustomSelect
                        label="Transmission *"
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: 'manual', label: 'Manual' },
                          { value: 'automatic', label: 'Automatic' },
                          { value: 'cvt', label: 'CVT' },
                        ]}
                      />
                    )}
                  />
                  {errors.transmission && <p className="text-red-500 text-xs mt-1">{errors.transmission.message}</p>}
                </div>
                <Input
                  type="number"
                  label="Seating Capacity *"
                  placeholder="e.g., 5"
                  error={errors.seatingCapacity?.message}
                  {...register('seatingCapacity', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label="Mileage (km)"
                  placeholder="e.g., 15000"
                  error={errors.mileage?.message}
                  {...register('mileage', { valueAsNumber: true })}
                />
                <Input
                  label="Engine Capacity"
                  placeholder="e.g., 1.2L"
                  error={errors.engineCapacity?.message}
                  {...register('engineCapacity')}
                />
              </div>
            </Card>

            {/* Pricing */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Pricing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Price Per Day (₹) *"
                  placeholder="e.g., 1500"
                  error={errors.pricePerDay?.message}
                  {...register('pricePerDay', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label="Price Per Week (₹)"
                  placeholder="e.g., 10000"
                  error={errors.pricePerWeek?.message}
                  {...register('pricePerWeek', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label="Price Per Month (₹)"
                  placeholder="e.g., 40000"
                  error={errors.pricePerMonth?.message}
                  {...register('pricePerMonth', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label="Security Deposit (₹) *"
                  placeholder="e.g., 5000"
                  error={errors.securityDeposit?.message}
                  {...register('securityDeposit', { valueAsNumber: true })}
                />
              </div>
            </Card>

            {/* Location */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="City *"
                  placeholder="e.g., Mumbai"
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Input
                  label="State"
                  placeholder="e.g., Maharashtra"
                  error={errors.state?.message}
                  {...register('state')}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Address"
                    placeholder="Full address"
                    error={errors.address?.message}
                    {...register('address')}
                  />
                </div>
              </div>
            </Card>

            {/* Features */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableFeatures.map((feature) => (
                  <label key={feature} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature)}
                      onChange={() => toggleFeature(feature)}
                      className="w-4 h-4 rounded border-gray-300"
                      style={{ accentColor: colors.backgroundTertiary }}
                    />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </Card>

            {/* Images */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Car Images
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Minimum 2, Maximum 10, First image will be primary) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${colors.borderMedium}`,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary
                  }}
                />
                {selectedImages.length > 0 && (
                  <div className="mt-2">
                    <p className={`text-sm ${selectedImages.length < 2 ? 'text-red-600' : 'text-gray-600'}`}>
                      {selectedImages.length} image(s) selected {selectedImages.length < 2 && '(Minimum 2 required)'}
                    </p>
                    {/* Image Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                          />
                          {index === 0 && (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">
                              Primary
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all flex items-center justify-center z-10 border-2 border-white"
                            title="Remove image"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Documents
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RC Document (Registration Certificate) — Image only (JPG, PNG, etc.)
                </label>
                <p className="text-xs text-gray-500 mb-2">PDF files are not accepted. Please upload a clear photo/scan of the RC document.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleRcDocumentSelect}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    border: `1px solid ${colors.borderMedium}`,
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary
                  }}
                />
                {rcDocument && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={URL.createObjectURL(rcDocument)}
                      alt="RC Document Preview"
                      className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                    />
                    <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                      RC Document
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRcDocument(null);
                        // Reset input
                        const input = document.querySelector('input[accept="image/*"][type="file"]:not([multiple])');
                        if (input) input.value = '';
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all flex items-center justify-center z-10 border-2 border-white"
                      title="Remove document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-xs text-gray-500 mt-1">{rcDocument.name}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Additional Information */}
            <Card className="p-4 md:p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: colors.backgroundTertiary }}>
                Additional Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Describe the car, its condition, special features, etc."
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      border: `1px solid ${colors.borderMedium}`,
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.textPrimary
                    }}
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('isAvailable')}
                    className="w-4 h-4 rounded border-gray-300"
                    style={{ accentColor: colors.backgroundTertiary }}
                  />
                  <label className="text-sm text-gray-700">Car is available for booking</label>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/cars')}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={loading}
                disabled={loading}
              >
                Add Car
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCarPage;

