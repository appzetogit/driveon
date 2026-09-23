import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setKYCStatus, updateUser } from '../../store/slices/userSlice';
import { theme } from '../../theme/theme.constants';
import toastUtils from '../../config/toast';
import kycService from '../../services/kyc.service';

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
 * KYCStatusPage Component
 * KYC verification page with QuickEKYC integration
 * Aadhaar (OTP), PAN, Driving License
 */
const KYCStatusPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { kycStatus, user } = useAppSelector((state) => state.user);

  // Local state for form data
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [dlNumber, setDlNumber] = useState('');
  const [dlDob, setDlDob] = useState('');
  
  // OTP states for Aadhaar
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarRequestId, setAadhaarRequestId] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document verification status
  const documents = [
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      description: 'Verify your Aadhaar card via OTP',
      verified: kycStatus.aadhaar || user?.kycDetails?.aadhaar?.verified,
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
      description: 'Verify your PAN card details',
      verified: kycStatus.pan || user?.kycDetails?.pan?.verified,
      number: panNumber,
      setNumber: setPanNumber,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'drivingLicense',
      name: 'Driving License',
      description: 'Verify your Driving License details',
      verified: kycStatus.drivingLicense || user?.kycDetails?.dl?.verified,
      number: dlNumber,
      setNumber: setDlNumber,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  // Handle Aadhaar OTP Generation
  const handleGenerateAadhaarOtp = async () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      toastUtils.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kycService.generateAadhaarOTP(aadhaarNumber);
      if (response.success) {
        setAadhaarRequestId(response.data.requestId);
        setIsOtpSent(true);
        toastUtils.success('OTP sent to your Aadhaar-linked mobile number');
      } else {
        toastUtils.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toastUtils.error(error.response?.data?.message || 'Error generating Aadhaar OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Aadhaar OTP Verification
  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarOtp || aadhaarOtp.length < 6) {
      toastUtils.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kycService.verifyAadhaarOTP(aadhaarRequestId, aadhaarOtp);
      if (response.success) {
        dispatch(setKYCStatus({ aadhaar: true }));
        // Update user details in redux
        if (user) {
          const updatedUser = { ...user, kycDetails: { ...user.kycDetails, aadhaar: { ...user.kycDetails?.aadhaar, verified: true } } };
          dispatch(updateUser(updatedUser));
        }
        setIsOtpSent(false);
        toastUtils.success('Aadhaar verified successfully!');
      } else {
        toastUtils.error(response.message || 'Verification failed');
      }
    } catch (error) {
      toastUtils.error(error.response?.data?.message || 'Error verifying Aadhaar OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PAN Verification
  const handleVerifyPan = async () => {
    if (!panNumber || panNumber.length !== 10) {
      toastUtils.error('Please enter a valid 10-character PAN number');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kycService.verifyPAN(panNumber);
      if (response.success) {
        dispatch(setKYCStatus({ pan: true }));
        toastUtils.success('PAN verified successfully!');
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
        dispatch(setKYCStatus({ drivingLicense: true }));
        toastUtils.success('Driving License verified successfully!');
      } else {
        toastUtils.error(response.message || 'DL verification failed');
      }
    } catch (error) {
      toastUtils.error(error.response?.data?.message || 'Error verifying Driving License');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate overall KYC completion percentage
  const completedDocuments = documents.filter(doc => doc.verified).length;
  const completionPercentage = Math.round((completedDocuments / documents.length) * 100);

  return (
    <div className="min-h-screen pb-24 bg-white">
      {/* Header */}
      <header className="text-white relative overflow-hidden" style={{ backgroundColor: theme.colors.primary }}>
        <div className="relative px-4 pt-3 pb-2 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 -ml-1 touch-target md:p-2"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-white">KYC Verification</h1>
              <div className="w-8"></div>
            </div>
          </div>
        </div>
      </header>

      {/* KYC Status Summary */}
      <div className="px-4 pt-6 pb-2 md:pt-8 md:pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-xl font-semibold" style={{ color: theme.colors.textPrimary }}>
                KYC Status
              </h2>
              <span className={`text-xs md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-full ${
                completionPercentage === 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {completionPercentage === 100 ? 'Verified' : `${completionPercentage}% Complete`}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 mb-2 md:mb-3">
              <div
                className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
                  completionPercentage === 100 ? 'bg-green-500' : 'bg-yellow-400'
                }`}
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            
            <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
              {completedDocuments} of {documents.length} documents verified
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="px-4 py-4 md:py-6">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm md:text-lg font-semibold mb-3 md:mb-4" style={{ color: theme.colors.primary }}>
            Required Documents
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg p-4 md:p-5 shadow-sm border hover:shadow-md transition-shadow"
                style={{ borderColor: doc.verified ? theme.colors.success : theme.colors.borderLight }}
              >
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        doc.verified ? 'bg-green-100' : 'bg-purple-50'
                      }`}
                      style={!doc.verified ? { backgroundColor: `${theme.colors.primary}15` } : {}}
                    >
                      <div className="w-6 h-6 md:w-7 md:h-7" style={{ color: doc.verified ? theme.colors.success : theme.colors.primary }}>
                        {doc.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-semibold" style={{ color: theme.colors.textPrimary }}>
                        {doc.name}
                      </h4>
                      <p className="text-xs md:text-sm mt-0.5" style={{ color: theme.colors.textSecondary }}>
                        {doc.description}
                      </p>
                    </div>
                  </div>
                  
                  {doc.verified && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {!doc.verified && (
                  <div className="space-y-3">
                    {/* Aadhaar Flow */}
                    {doc.id === 'aadhaar' && (
                      <>
                        <div>
                          <label className="text-xs md:text-sm font-medium block mb-1.5" style={{ color: theme.colors.textSecondary }}>
                            Aadhaar Number
                          </label>
                          <input
                            type="text"
                            value={aadhaarNumber}
                            onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                            placeholder="Enter 12-digit Aadhaar"
                            disabled={isOtpSent || isSubmitting}
                            className="w-full px-3 py-2.5 rounded-lg bg-white border text-sm md:text-base focus:outline-none"
                            style={{ borderColor: theme.colors.borderDefault }}
                          />
                        </div>
                        {isOtpSent && (
                          <div>
                            <label className="text-xs md:text-sm font-medium block mb-1.5" style={{ color: theme.colors.textSecondary }}>
                              Enter OTP
                            </label>
                            <input
                              type="text"
                              value={aadhaarOtp}
                              onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="6-digit OTP"
                              disabled={isSubmitting}
                              className="w-full px-3 py-2.5 rounded-lg bg-white border text-sm md:text-base focus:outline-none border-blue-400"
                            />
                          </div>
                        )}
                        <button
                          onClick={isOtpSent ? handleVerifyAadhaarOtp : handleGenerateAadhaarOtp}
                          disabled={isSubmitting}
                          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90"
                          style={{ backgroundColor: theme.colors.primary, color: theme.colors.white }}
                        >
                          {isSubmitting ? 'Processing...' : isOtpSent ? 'Verify OTP' : 'Send OTP'}
                        </button>
                        {isOtpSent && (
                          <button 
                            onClick={() => setIsOtpSent(false)} 
                            className="w-full text-xs text-blue-600 hover:underline"
                          >
                            Change Number
                          </button>
                        )}
                      </>
                    )}

                    {/* PAN Flow */}
                    {doc.id === 'pan' && (
                      <>
                        <div>
                          <label className="text-xs md:text-sm font-medium block mb-1.5" style={{ color: theme.colors.textSecondary }}>
                            PAN Number
                          </label>
                          <input
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                            placeholder="Enter 10-char PAN"
                            disabled={isSubmitting}
                            className="w-full px-3 py-2.5 rounded-lg bg-white border text-sm md:text-base focus:outline-none"
                            style={{ borderColor: theme.colors.borderDefault }}
                          />
                        </div>
                        <button
                          onClick={handleVerifyPan}
                          disabled={isSubmitting}
                          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90"
                          style={{ backgroundColor: theme.colors.primary, color: theme.colors.white }}
                        >
                          {isSubmitting ? 'Verifying...' : 'Verify PAN'}
                        </button>
                      </>
                    )}

                    {/* DL Flow */}
                    {doc.id === 'drivingLicense' && (
                      <>
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="text-xs md:text-sm font-medium block mb-1.5" style={{ color: theme.colors.textSecondary }}>
                              DL Number
                            </label>
                            <input
                              type="text"
                              value={dlNumber}
                              onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                              placeholder="Enter DL Number"
                              disabled={isSubmitting}
                              className="w-full px-3 py-2.5 rounded-lg bg-white border text-sm md:text-base focus:outline-none"
                              style={{ borderColor: theme.colors.borderDefault }}
                            />
                          </div>
                          <div>
                            <label className="text-xs md:text-sm font-medium block mb-1.5" style={{ color: theme.colors.textSecondary }}>
                              Date of Birth (dd/mm/yyyy)
                            </label>
                            <input
                              type="date"
                              value={dlDob}
                              onChange={(e) => setDlDob(e.target.value)}
                              disabled={isSubmitting}
                              className="w-full px-3 py-2.5 rounded-lg bg-white border text-sm md:text-base focus:outline-none"
                              style={{ borderColor: theme.colors.borderDefault }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleVerifyDl}
                          disabled={isSubmitting}
                          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:opacity-90"
                          style={{ backgroundColor: theme.colors.primary, color: theme.colors.white }}
                        >
                          {isSubmitting ? 'Verifying...' : 'Verify DL'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {doc.verified && (
                  <div className="flex items-center gap-2 p-2 md:p-3 rounded-lg bg-green-50">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs md:text-sm font-medium text-green-700">
                      Verified Successfully
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="px-4 pb-4 md:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-blue-50 rounded-lg p-3 md:p-5 border" style={{ borderColor: `${theme.colors.primary}30` }}>
            <div className="flex items-start gap-2 md:gap-3">
              <svg className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 mt-0.5 md:mt-1" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-xs md:text-base font-semibold mb-1 md:mb-2" style={{ color: theme.colors.primary }}>
                  Quick & Secure KYC
                </h4>
                <p className="text-xs md:text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  We use secure government-authorized APIs to verify your identity. Aadhaar verification requires an OTP sent to your linked mobile number. PAN and Driving License are verified instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCStatusPage;
