import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateUser, setKYCStatus } from '../../store/slices/userSlice';
import toastUtils from '../../config/toast';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';
import kycService from '../../services/kyc.service';
import { userService } from '../../services';

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

/**
 * ModuleKYCStatusPage Component
 * KYC verification page with QuickEKYC integration
 * Aadhaar (OTP), PAN, Driving License
 */
const ModuleKYCStatusPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);

  // Local state for form data
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarRequestId, setAadhaarRequestId] = useState('');
  const [aadhaarStep, setAadhaarStep] = useState(1); // 1: Input, 2: OTP

  const [panNumberInput, setPanNumberInput] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [dlDob, setDlDob] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document verification status
  const documents = [
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      description: 'Verify your Aadhaar card via QuickEKYC',
      verified: user?.kycDetails?.aadhaar?.isVerified || user?.kycDetails?.aadhaar?.verified,
      number: aadhaarNumber,
      setNumber: setAadhaarNumber,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
    },
    {
      id: 'pan',
      name: 'PAN Card',
      description: 'Verify your PAN card via QuickEKYC',
      verified: user?.kycDetails?.pan?.isVerified || user?.kycDetails?.pan?.verified,
      number: panNumberInput,
      setNumber: setPanNumberInput,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'drivingLicense',
      name: 'Driving License',
      description: 'Verify your Driving License via QuickEKYC',
      verified: user?.kycDetails?.dl?.isVerified || user?.kycDetails?.dl?.verified,
      number: dlNumber,
      setNumber: setDlNumber,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  // Refresh profile helper
  const refreshProfile = async () => {
    try {
      const profileRes = await userService.getProfile();
      if (profileRes?.data?.user) {
        dispatch(updateUser(profileRes.data.user));
      }
    } catch (err) {
      console.error('Refresh profile error:', err);
    }
  };

  // Handle Aadhaar OTP Generation
  const handleSendAadhaarOtp = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toastUtils.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kycService.generateAadhaarOTP(aadhaarNumber);
      if (response.success && (response.data?.requestId || response.data?.request_id)) {
        setAadhaarRequestId(response.data.requestId || response.data.request_id);
        setAadhaarStep(2);
        toastUtils.success('OTP sent successfully!');
      } else {
        toastUtils.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toastUtils.error(error.response?.data?.message || 'Error generating OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Aadhaar OTP Verification
  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarOtp || aadhaarOtp.length < 6) {
      toastUtils.error('Please enter 6-digit OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kycService.verifyAadhaarOTP(aadhaarRequestId, aadhaarOtp);
      if (response.success) {
        toastUtils.success('Aadhaar verified successfully!');
        await refreshProfile();
        setAadhaarStep(1);
      } else {
        toastUtils.error(response.message || 'Verification failed');
      }
    } catch (error) {
      toastUtils.error(error.response?.data?.message || 'Error verifying OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PAN Verification
  const handleVerifyPan = async () => {
    if (!panNumberInput || panNumberInput.length !== 10) {
      toastUtils.error('Please enter valid 10-char PAN');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kycService.verifyPAN(panNumberInput.toUpperCase());
      if (response.success) {
        toastUtils.success('PAN verified successfully!');
        await refreshProfile();
      } else {
        toastUtils.error(response.message || 'PAN verification failed');
      }
    } catch (error) {
      toastUtils.error(error.response?.data?.message || 'Error verifying PAN');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle DL Verification
  const handleVerifyDl = async () => {
    if (!dlNumber || !dlDob) {
      toastUtils.error('DL number and Date of Birth are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = formatDateToDDMMYYYY(dlDob);
      const response = await kycService.verifyDL(dlNumber, formattedDate);
      if (response.success) {
        toastUtils.success('Driving License verified successfully!');
        await refreshProfile();
      } else {
        toastUtils.error(response.message || 'DL verification failed');
      }
    } catch (error) {
      toastUtils.error(error.response?.data?.message || 'Error verifying DL');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate overall KYC completion percentage
  const completedDocuments = documents.filter(doc => doc.verified).length;
  const completionPercentage = Math.round((completedDocuments / documents.length) * 100);

  const iconBgColor = colors.backgroundPrimary || '#F3F4F6';

  return (
    <div 
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div 
          className="px-4 pt-4 pb-4 rounded-b-3xl"
          style={{ backgroundColor: colors.textPrimary || '#1C205C' }}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white flex-1 text-center">KYC Verification</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="px-4 pt-6 pb-2">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-black">Overall Status</h2>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                user?.isKYCVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user?.isKYCVerified ? 'Verified' : `${completionPercentage}% Complete`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${user?.isKYCVerified ? 'bg-green-500' : 'bg-yellow-400'}`}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="px-4 py-4 space-y-4">
          <h3 className="text-sm font-semibold text-black">Required Documents</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${doc.verified ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {doc.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-black">{doc.name}</h4>
                    <p className="text-[10px] text-gray-500">{doc.description}</p>
                  </div>
                  {doc.verified && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {!doc.verified ? (
                  <div className="space-y-3">
                    {doc.id === 'aadhaar' && (
                      <>
                        <input
                          type="text"
                          value={aadhaarNumber}
                          onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                          placeholder="12-digit Aadhaar Number"
                          disabled={aadhaarStep === 2 || isSubmitting}
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                        />
                        {aadhaarStep === 2 && (
                          <input
                            type="text"
                            value={aadhaarOtp}
                            onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6-digit OTP"
                            className="w-full px-3 py-2 text-sm border-2 border-blue-400 rounded-lg focus:outline-none"
                          />
                        )}
                        <button
                          onClick={aadhaarStep === 2 ? handleVerifyAadhaarOtp : handleSendAadhaarOtp}
                          disabled={isSubmitting}
                          className="w-full py-2.5 rounded-lg font-bold text-sm bg-blue-600 text-white disabled:opacity-50"
                        >
                          {isSubmitting ? '...' : aadhaarStep === 2 ? 'Verify via QuickEKYC' : 'Send OTP via QuickEKYC'}
                        </button>
                      </>
                    )}

                    {doc.id === 'pan' && (
                      <>
                        <input
                          type="text"
                          value={panNumberInput}
                          onChange={(e) => setPanNumberInput(e.target.value.toUpperCase().slice(0, 10))}
                          placeholder="PAN Number (ABCDE1234F)"
                          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none uppercase"
                        />
                        <button
                          onClick={handleVerifyPan}
                          disabled={isSubmitting || panNumberInput.length !== 10}
                          className="w-full py-2.5 rounded-lg font-bold text-sm bg-blue-600 text-white disabled:opacity-50"
                        >
                          {isSubmitting ? '...' : 'Verify via QuickEKYC'}
                        </button>
                      </>
                    )}

                    {doc.id === 'drivingLicense' && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-700">Driving License Number</label>
                          <input
                            type="text"
                            value={dlNumber}
                            onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                            placeholder="Driving License Number"
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-700">Date of Birth (dd/mm/yyyy)</label>
                          <input
                            type="date"
                            value={dlDob}
                            onChange={(e) => setDlDob(e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={handleVerifyDl}
                          disabled={isSubmitting || !dlNumber || !dlDob}
                          className="w-full py-2.5 rounded-lg font-bold text-sm bg-blue-600 text-white disabled:opacity-50"
                        >
                          {isSubmitting ? '...' : 'Verify via QuickEKYC'}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs font-medium text-green-700">Verified via QuickEKYC</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="px-4 pb-8">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs leading-relaxed text-blue-800">
              DriveOn uses QuickEKYC for secure and instant verification of your government documents. No physical copies needed.
            </p>
          </div>
        </div>
      </div>
      <div className="md:hidden"><BottomNavbar /></div>
    </div>
  );
};

export default ModuleKYCStatusPage;

