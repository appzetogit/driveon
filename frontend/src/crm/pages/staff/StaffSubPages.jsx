import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-hot-toast';
import razorpayService from '../../../services/razorpay.service';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import { requestForToken, isMobileApp } from '../../../services/firebase';
import {
  MdFolderOpen,
  MdSearch,
  MdAdd,
  MdFilterList,
  MdPhone,
  MdEmail,
  MdVisibility,
  MdVisibilityOff,
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdSecurity,
  MdGroup,
  MdAccessTime,
  MdEventAvailable,
  MdDateRange,
  MdCurrencyRupee,
  MdReceipt,
  MdAssignment,
  MdFlag,
  MdCheckCircle,
  MdCheck,
  MdClose,
  MdArrowBack,
  MdLocationOn,
  MdMap
} from 'react-icons/md';
import { jsPDF } from 'jspdf';
import { premiumColors } from '../../../theme/colors';
import { motion, AnimatePresence } from 'framer-motion';
import ThemedDropdown from '../../components/ThemedDropdown';

/**
 * Generic Placeholder for Staff Sub-Pages
 */
const StaffPlaceholder = ({ title, subtitle }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 mb-4">
          <MdFolderOpen size={40} />
        </div>
        <h3 className="text-xl font-semibold text-gray-700">Module: {title}</h3>
        <p className="text-gray-500 max-w-sm mt-2">
          This "Staff Operations" module page is ready. It will contain specific features for "{title}".
        </p>
      </div>
    </div>
  );
};

// --- Modals ---


const StaffActionMenu = ({ staff, onEdit, onDelete, onChangeStatus, isOpen, onClose }) => {
  if (!isOpen) return null;

  const statuses = ['Active', 'On Duty', 'Leave'];

  return (
    <div className="relative">
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { onEdit(staff); onClose(); }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#212c40]/5 hover:text-[#212c40] flex items-center gap-2 transition-colors font-medium"
        >
          <MdEdit size={16} /> Edit Details
        </button>
        <button
          onClick={() => { onDelete(staff.id); onClose(); }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
        >
          <MdDelete size={16} /> Delete Staff
        </button>
      </motion.div>
    </div>
  );
};

/**
 * AddStaffModal - Modal for adding new staff members
 */
const AddStaffModal = ({ isOpen, onClose, onSubmit, editingStaff, staffList = [] }) => {
  const [step, setStep] = useState(1);
  const modalScrollRef = useRef(null);
  const [salaryMethod, setSalaryMethod] = useState('Monthly');
  const [aadharFile, setAadharFile] = useState(null);
  const [aadharPreview, setAadharPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const formatLocalDate = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    status: 'Active',
    phone: '',
    email: '',
    password: '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full Time',
    salary: '',
    workingDays: '26',
    absentDeduction: '',
    halfDayDeduction: '',
    overtimeRate: '',
    insuranceNote: ''
  });

  const [errors, setErrors] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchRoles = async () => {
        try {
          const response = await api.get('/crm/roles');
          if (response.data.success) {
            setAvailableRoles(response.data.data.roles.map(r => r.roleName));
          }
        } catch (error) {
          console.error("Error fetching roles:", error);
        }
      };
      fetchRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowPassword(false);
      if (editingStaff) {
        setFormData({
          name: editingStaff.name || '',
          role: editingStaff.role || '',
          status: editingStaff.status || 'Active',
          phone: editingStaff.phone ? editingStaff.phone.replace(/^\+91\s*/, '') : '',
          email: editingStaff.email || '',
          password: editingStaff.plainTextPassword || '********',
          joiningDate: formatLocalDate(editingStaff.joiningDate || editingStaff.joinDate) || formatLocalDate(new Date()),
          employmentType: editingStaff.employmentType || 'Full Time',
          salary: editingStaff.salary || '',
          workingDays: editingStaff.workingDays || '26',
          absentDeduction: editingStaff.absentDeduction || '',
          halfDayDeduction: editingStaff.halfDayDeduction || '',
          overtimeRate: editingStaff.overtimeRate || '',
          insuranceNote: editingStaff.insuranceNote || ''
        });
        setStep(1);
        setSalaryMethod(editingStaff.salaryMethod || 'Monthly');
        setAadharFile(null);
        setAadharPreview(editingStaff.aadharCard || '');
        setErrors({});
      } else {
        setFormData({
          name: '',
          role: '',
          status: 'Active',
          phone: '',
          email: '',
          password: '',
          joiningDate: formatLocalDate(new Date()),
          employmentType: 'Full Time',
          salary: '',
          workingDays: '26',
          absentDeduction: '',
          halfDayDeduction: '',
          overtimeRate: '',
          insuranceNote: ''
        });
        setStep(1);
        setSalaryMethod('Monthly');
        setAadharFile(null);
        setAadharPreview('');
        setErrors({});
      }
    }
  }, [isOpen, editingStaff]);

  // Auto-calculation of deductions removed as per user request
  // useEffect(() => { ... }, []);

  const validateStep1 = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = "Full Name is required";
    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    } else {
      // Check duplicate phone locally (strip non-digits and compare last 10 digits)
      const rawPhone = formData.phone.replace(/\D/g, '');
      const duplicatePhone = staffList.some(s => {
        const sRaw = (s.phone || '').replace(/\D/g, '');
        return sRaw.slice(-10) === rawPhone.slice(-10) && (!editingStaff || s.id !== editingStaff.id);
      });
      if (duplicatePhone) {
        newErrors.phone = "Phone number already registered for another staff member";
      }
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else {
      // Check duplicate email locally (trim and lowercase)
      const inputEmail = formData.email.trim().toLowerCase();
      const duplicateEmail = staffList.some(s => 
        (s.email || '').trim().toLowerCase() === inputEmail && 
        (!editingStaff || s.id !== editingStaff.id)
      );
      if (duplicateEmail) {
        newErrors.email = "Email already registered for another staff member";
      }
    }

    if (!editingStaff && !formData.password) newErrors.password = "Password is required";
    if (!editingStaff && !aadharFile) {
      newErrors.aadhar = "Aadhar card image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    let newErrors = {};
    if (salaryMethod === 'Monthly') {
      if (!formData.salary) newErrors.salary = "Base salary is required for monthly staff";
    } else if (salaryMethod === 'Per Trip') {
      if (!formData.salary) newErrors.salary = "Per trip amount is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(step + 1);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      phone: `+91 ${formData.phone}`,
      salaryMethod,
      aadharFile
    };
    onSubmit(submitData);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl shadow-2xl bg-white overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 hidden md:flex">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Step {step} of 3: {step === 1 ? 'Basic Details' : step === 2 ? 'Salary Configuration' : 'Final Review'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MdClose size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        {/* Mobile Header */}
        <div className="bg-white px-4 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 md:hidden">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{editingStaff ? 'Edit Staff' : 'Add Staff'}</h2>
            <p className="text-xs text-gray-500">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full"><MdClose size={20} /></button>
        </div>

        {/* Content */}
        <div ref={modalScrollRef} className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                  className={`w-full px-4 py-3 bg-white border ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-500/20'} rounded-xl focus:ring-2 focus:border-indigo-500 outline-none transition-all font-medium text-gray-800`}
                  placeholder="Rajesh Kumar"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
              </div>

              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Role *</label>
                <div className={`${errors.role ? 'border border-red-300 rounded-xl' : ''}`}>
                  <ThemedDropdown
                    options={availableRoles.length > 0 ? availableRoles : ['Sales Manager', 'Driver', 'Mechanic', 'Accountant', 'Admin Executive']}
                    value={formData.role}
                    onChange={(val) => {
                      setFormData({ ...formData, role: val });
                      if (val === 'Driver' && salaryMethod === 'Daily') {
                        setSalaryMethod('Monthly');
                      }
                      if (errors.role) setErrors({ ...errors, role: null });
                    }}
                    placeholder="Select Role"
                    className="w-full"
                  />
                </div>
                {errors.role && <p className="text-red-500 text-xs mt-1 font-medium">{errors.role}</p>}
              </div>

              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Employment</label>
                <ThemedDropdown
                  options={['Full Time', 'Part Time', 'Contract', 'Intern']}
                  value={formData.employmentType}
                  onChange={(val) => setFormData({ ...formData, employmentType: val })}
                  placeholder="Select..."
                  onOpen={() => {
                    if (modalScrollRef.current) {
                      modalScrollRef.current.scrollBy({ top: 150, behavior: 'smooth' });
                    }
                  }}
                />
              </div>

              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Phone *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-500/20'} rounded-xl focus:bg-white focus:ring-2 focus:border-indigo-500 outline-none transition-all font-mono text-gray-800`}
                    placeholder="98765 43210"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
              </div>

              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: null });
                  }}
                  className={`w-full px-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-500/20'} rounded-xl focus:bg-white focus:ring-2 focus:border-indigo-500 outline-none transition-all text-gray-800`}
                  placeholder="rajesh@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
              </div>

              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Password {editingStaff ? '(Optional)' : '*'}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: null });
                    }}
                    className={`w-full pl-4 pr-10 py-3 bg-white border ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-500/20'} rounded-xl focus:ring-2 focus:border-indigo-500 outline-none transition-all text-gray-800`}
                    placeholder={editingStaff ? "Leave blank to keep current" : "Set login password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
              </div>

              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Joining Date</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-800"
                />
              </div>

              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Aadhar Card Image {!editingStaff && ' *'}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="aadhar-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setAadharFile(file);
                        setAadharPreview(URL.createObjectURL(file));
                        if (errors.aadhar) setErrors({ ...errors, aadhar: null });
                      }
                    }}
                  />
                  <label
                    htmlFor="aadhar-upload"
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 cursor-pointer transition-all text-sm font-medium text-gray-700"
                  >
                    <span className="truncate max-w-[150px]">
                      {aadharFile ? aadharFile.name : "Upload Aadhar..."}
                    </span>
                    <span className="text-indigo-600 font-bold hover:underline shrink-0">Browse</span>
                  </label>
                </div>
                {errors.aadhar && <p className="text-red-500 text-xs mt-1 font-medium">{errors.aadhar}</p>}
                {aadharPreview && (
                  <div className="mt-2 relative w-20 h-12 rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img src={aadharPreview} alt="Aadhar Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Note for Insurance Policy</label>
                <textarea
                  rows="2"
                  value={formData.insuranceNote}
                  onChange={(e) => setFormData({ ...formData, insuranceNote: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-800 font-medium"
                  placeholder="Enter details regarding insurance policy (e.g. policy number, coverage, expiry date)"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 min-h-[280px] pb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Salary Structure Method</label>
                  <ThemedDropdown
                    options={formData.role === 'Driver' ? ['Monthly', 'Per Trip'] : ['Monthly', 'Daily', 'Per Trip']}
                    value={salaryMethod}
                    onChange={(val) => setSalaryMethod(val)}
                    placeholder="Select Type"
                    className="w-full"
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    {salaryMethod === 'Per Trip' ? 'Per Trip Amount (₹) *' : 'Base Pay Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => {
                      setFormData({ ...formData, salary: e.target.value });
                      if (errors.salary) setErrors({ ...errors, salary: null });
                    }}
                    className={`w-full px-4 py-3 bg-white border ${errors.salary ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-500/20'} rounded-xl focus:ring-2 focus:border-indigo-500 outline-none transition-all font-bold text-lg text-gray-900`}
                    placeholder={salaryMethod === 'Per Trip' ? 'e.g. 500' : 'e.g. 25000'}
                  />
                  {errors.salary && <p className="text-red-500 text-xs mt-1 font-medium">{errors.salary}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-100">
                <MdCheckCircle className="text-green-500" size={48} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Set!</h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                You are about to add <span className="font-bold text-gray-800">{formData.name}</span> as a <span className="font-bold text-gray-800">{formData.role}</span>.
              </p>

              <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-6 text-left grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Salary Type</label>
                  <p className="font-bold text-gray-900 text-lg">{salaryMethod}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Base Pay</label>
                  <p className="font-bold text-gray-900 text-lg">₹{formData.salary || '0'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
                  <p className="font-bold text-gray-900 text-lg font-mono">+91 {formData.phone}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-100 p-6 flex justify-between items-center z-10">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-6 py-3 rounded-xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-8 py-3 rounded-xl bg-[#1C205C] text-white font-bold shadow-lg shadow-indigo-200 hover:bg-[#2a306e] transition-all transform hover:-translate-y-0.5"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all transform hover:-translate-y-0.5"
            >
              Confirm & Add
            </button>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const ViewStaffModal = ({ isOpen, onClose, staff }) => {
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl shadow-2xl bg-white overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Staff Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <MdClose size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            {staff.avatar ? (
              <img 
                src={staff.avatar} 
                alt={staff.name} 
                onClick={() => setShowFullImage(true)}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md bg-gray-50 shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#212c40]/10 flex items-center justify-center text-[#212c40] text-2xl font-bold border-2 border-white shadow-sm shrink-0">
                {staff.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{staff.name}</h3>
              <span className="px-2.5 py-1 bg-[#212c40]/10 text-[#212c40] rounded-lg text-xs font-bold uppercase tracking-wide">
                {staff.role}
              </span>
            </div>
          </div>



          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#212c40]/10 flex items-center justify-center text-[#212c40]">
                <MdPhone size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">Phone</p>
                <p className="font-medium font-mono">{staff.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#212c40]/10 flex items-center justify-center text-[#212c40]">
                <MdEmail size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">Email</p>
                <p className="font-medium">{staff.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#212c40]/10 flex items-center justify-center text-[#212c40]">
                <MdAccessTime size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">Joined On</p>
                <p className="font-medium">{staff.joinDate || 'N/A'}</p>
              </div>
            </div>
            {staff.aadharCard && (
              <div className="flex items-center gap-3 text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-[#212c40]/10 flex items-center justify-center text-[#212c40]">
                  <MdVisibility size={18} />
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Aadhar Card</p>
                    <p className="font-medium text-xs text-indigo-600">Document Uploaded</p>
                  </div>
                  <a
                    href={staff.aadharCard}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg"
                  >
                    View Card
                  </a>
                </div>
              </div>
            )}
            {staff.insuranceNote && (
              <div className="flex items-start gap-3 text-gray-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                  <MdAssignment size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-amber-800 font-bold">Insurance Policy Note</p>
                  <p className="font-medium text-xs text-gray-700 mt-1 whitespace-pre-wrap">{staff.insuranceNote}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
      {/* Lightbox / Full Image View */}
      {showFullImage && staff.avatar && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer animate-fadeIn"
          onClick={() => setShowFullImage(false)}
        >
          <div 
            className="relative max-w-xl max-h-[85vh] bg-white rounded-3xl p-3 shadow-2xl flex flex-col items-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={staff.avatar} 
              alt={staff.name} 
              className="max-w-full max-h-[70vh] rounded-2xl object-contain shadow-sm bg-gray-50"
            />
            <div className="text-center font-bold text-gray-800 text-sm mt-3.5 pb-1">
              {staff.name}'s Profile Photo
            </div>
            <button 
              onClick={() => setShowFullImage(false)}
              className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95"
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export const StaffDirectoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const initialSearch = urlParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const [roleFilter, setRoleFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    fetchStaff();
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/crm/roles');
      if (response.data.success) {
        setAvailableRoles(response.data.data.roles.map(r => r.roleName));
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/crm/staff');
      if (response.data.success) {
        setStaffList(response.data.data.staff.map(staff => ({
          ...staff,
          id: staff._id, // Map _id to id for frontend compatibility
          joinDate: new Date(staff.joiningDate || staff.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        })));
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffList.filter(staff => {
    const searchLower = searchTerm.toLowerCase().trim();
    let matchesSearch = true;
    if (searchLower) {
      const keywords = searchLower.split(/\s+/);
      matchesSearch = keywords.every(keyword =>
        (staff.name || '').toLowerCase().includes(keyword) ||
        (staff.role || '').toLowerCase().includes(keyword)
      );
    }
    const matchesRole = roleFilter === 'All' || roleFilter === 'All Roles' || staff.role === roleFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'All Time') {
      const joinTime = new Date(staff.joiningDate || staff.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'Today':
          matchesDate = joinTime.toDateString() === now.toDateString();
          break;
        case 'This Week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = joinTime >= weekAgo;
          break;
        }
        case 'This Month': {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = joinTime >= monthAgo;
          break;
        }
        case 'This Year': {
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          matchesDate = joinTime >= yearAgo;
          break;
        }
        case 'Custom Range': {
          const start = customStartDate ? new Date(customStartDate) : null;
          const end = customEndDate ? new Date(customEndDate) : null;
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);
          
          if (start && end) {
            matchesDate = joinTime >= start && joinTime <= end;
          } else if (start) {
            matchesDate = joinTime >= start;
          } else if (end) {
            matchesDate = joinTime <= end;
          }
          break;
        }
      }
    }
    
    return matchesSearch && matchesRole && matchesDate;
  });

  const handleAddStaff = async (newStaff) => {
    try {
      // Fetch FCM Token before creating staff (using Admin's current browser token as initial)
      let fcmToken = null;
      try {
        fcmToken = await requestForToken();
        console.log("FCM Token captured during Staff Creation:", fcmToken);
      } catch (err) {
        console.warn("Could not capture FCM token for new staff:", err);
      }

      const payload = {
        ...newStaff,
        fcmToken: fcmToken,
        platform: isMobileApp() ? 'mobile' : 'web'
      };

      // Construct FormData if there is a file to upload
      let requestData = payload;
      let config = {};

      if (newStaff.aadharFile) {
        const formDataObj = new FormData();
        // Append all text fields
        Object.keys(payload).forEach(key => {
          if (key !== 'aadharFile') {
            formDataObj.append(key, payload[key]);
          }
        });
        // Append file
        formDataObj.append('aadharCard', newStaff.aadharFile);
        requestData = formDataObj;
        config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
      }

      if (editingStaff) {
        const response = await api.put(`/crm/staff/${editingStaff.id}`, requestData, config);
        if (response.data.success) {
          fetchStaff();
          setEditingStaff(null);
          toast.success('Staff updated successfully');
        }
      } else {
        const response = await api.post('/crm/staff', requestData, config);
        if (response.data.success) {
          fetchStaff();
          toast.success('Staff created successfully');
        }
      }
    } catch (error) {
      console.error("Error saving staff:", error);
      toast.error(error.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleEditClick = (staff) => {
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleViewClick = (staff) => {
    setViewingStaff(staff);
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        const response = await api.delete(`/crm/staff/${staffId}`);
        if (response.data.success) {
          fetchStaff(); // Refresh list
        }
      } catch (error) {
        console.error("Error deleting staff:", error);
      }
    }
  };

  const handleChangeStatus = async (staffId, newStatus) => {
    try {
      const response = await api.put(`/crm/staff/${staffId}`, { status: newStatus });
      if (response.data.success) {
        setStaffList(staffList.map(s =>
          s.id === staffId ? { ...s, status: newStatus } : s
        ));
      }
      setActiveMenuId(null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-100">Active</span>;
      case 'On Duty': return <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">On Duty</span>;
      case 'Leave': return <span className="px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-bold border border-red-100">Leave</span>;
      default: return <span className="px-2 py-1 rounded bg-gray-50 text-gray-700 text-xs font-bold border border-gray-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <ViewStaffModal
        isOpen={!!viewingStaff}
        onClose={() => setViewingStaff(null)}
        staff={viewingStaff}
      />
      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingStaff(null); }}
        onSubmit={handleAddStaff}
        editingStaff={editingStaff}
        staffList={staffList}
      />
      {/* Note: I am assuming AddStaffModal is the one used. But wait, there is StaffFormModal too. */}
      {/* Looking at original code: <AddStaffModal isOpen={isModalOpen} ... /> line 474. */}
      {/* And AddStaffModal definition at line 268 does NOT take editingStaff prop. StaffFormModal does. */}
      {/* However, my mandate is 'ui ko mat bigadna'. If I switch to StaffFormModal, UI changes. */}
      {/* I will stick to AddStaffModal but I will update it separately if needed or just handle Add. */}
      {/* Wait, handleEditClick sets editingStaff, but AddStaffModal doesn't use it. */}
      {/* I will use the existing AddStaffModal but injecting initial data if editing? */}
      {/* Actually, looking at line 69 StaffFormModal... it seems unused in StaffDirectoryPage (line 474 uses AddStaffModal). */}
      {/* I will create a wrapper or modify AddStaffModal to accept initialData if I want Edit to work properly? */}
      {/* Or, since the user asks to connect functionality, and Edit is part of it. */}
      {/* I will proceed with AddStaffModal for now and ensure Add works perfectly. The Edit functionality might require updating the Modal component slightly or using the other one. */}
      {/* Let's double check handleEditClick usage. It opens modal. But modal doesn't populate. */}
      {/* I will update AddStaffModal to accept `initialData` to support Edit without changing UI. */}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
            <span>/</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/staff/directory')}>Staff</span>
            <span>/</span>
            <span className="text-gray-800 font-medium">Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-gray-500 text-sm">Manage all staff members and their details</p>
        </div>
        <button
          onClick={() => { setEditingStaff(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-colors"
          style={{ backgroundColor: premiumColors.primary.DEFAULT }}
        >
          <MdAdd size={20} />
          Add New Staff
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search Name, Role..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-[180px]">
            <ThemedDropdown
              options={['All Roles', ...availableRoles]}
              value={roleFilter === 'All' ? 'All Roles' : roleFilter}
              onChange={(val) => setRoleFilter(val === 'All Roles' ? 'All' : val)}
              className="w-full"
            />
          </div>
          <div className="relative w-full sm:w-[180px]">
            <ThemedDropdown
              options={['All Time', 'Today', 'This Week', 'This Month', 'This Year', 'Custom Range']}
              value={dateFilter}
              onChange={(val) => setDateFilter(val)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {dateFilter === 'Custom Range' && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-semibold text-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm font-semibold text-gray-700"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4">Staff Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Salary</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {staff.avatar ? (
                        <img 
                          src={staff.avatar} 
                          alt={staff.name} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm bg-gray-50 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#212c40]/10 flex items-center justify-center text-[#212c40] font-bold text-sm shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{staff.name}</div>
                        <div className="text-xs text-gray-400">ID: STF-{String(staff.id).slice(-4)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-800">{staff.role}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MdPhone size={14} className="text-gray-400" /> {staff.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-0.5">
                      <MdEmail size={14} className="text-gray-400" /> {staff.email}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">
                    {staff.joinDate}
                  </td>
                  <td className="p-4 font-medium text-gray-900">
                    ₹ {(Number(staff.salary || staff.baseSalary || 0) - Number(staff.absentDeduction || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewClick(staff)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <MdVisibility size={18} />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === staff.id ? null : staff.id)}
                          className={`p-2 rounded-xl transition-all shadow-sm border border-transparent 
                                        ${activeMenuId === staff.id ? 'bg-[#212c40] text-white shadow-lg shadow-gray-200' : 'text-gray-400 hover:text-gray-800 hover:bg-white hover:border-gray-200'}
                                    `}
                        >
                          <MdMoreVert size={18} />
                        </button>
                        <StaffActionMenu
                          staff={staff}
                          isOpen={activeMenuId === staff.id}
                          onClose={() => setActiveMenuId(null)}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteStaff}
                          onChangeStatus={handleChangeStatus}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}


              {!loading && filteredStaff.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No staff members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
// Premium Permission Groups Config
const PERMISSION_GROUPS = {
  attendance: {
    title: 'Attendance',
    permissions: [
      { key: 'attendance.manage', label: 'View & Mark Attendance' }
    ]
  },
  enquiries: {
    title: 'Enquiries',
    permissions: [
      { key: 'enquiries.view', label: 'View Enquiries' }
    ]
  },
  bookings: {
    title: 'Bookings',
    permissions: [
      { key: 'bookings.view', label: 'View Assigned Bookings' }
    ]
  }
};

const AddRoleModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    role: '',
    description: '',
    access: 'Custom',
    permissions: []
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          role: initialData.role || '',
          description: initialData.description || '',
          access: initialData.access || 'Custom',
          permissions: initialData.permissions || []
        });
      } else {
        setFormData({
          role: '',
          description: '',
          access: 'Custom',
          permissions: []
        });
      }
    }
  }, [isOpen, initialData]);

  const handlePermissionToggle = (key) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      const updated = current.includes(key)
        ? current.filter(k => k !== key)
        : [...current, key];
      return { ...prev, permissions: updated };
    });
  };

  const handleSectionToggle = (sectionPermissions) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      const groupKeys = sectionPermissions.map(p => p.key);
      const allSelected = groupKeys.every(k => current.includes(k));

      let updated;
      if (allSelected) {
        // Deselect all in this section
        updated = current.filter(k => !groupKeys.includes(k));
      } else {
        // Select all in this section (prevent duplicates)
        updated = Array.from(new Set([...current, ...groupKeys]));
      }
      return { ...prev, permissions: updated };
    });
  };

  const handleGlobalToggle = () => {
    setFormData(prev => {
      const current = prev.permissions || [];
      const allKeys = Object.values(PERMISSION_GROUPS).flatMap(g => g.permissions.map(p => p.key));
      const allSelected = allKeys.every(k => current.includes(k));

      return {
        ...prev,
        permissions: allSelected ? [] : allKeys
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const allPermissionsList = Object.values(PERMISSION_GROUPS).flatMap(g => g.permissions.map(p => p.key));
  const isAllGlobalSelected = allPermissionsList.every(k => (formData.permissions || []).includes(k));

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-100"
          >
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">{initialData ? 'Edit Role & Permissions' : 'Add New Role'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Configure access privileges and platform powers for this role.</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <MdClose size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Row 1: Role Name & Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">Role Name *</label>
                    <input
                      required
                      placeholder="e.g. Telecaller, Driver, HR"
                      className="w-full mt-1.5 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-[#1C205C] bg-gray-50/50 font-semibold text-gray-800 transition-all"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">Short Description</label>
                    <input
                      placeholder="Describe role responsibilities..."
                      className="w-full mt-1.5 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-[#1C205C] bg-gray-50/50 font-semibold text-gray-800 transition-all"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                {/* Permissions Checklist Area */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900">Module-wise Access Permissions</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Toggle checkboxes to enable or disable operations for this role.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGlobalToggle}
                      className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 active:scale-95 transition-all shrink-0 w-fit"
                    >
                      {isAllGlobalSelected ? 'Deselect All' : 'Select All Permissions'}
                    </button>
                  </div>

                  {/* Grid of Permission Groups */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                      const groupKeys = group.permissions.map(p => p.key);
                      const allSelected = groupKeys.every(k => (formData.permissions || []).includes(k));

                      return (
                        <div key={groupKey} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col">
                          {/* Section Header */}
                          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
                            <h5 className="text-xs font-black text-[#1C205C] tracking-wide uppercase">{group.title}</h5>
                            <button
                              type="button"
                              onClick={() => handleSectionToggle(group.permissions)}
                              className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                            >
                              {allSelected ? 'None' : 'All'}
                            </button>
                          </div>

                          {/* List of Checkboxes */}
                          <div className="space-y-2 flex-1">
                            {group.permissions.map(p => {
                              const isChecked = (formData.permissions || []).includes(p.key);
                              return (
                                <label
                                  key={p.key}
                                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none
                                    ${isChecked
                                      ? 'bg-indigo-50/40 border-indigo-100 text-indigo-900 shadow-sm shadow-indigo-50'
                                      : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50/50 hover:border-gray-200'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handlePermissionToggle(p.key)}
                                    className="rounded text-[#1C205C] focus:ring-indigo-500 border-gray-300 w-4 h-4"
                                  />
                                  <span className="text-xs font-bold">{p.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons (Sticky Footer) */}
              <div className="border-t border-gray-100 p-6 flex items-center justify-end gap-3 bg-gray-50/50 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1C205C] hover:bg-[#2a3550] text-white font-extrabold rounded-xl text-sm transition-all shadow-lg active:scale-95"
                  style={{ backgroundColor: premiumColors.primary.DEFAULT }}
                >
                  {initialData ? 'Update Role' : 'Save Role'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const RoleDetails = ({ role, staffList = [], onBack }) => {
  const navigate = useNavigate();

  // Find assigned staff - exact match (case-insensitive)
  const assignedStaff = staffList.filter(s =>
    s.role && role.role && s.role.toLowerCase() === role.role.toLowerCase()
  ).map(s => ({ ...s, id: s._id || s.id }));

  const [activeTab, setActiveTab] = useState('permissions');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header / Nav */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-xl border border-gray-200 transition-colors shadow-sm">
          <MdArrowBack size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{role.role}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Roles</span> <span>/</span> <span className="text-[#1C205C] font-semibold">Details</span>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:items-start justify-between">
          <div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold tracking-wide uppercase mb-3 inline-block">
              {role.access || 'Custom'} Access
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{role.role}</h2>
            <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">{role.description || 'No description provided.'}</p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 shrink-0">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100">
              <MdGroup size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{assignedStaff.length}</p>
              <p className="text-sm text-gray-500 font-medium">Active Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'permissions' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Permissions & Access
          {activeTab === 'permissions' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'staff' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Assigned Staff ({assignedStaff.length})
          {activeTab === 'staff' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'permissions' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
              const groupPermissions = group.permissions;
              const activeCount = groupPermissions.filter(p => (role.permissions || []).includes(p.key)).length;

              return (
                <div key={groupKey} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50">
                    <h4 className="text-xs font-black text-gray-900 tracking-wide uppercase">{group.title}</h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                      {activeCount} / {groupPermissions.length} Active
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupPermissions.map(p => {
                      const isEnabled = (role.permissions || []).includes(p.key);
                      return (
                        <div key={p.key} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-50/50 hover:bg-gray-50/50 transition-colors">
                          <span className={`text-xs font-semibold ${isEnabled ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{p.label}</span>
                          {isEnabled ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <MdCheck size={12} /> Enabled
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                              <MdClose size={12} /> Disabled
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'staff' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {assignedStaff.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">Staff ID</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignedStaff.map(staff => (
                    <tr key={staff.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                        {staff.avatar ? (
                          <img 
                            src={staff.avatar} 
                            alt={staff.name} 
                            className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-sm bg-gray-50 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                            {staff.name ? staff.name.charAt(0) : 'S'}
                          </div>
                        )}
                        {staff.name}
                      </td>
                      <td className="p-4 text-gray-500 font-medium text-sm">{staff.employeeId || `STF-${staff.id?.slice(-6) || '000'}`}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => navigate(`/crm/staff/directory?search=${encodeURIComponent(staff.name)}`)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">View Profile</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-3">
                  <MdGroup size={32} />
                </div>
                <p>No staff members currently assigned to this role.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export const RolesPage = () => {
  const navigate = useNavigate();
  const [rolesList, setRolesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null); // For Details Page

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, staffRes] = await Promise.all([
        api.get('/crm/roles'),
        api.get('/crm/staff')
      ]);

      let staffData = [];
      if (staffRes.data.success) {
        staffData = staffRes.data.data.staff;
        setStaffList(staffData);
      }

      if (rolesRes.data.success) {
        const roles = rolesRes.data.data.roles.map(role => {
          // Calculate count - exact match
          const count = staffData.filter(s =>
            s.role && s.role.toLowerCase() === role.roleName.toLowerCase()
          ).length;

          return {
            ...role,
            id: role._id,
            role: role.roleName,
            department: role.department,
            access: role.accessLevel,
            count: count,
            permissions: role.permissions || []
          };
        });
        setRolesList(roles);

        // Update selectedRole in details if currently open to ensure live changes refresh
        if (selectedRole) {
          const updated = roles.find(r => r.id === selectedRole.id);
          if (updated) setSelectedRole(updated);
        }
      }
    } catch (error) {
      console.error("Error fetching roles/staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async (data) => {
    try {
      // Map frontend fields to backend fields
      const payload = {
        roleName: data.role,
        description: data.description,
        accessLevel: data.access || 'Custom',
        category: 'Operations', // Default category
        permissions: data.permissions || []
      };

      if (editingRole) {
        const response = await api.put(`/crm/roles/${editingRole.id}`, payload);
        if (response.data.success) {
          fetchData(); // Refresh to recalculate everything
        }
      } else {
        const response = await api.post('/crm/roles', payload);
        if (response.data.success) {
          fetchData();
        }
      }
      setIsModalOpen(false);
      setEditingRole(null);
    } catch (error) {
      console.error("Error saving role:", error);
    }
  };

  const handleEdit = (e, role) => {
    e.stopPropagation(); // Prevent opening details
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent opening details
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        const response = await api.delete(`/crm/roles/${id}`);
        if (response.data.success) {
          fetchData();
        }
      } catch (error) {
        console.error("Error deleting role:", error);
      }
    }
  };

  const openAddModal = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  if (selectedRole) {
    return <RoleDetails role={selectedRole} staffList={staffList} onBack={() => setSelectedRole(null)} />;
  }

  return (
    <div className="space-y-6">
      <AddRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveRole}
        initialData={editingRole}
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span className="hover:text-[#212c40] cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
            <span>/</span>
            <span className="hover:text-[#212c40] cursor-pointer transition-colors" onClick={() => navigate('/crm/staff/directory')}>Staff</span>
            <span>/</span>
            <span className="text-gray-800 font-medium">Roles</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm">Define what each staff member can see and do.</p>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fadeIn">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C205C]"></div>
          </div>
        ) : (
          rolesList.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#1C205C]/10 text-[#1C205C] rounded-xl">
                  <MdSecurity size={24} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{role.role}</h3>
              {role.description && role.description !== 'No description provided.' && (
                <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{role.description}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {role.permissions?.length || 0} Powers
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                  <MdGroup size={16} /> {role.count} Staff
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
const MarkAttendanceModal = ({ isOpen, onClose, onSubmit, initialData, staffList = [] }) => {
  const [formData, setFormData] = useState({ staffId: '', status: 'Present', inTime: '', outTime: '' });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.staffId) {
        setFormData({
          staffId: initialData.staffId,
          status: initialData.status,
          inTime: initialData.inTime !== '-' ? initialData.inTime : '',
          outTime: initialData.outTime !== '-' ? initialData.outTime : ''
        });
      } else {
        // Default to first staff if available
        const defaultStaff = staffList.length > 0 ? staffList[0].id : '';
        setFormData({ staffId: defaultStaff, status: 'Present', inTime: '', outTime: '' });
      }
    }
  }, [isOpen, initialData, staffList]);

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
          >
            <h3 className="text-xl font-bold mb-4 text-[#212c40]">{initialData ? 'Edit Attendance' : 'Mark Attendance'}</h3>
            <div className="space-y-4">
              <ThemedDropdown
                options={staffList.map(staff => ({ value: staff.id, label: staff.name }))}
                value={formData.staffId}
                onChange={(val) => setFormData({ ...formData, staffId: val })}
                disabled={!!initialData}
                placeholder="Select Staff"
                className="bg-white"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">In Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40]"
                    value={formData.inTime}
                    onChange={e => setFormData({ ...formData, inTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">Out Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40]"
                    value={formData.outTime}
                    onChange={e => setFormData({ ...formData, outTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {['Present', 'Absent', 'Late'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFormData({ ...formData, status })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-colors ${formData.status === status ? 'bg-[#212c40] text-white border-[#212c40]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSubmit}
                className="w-full bg-[#212c40] text-white py-3 rounded-xl font-bold hover:bg-[#2a3550] shadow-lg shadow-gray-200 transition-all active:scale-95"
              >
                {initialData ? 'Update Attendance' : 'Submit'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const ViewLocationModal = ({ isOpen, onClose, data }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl shadow-2xl bg-white overflow-hidden flex flex-col"
      >
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MdLocationOn className="text-red-500" /> Live Location Tracker
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MdClose size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 bg-white space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#212c40]/10 flex items-center justify-center text-[#212c40] font-bold text-xl shrink-0">
              {data.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">{data.name}</h3>
              <p className="text-sm text-gray-500">{data.role}</p>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-3 items-start">
                <MdLocationOn className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Current Location</p>
                  <p className="text-gray-800 font-medium text-sm mt-0.5">{data.location?.address || 'Location not available'}</p>
                  <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Updated Just Now
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

const StaffMonthlyAttendanceModal = ({ isOpen, onClose, staff }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingDay, setUpdatingDay] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [customTime, setCustomTime] = useState('');

  const formatTime12h = (t24) => {
    if (!t24) return undefined;
    const [h, m] = t24.split(':');
    const d = new Date();
    d.setHours(parseInt(h));
    d.setMinutes(parseInt(m));
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const parseTime12hTo24h = (t12) => {
    if (!t12 || t12 === '-') return '';
    const [time, modifier] = t12.split(' ');
    if (!modifier) return t12; // already HH:MM
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = String(parseInt(hours) + 12).padStart(2, '0');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleOptionClick = (value) => {
    if (value === 'Present' || value === 'Late') {
      setSelectedStatus(value);
      const existingIn = updatingDay.inTime && updatingDay.inTime !== '-' ? parseTime12hTo24h(updatingDay.inTime) : '';
      setCustomTime(existingIn || (value === 'Present' ? '09:00' : '10:00'));
    } else if (value === 'Half Day') {
      setSelectedStatus(value);
      const existingOut = updatingDay.outTime && updatingDay.outTime !== '-' ? parseTime12hTo24h(updatingDay.outTime) : '';
      setCustomTime(existingOut || '13:30');
    } else {
      handleUpdateStatus(value);
    }
  };

  const handleUpdateStatus = async (statusValue, timeString = null) => {
    if (!updatingDay || !staff?.id) return;

    try {
      let formattedTimeStr = undefined;
      if (timeString) {
        formattedTimeStr = formatTime12h(timeString);
      }

      const payload = {
        staffId: staff.id,
        date: new Date(selectedYear, selectedMonth, updatingDay.day, 12, 0, 0).toISOString(),
        status: statusValue,
        ...((statusValue === 'Present' || statusValue === 'Late') && formattedTimeStr && { inTime: formattedTimeStr }),
        ...(statusValue === 'Half Day' && formattedTimeStr && { outTime: formattedTimeStr })
      };

      const res = await api.post('/crm/attendance', payload);
      if (res.data.success) {
        toast.success(`Attendance updated to ${statusValue}`);
        fetchPayroll(); // Refresh stats cards and calendar grid immediately!
      }
    } catch (error) {
      console.error("Error updating day attendance:", error);
      toast.error("Failed to update attendance");
    } finally {
      setUpdatingDay(null);
      setSelectedStatus(null);
      setCustomTime('');
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && staff) {
      const now = new Date();
      let initMonth = now.getMonth();
      let initYear = now.getFullYear();

      const joinDate = staff.joiningDate ? new Date(staff.joiningDate) : null;
      if (joinDate) {
        const joinYear = joinDate.getFullYear();
        const joinMonth = joinDate.getMonth();

        if (initYear < joinYear || (initYear === joinYear && initMonth < joinMonth)) {
          setSelectedYear(joinYear);
          setSelectedMonth(joinMonth);
        } else {
          setSelectedYear(initYear);
          setSelectedMonth(initMonth);
        }
      } else {
        setSelectedYear(initYear);
        setSelectedMonth(initMonth);
      }
    }
  }, [isOpen, staff?.id]);

  useEffect(() => {
    if (isOpen && staff?.id) {
      fetchPayroll();
    }
  }, [selectedMonth, selectedYear, staff?.id, isOpen]);

  const fetchPayroll = async () => {
    if (!staff?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/crm/staff/${staff.id}/payroll`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      if (res.data.success) {
        setPayroll(res.data.data);
      }
    } catch (error) {
      console.error("Payroll fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSalary = async () => {
    if (!payroll || payroll.netPayable <= 0) {
      toast.error('Invalid salary amount');
      return;
    }

    try {
      await razorpayService.processSalaryPayment({
        staffId: staff.id,
        amount: payroll.netPayable,
        baseSalary: payroll.baseSalary,
        deductions: (payroll.absentDeduction || 0) + (payroll.halfDayDeduction || 0),
        month: selectedMonth,
        year: selectedYear,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        onSuccess: (response) => {
          toast.success('Salary processed successfully!');
          fetchPayroll(); // Refresh data
          // Close modal after short delay to show success state
          setTimeout(() => {
            onClose();
            // Optional: Redirect to directory if needed
            // navigate('/crm/staff/directory');
          }, 1500);
        },
        onError: (error) => {
          console.error('Payment Error:', error);
          toast.error('Payment Failed: ' + (error.message || 'Unknown error'));
        }
      });
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Failed to initialize payment');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar Grid Data - Enhanced with Weekday Alignment
  const daysInMonth = payroll?.daysInMonth || new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun

  const calendarGrid = [];
  // Add empty slots for correct weekday alignment
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push({ day: null, isWeekend: false, isEmpty: true });
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(selectedYear, selectedMonth, i);
    const log = payroll?.dailyLogs?.find(l => l.day === i);
    calendarGrid.push({
      day: i,
      isWeekend: date.getDay() === 0, // Sunday
      isEmpty: false,
      status: log?.status || (date.getDay() === 0 ? 'Weekend' : 'Pending'),
      inTime: log?.inTime || '-',
      outTime: log?.outTime || '-',
      workHours: log?.workHours || '-'
    });
  }

  if (!isOpen || !staff) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-3xl shadow-2xl bg-white overflow-hidden flex flex-col max-h-[90vh] relative"
      >
        {/* Header */}
        <div className="bg-white px-8 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Attendance</h2>
            <p className="text-gray-500 text-sm">Detailed view for <span className="font-bold text-[#1C205C]">{staff.name}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20"
            >
              {months.map((m, i) => {
                const joinDate = staff?.joiningDate ? new Date(staff.joiningDate) : null;
                const joinYear = joinDate ? joinDate.getFullYear() : null;
                const joinMonth = joinDate ? joinDate.getMonth() : null;
                const disabled = joinYear && selectedYear === joinYear ? i < joinMonth : false;
                return (
                  <option key={i} value={i} disabled={disabled}>
                    {m}
                  </option>
                );
              })}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                setSelectedYear(year);
                const joinDate = staff?.joiningDate ? new Date(staff.joiningDate) : null;
                const joinYear = joinDate ? joinDate.getFullYear() : null;
                const joinMonth = joinDate ? joinDate.getMonth() : null;
                if (joinYear && joinMonth !== null && year === joinYear && selectedMonth < joinMonth) {
                  setSelectedMonth(joinMonth);
                }
              }}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20"
            >
              {(() => {
                const currentYear = new Date().getFullYear();
                const joinDate = staff?.joiningDate ? new Date(staff.joiningDate) : null;
                const joinYear = joinDate && !isNaN(joinDate.getTime()) ? joinDate.getFullYear() : currentYear;
                const startYear = Math.min(joinYear, 2024);
                const endYear = Math.max(currentYear, joinYear);
                const years = [];
                for (let y = startYear; y <= endYear; y++) {
                  years.push(y);
                }
                return years.map(yr => {
                  const disabled = joinYear ? yr < joinYear : false;
                  return (
                    <option key={yr} value={yr} disabled={disabled}>
                      {yr}
                    </option>
                  );
                });
              })()}
            </select>
            <button
              onClick={onClose}
              className="p-2 ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MdClose size={24} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        {loading || !payroll ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="p-8 overflow-y-auto custom-scrollbar">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Total Days</p>
                <h3 className="text-2xl font-bold text-blue-900">{payroll.daysInMonth}</h3>
                <p className="text-xs text-blue-600 font-medium">Month Duration</p>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Present</p>
                <h3 className="text-2xl font-bold text-green-900">{payroll.presentDays} <span className="text-sm font-medium text-green-600">Days</span></h3>
                <p className="text-xs text-green-600 font-medium">+ {payroll.halfDays} Half Days</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Absent</p>
                <h3 className="text-2xl font-bold text-red-900">{payroll.absentDays} <span className="text-sm font-medium text-red-600">Days</span></h3>
                <p className="text-xs text-red-600 font-medium">Unpaid</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Leave</p>
                <h3 className="text-2xl font-bold text-indigo-900">{payroll.leaveDays || 0} <span className="text-sm font-medium text-indigo-600">Days</span></h3>
                <p className="text-xs text-indigo-600 font-medium">Approved Leave</p>
              </div>
            </div>

            <div className="flex justify-center">
              {/* Calendar Grid (Simplified View) */}
              <div className="w-full max-w-md">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm"><MdDateRange /> Daily Log (Overview)</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3">
                  <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] font-bold text-gray-400 uppercase">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarGrid.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          if (!item.isEmpty && item.status !== 'Not Joined') {
                            setUpdatingDay(item);
                          }
                        }}
                        className={`
                            aspect-square rounded-lg flex flex-col items-center justify-center border text-xs font-bold relative group transition-all
                            ${item.isEmpty ? 'bg-transparent border-transparent cursor-default' :
                            item.status === 'Present' || item.status === 'Late' ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm hover:scale-105 cursor-pointer' :
                              item.status === 'Half Day' ? 'bg-amber-500 border-amber-500 text-white shadow-sm hover:scale-105 cursor-pointer' :
                                item.status === 'Absent' ? 'bg-rose-50 border-rose-100 text-rose-500 hover:scale-105 cursor-pointer' :
                                  item.status === 'Leave' ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm hover:scale-105 cursor-pointer' :
                                    item.status === 'Holiday' ? 'bg-red-600 border-red-600 text-white shadow-sm hover:scale-105 cursor-pointer' :
                                      item.status === 'Not Joined' ? 'bg-gray-100 border-gray-200 text-gray-400 hover:scale-105 cursor-default' :
                                        item.isWeekend ? 'bg-red-50 border-red-100 text-red-500 hover:scale-105 cursor-pointer' :
                                          'bg-white border-gray-100 text-gray-600 hover:scale-105 cursor-pointer'}
                          `}
                      >
                        {!item.isEmpty && (
                          <>
                            <span>{item.day}</span>
                            {/* Premium Interactive Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-44 bg-[#212c40] text-white text-[10px] rounded-xl p-2.5 opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-20 shadow-xl border border-gray-700">
                              <div className="font-bold border-b border-gray-700 pb-1 mb-1 text-center">
                                {months[selectedMonth]} {item.day}, {selectedYear}
                              </div>
                              <div className="space-y-1 text-left">
                                <p className="flex justify-between">
                                  <span className="text-gray-400">Status:</span>
                                  <span className={`font-extrabold ${item.status === 'Present' || item.status === 'Late' ? 'text-emerald-400' :
                                      item.status === 'Half Day' ? 'text-amber-400' :
                                        item.status === 'Absent' ? 'text-rose-400' :
                                          item.status === 'Leave' ? 'text-indigo-400' :
                                            item.status === 'Holiday' ? 'text-red-400' :
                                              item.status === 'Not Joined' ? 'text-gray-400' :
                                                item.isWeekend ? 'text-red-400' : 'text-gray-400'
                                    }`}>{item.status === 'Late' ? 'Present (Late)' : item.status}</span>
                                </p>
                                {(item.status === 'Present' || item.status === 'Late' || item.status === 'Half Day') && (
                                  <>
                                    <p className="flex justify-between"><span className="text-gray-400">In Time:</span> <span className="font-medium text-gray-200">{item.inTime}</span></p>
                                    <p className="flex justify-between"><span className="text-gray-400">Out Time:</span> <span className="font-medium text-gray-200">{item.outTime}</span></p>
                                    <p className="flex justify-between"><span className="text-gray-400">Duration:</span> <span className="font-medium text-gray-200">{item.workHours}</span></p>
                                  </>
                                )}
                                {item.status === 'Holiday' && item.holidayReason && (
                                  <div className="mt-1 border-t border-gray-700 pt-1 text-center">
                                    <p className="text-gray-400 mb-0.5">Reason:</p>
                                    <p className="font-extrabold text-red-300">{item.holidayReason}</p>
                                  </div>
                                )}
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#212c40]"></div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center italic">Detailed daily status is available in the list view.</p>
                </div>
              </div>


            </div>
          </div>
        )}

        {/* Day Status Update Overlay Popover */}
        {updatingDay && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 transition-all">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col"
            >
              {!selectedStatus ? (
                <>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Update Attendance</h3>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">
                        For {months[selectedMonth]} {updatingDay.day}, {selectedYear}
                      </p>
                    </div>
                    <button
                      onClick={() => setUpdatingDay(null)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MdClose size={20} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { value: 'Present', label: 'Present', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
                      { value: 'Late', label: 'Present (Late)', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', activeClass: 'bg-amber-500 text-white border-amber-500' },
                      { value: 'Absent', label: 'Absent', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', activeClass: 'bg-rose-500 text-white border-rose-500' },
                      { value: 'Half Day', label: 'Half Day', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', activeClass: 'bg-orange-500 text-white border-orange-500' },
                      { value: 'Leave', label: 'Leave', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100', activeClass: 'bg-indigo-500 text-white border-indigo-500', spanFull: true },
                    ].map((option) => {
                      const isSelected = updatingDay.status === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleOptionClick(option.value)}
                          className={`
                            py-3 px-4 rounded-2xl font-bold border text-sm transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm hover:scale-[1.02]
                            ${option.spanFull ? 'col-span-2' : ''}
                            ${isSelected ? option.activeClass : option.color}
                          `}
                        >
                          <span className="text-sm font-extrabold">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setUpdatingDay(null)}
                      className="flex-1 py-3 border border-gray-200 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedStatus === 'Half Day' ? 'Enter Out-Time' : 'Enter In-Time'}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5">
                        Setting status to <span className="font-extrabold text-[#1C205C]">{selectedStatus === 'Late' ? 'Present (Late)' : selectedStatus}</span> for {months[selectedMonth]} {updatingDay.day}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStatus(null);
                        setCustomTime('');
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MdArrowBack size={20} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 flex flex-col items-center gap-4">
                    <MdAccessTime size={36} className="text-indigo-500" />
                    <div className="w-full">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2 text-center">
                        Select Time (HH:MM)
                      </label>
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-center text-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedStatus(null);
                        setCustomTime('');
                      }}
                      className="flex-1 py-3 border border-gray-200 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedStatus, customTime)}
                      className="flex-1 py-3 bg-[#1C205C] text-white rounded-2xl text-xs font-bold hover:bg-[#2a3550] shadow-sm transition-all"
                    >
                      Save Status
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export const AttendancePage = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const [attendanceList, setAttendanceList] = useState([]);
  const [staffInfoList, setStaffInfoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingMonthly, setViewingMonthly] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [viewingLocation, setViewingLocation] = useState(null);
  const [dateFilter, setDateFilter] = useState('Date: Today');
  const [roleFilter, setRoleFilter] = useState('Staff: All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchDataWithRange = async (fromDate, toDate) => {
    setLoading(true);
    try {
      const [staffRes, attRes] = await Promise.all([
        api.get('/crm/staff'),
        api.get(`/crm/attendance?dateFrom=${fromDate}&dateTo=${toDate}`)
      ]);

      let staffData = [];
      if (staffRes.data.success) {
        staffData = staffRes.data.data.staff.map(s => ({
          id: s._id,
          name: s.name,
          role: s.role,
          department: s.department,
          email: s.email,
          phone: s.phone,
          location: s.location,
          joiningDate: s.joiningDate || s.joinDate || s.createdAt
        }));
        setStaffInfoList(staffData);
      }

      let records = [];
      if (attRes.data.success && attRes.data.data?.records) {
        records = attRes.data.data.records;
      }

      const mergedData = staffData.map((staff) => {
        const staffRecords = records.filter(r => (r.staff?._id || r.staff) === staff.id);
        const latestRecord = staffRecords.length > 0 ? staffRecords[0] : null;

        let liveLoc = { status: 'Offline', address: 'Location Unavailable', lat: 0, lng: 0 };
        if (staff.location && staff.location.latitude) {
          const lastUpdate = new Date(staff.location.lastLocationUpdate);
          const now = new Date();
          const diffMins = (now - lastUpdate) / (1000 * 60);
          const isOnline = diffMins < 15;
          liveLoc = {
            status: isOnline ? 'Online' : 'Offline',
            address: staff.location.address || 'Address Unavailable',
            lat: staff.location.latitude,
            lng: staff.location.longitude,
            lastUpdate: lastUpdate
          };
        }
        if (liveLoc.status === 'Offline' && staff.location?.address) {
          liveLoc.address = `Last seen: ${staff.location.address}`;
        }

        // For date range, count present days
        const presentDays = staffRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
        const status = latestRecord?.status || (presentDays > 0 ? 'Present' : 'Absent');

        return {
          id: staff.id,
          staffId: staff.id,
          name: staff.name,
          role: staff.role,
          inTime: latestRecord?.inTime || '-',
          outTime: latestRecord?.outTime || '-',
          status: status,
          workHours: latestRecord?.workHours || (presentDays > 0 ? `${presentDays} day(s)` : '-'),
          recordId: latestRecord?._id,
          location: liveLoc,
          joiningDate: staff.joiningDate
        };
      });
      setAttendanceList(mergedData);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (targetDate = null) => {
    setLoading(true);
    try {
      const dateParam = targetDate || new Date().toISOString();
      const [staffRes, attRes] = await Promise.all([
        api.get('/crm/staff'),
        api.get('/crm/attendance?date=' + dateParam)
      ]);


      let staffData = [];
      if (staffRes.data.success) {
        staffData = staffRes.data.data.staff.map(s => ({
          id: s._id,
          name: s.name,
          role: s.role,
          department: s.department,
          email: s.email,
          phone: s.phone,
          location: s.location,
          joiningDate: s.joiningDate || s.joinDate || s.createdAt
        }));
        setStaffInfoList(staffData);
      }

      // Get attendance records (may be empty or fail)
      let records = [];
      if (attRes.data.success && attRes.data.data?.records) {
        records = attRes.data.data.records;
      }

      // Always merge staff with attendance (even if no attendance records)
      const mergedData = staffData.map((staff, index) => {
        const record = records.find(r => (r.staff?._id || r.staff) === staff.id);

        // Live Location Data
        let liveLoc = { status: 'Offline', address: 'Location Unavailable', lat: 0, lng: 0 };

        if (staff.location && staff.location.latitude) {
          const lastUpdate = new Date(staff.location.lastLocationUpdate);
          const now = new Date();
          const diffMins = (now - lastUpdate) / (1000 * 60);
          // Consider "Online" if location was updated within the last 15 minutes
          const isOnline = diffMins < 15;

          liveLoc = {
            status: isOnline ? 'Online' : 'Offline',
            address: staff.location.address || 'Address Unavailable',
            lat: staff.location.latitude,
            lng: staff.location.longitude,
            lastUpdate: lastUpdate
          };
        }

        // Fallback for "Offline" but with known location (show as Offline with address)
        if (liveLoc.status === 'Offline' && staff.location?.address) {
          liveLoc.address = `Last seen: ${staff.location.address}`;
        }

        const mockLoc = liveLoc;

        // Determine attendance status:
        // 1. If attendance record exists in DB, use that status
        // 2. If they have clocked out, show 'Checked Out'
        // 3. If no record, show as 'No Status'
        let attendanceStatus = 'No Status';
        if (record?.status) {
          if (record.inTime && record.outTime && record.outTime !== '-') {
            attendanceStatus = 'Checked Out';
          } else {
            attendanceStatus = record.status;
          }
        }

        // Determine work hours display
        let displayWorkHours = '-';
        if (record?.workHours) {
          displayWorkHours = record.workHours;
        } else if (record?.inTime && !record?.outTime) {
          // Checked in but not checked out - show Running
          displayWorkHours = 'Running';
        }

        return {
          id: staff.id,
          staffId: staff.id,
          name: staff.name,
          role: staff.role,
          inTime: record?.inTime || (liveLoc.status === 'Online' && !record ? 'Active' : '-'),
          outTime: record?.outTime || '-',
          status: attendanceStatus,
          workHours: displayWorkHours,
          recordId: record?._id,
          location: mockLoc,
          joiningDate: staff.joiningDate
        };
      });
      setAttendanceList(mergedData);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const getFilteredAttendance = () => {
    let data = [...attendanceList];

    const cleanSearch = searchTerm.trim().toLowerCase();
    if (cleanSearch) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(cleanSearch) ||
        item.role.toLowerCase().includes(cleanSearch)
      );
    }

    // 1. Filter by Role (case-insensitive exact match)
    if (roleFilter !== 'Staff: All') {
      const keyword = roleFilter.toLowerCase();
      data = data.filter(item => item.role.toLowerCase() === keyword);
    }

    return data;
  };

  const filteredAttendance = getFilteredAttendance();

  const handleMarkAttendance = async (data) => {
    // Format times for display if entered manually
    const formatTime = (t) => {
      if (!t) return undefined;
      const [h, m] = t.split(':');
      const d = new Date();
      d.setHours(h);
      d.setMinutes(m);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const newInTime = data.inTime?.includes(':') && !data.inTime.includes('M') ? formatTime(data.inTime) : data.inTime;
    const newOutTime = data.outTime?.includes(':') && !data.outTime.includes('M') ? formatTime(data.outTime) : data.outTime;

    // Calculate work hours if both times present
    // Simple calc for now or let backend do it? backend schema has workHours string.
    // Let's just send what we have.

    try {
      const payload = {
        staffId: data.staffId,
        date: new Date(),
        status: data.status,
        inTime: newInTime || undefined,
        outTime: newOutTime || undefined
      };

      const response = await api.post('/crm/attendance', payload);
      if (response.data.success) {
        fetchData();
      }

    } catch (err) {
      console.error("Error saving attendance", err);
    }

    setEditingAttendance(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (item) => {
    // Convert "09:00 AM" back to "09:00" for input
    const parseTime = (tStr) => {
      if (!tStr || tStr === '-') return '';
      const [time, modifier] = tStr.split(' ');
      if (!modifier) return tStr; // already HH:MM?
      let [hours, minutes] = time.split(':');
      if (hours === '12') {
        hours = '00';
      }
      if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
      }
      return `${hours}:${minutes}`;
    };

    setEditingAttendance({
      ...item,
      inTime: parseTime(item.inTime),
      outTime: parseTime(item.outTime)
    });
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingAttendance(null);
    setIsModalOpen(true);
  };


  const handleMarkTime = async (id, type) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Find current record locally to preserve other fields
    const currentRecord = attendanceList.find(a => a.id === id);
    if (!currentRecord) return;

    const payload = {
      staffId: currentRecord.staffId,
      date: new Date(),
      status: 'Present', // If marking time, they are present
      inTime: type === 'in' ? time : (currentRecord.inTime !== '-' ? currentRecord.inTime : undefined),
      outTime: type === 'out' ? time : (currentRecord.outTime !== '-' ? currentRecord.outTime : undefined)
    };

    // Calculate duration if marking out
    if (type === 'out' && payload.inTime) {
      // rough calc
      // ... skipping complex calc for brevity, backend stores string
      // can add simple logic here if needed or relying on backend? Backend just stores string.
    }

    try {
      await api.post('/crm/attendance', payload);
      fetchData();
    } catch (e) {
      console.error("Error marking time", e);
    }
  };

  return (
    <div className="space-y-6">
      <MarkAttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleMarkAttendance}
        initialData={editingAttendance}
        staffList={staffInfoList}
      />

      <ViewLocationModal
        isOpen={!!viewingLocation}
        onClose={() => setViewingLocation(null)}
        data={viewingLocation}
      />

      <StaffMonthlyAttendanceModal
        isOpen={!!viewingMonthly}
        onClose={() => setViewingMonthly(null)}
        staff={viewingMonthly}
      />

      {/* Date Range Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => setShowDatePicker(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Date Range</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (customDateFrom) {
                      const label = customDateTo
                        ? `${customDateFrom} to ${customDateTo}`
                        : customDateFrom;
                      setDateFilter(label);
                      // Fetch with date range
                      if (customDateTo) {
                        fetchDataWithRange(customDateFrom, customDateTo);
                      } else {
                        fetchData(new Date(customDateFrom).toISOString());
                      }
                    }
                    setShowDatePicker(false);
                  }}
                  className="flex-1 py-2 bg-[#1C205C] text-white rounded-xl text-sm font-bold hover:bg-[#2a3550]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span className="hover:text-[#212c40] cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
            <span>/</span>
            <span className="hover:text-[#212c40] cursor-pointer transition-colors" onClick={() => navigate('/crm/staff/directory')}>Staff</span>
            <span>/</span>
            <span className="text-gray-800 font-medium">Attendance</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="text-gray-500 text-sm">Today: {currentDate}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search name or role..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <ThemedDropdown
            options={['Staff: All', ...([...new Set(attendanceList.map(item => item.role))].filter(Boolean))]}
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            className="bg-white text-sm"
            width="w-40"
          />
          <ThemedDropdown
            options={['Date: Today', 'Yesterday', 'Select Date']}
            value={dateFilter}
            onChange={(val) => {
              setDateFilter(val);
              if (val === 'Date: Today') {
                fetchData(new Date().toISOString());
              } else if (val === 'Yesterday') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                fetchData(yesterday.toISOString());
              } else if (val === 'Select Date') {
                setShowDatePicker(true);
              }
            }}
            className="bg-white text-sm"
            width="w-40"
          />
        </div>
        <div className="text-sm text-gray-500 font-medium">
          Total Present: <span className="text-green-600 font-bold">{filteredAttendance.filter(i => ['Present', 'Late', 'Checked Out'].includes(i.status)).length}</span> / <span className="text-gray-800">{filteredAttendance.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#212c40]/5 border-b border-[#212c40]/10 text-xs uppercase tracking-wider text-[#212c40] font-bold">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Role</th>
                <th className="p-4">Work Hours</th>
                <th className="p-4">Status</th>
                <th className="p-4">Live Location</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{item.name}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold border border-gray-200">
                        {item.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {item.workHours}
                    </td>
                    <td className="p-4">
                      {item.status === 'Present' && <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-100">Present</span>}
                      {item.status === 'Absent' && <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-100">Absent</span>}
                      {item.status === 'Late' && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-100">Present (Late)</span>}
                      {item.status === 'Half Day' && <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-bold border border-orange-100">Half Day</span>}
                      {item.status === 'Leave' && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">Leave</span>}
                      {item.status === 'Checked Out' && <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-bold border border-indigo-100">Checked Out</span>}
                      {item.status === 'No Status' && <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold border border-gray-200">No Status</span>}
                    </td>
                    <td className="p-4">
                      {item.location?.lat ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingLocation(item)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors
                              ${item.location.status === 'Online'
                                ? 'bg-[#212c40]/10 text-[#212c40] border-[#212c40]/20 hover:bg-[#212c40]/20 animate-pulse'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                              }
                            `}
                          >
                            <MdLocationOn /> {item.location.status === 'Online' ? 'Live' : 'Last SEEN'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> Offline
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.role && (item.role.toLowerCase() === 'driver' || item.role.toLowerCase().includes('driver')) ? (
                          <span className="text-gray-400 font-bold">—</span>
                        ) : (
                          <button
                            onClick={() => setViewingMonthly(item)}
                            className="text-[#1C205C] hover:text-[#2a3550] text-xs font-bold bg-[#1C205C]/5 hover:bg-[#1C205C]/10 px-2.5 py-1.5 rounded-lg transition-colors border border-[#1C205C]/10"
                          >
                            Monthly View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-400 text-sm">
                      No attendance records found for this selection.
                    </td>
                  </tr>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
// --- Salary Management Component with Real Backend Integration ---
export const SalaryPage = () => {
  const navigate = useNavigate();
  const [salaryList, setSalaryList] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const yearOptions = ["2026", "2025", "2024"];

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(monthNames[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [staffFilter, setStaffFilter] = useState('Staff: All');
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState([]);

  // Payment modal state
  const [payingItem, setPayingItem] = useState(null);
  const [customBonus, setCustomBonus] = useState('');
  const [customDeduction, setCustomDeduction] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('manual'); // 'manual', 'bank_transfer', 'razorpay'
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);

  // Detailed monthly logs modal state
  const [viewingLogItem, setViewingLogItem] = useState(null);
  const [detailedLogs, setDetailedLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/crm/roles');
        if (res.data && res.data.success) {
          setRoles(res.data.data.roles || []);
        }
      } catch (err) {
        console.error('Failed to fetch roles', err);
      }
    };
    fetchRoles();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthIndex = monthNames.indexOf(selectedMonth);
      const response = await api.get('/crm/staff/payroll/calculate', {
        params: {
          month: monthIndex,
          year: selectedYear
        }
      });
      if (response.data && response.data.success) {
        setSalaryList(response.data.data.payrolls || []);
      }
    } catch (error) {
      console.error('Error fetching calculated payroll:', error);
      toast.error('Failed to load salary calculations');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (item) => {
    setPayingItem(item);
    setCustomBonus('');
    setCustomDeduction('');
    setAdjustmentNote('');
    setPaymentMethod('manual');
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setUpiId('');
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payingItem) return;

    const bonusVal = Number(customBonus) || 0;
    const deductionVal = Number(customDeduction) || 0;
    const baseNetPayable = payingItem.totalNetPayable;
    const finalAmount = Math.max(0, baseNetPayable + bonusVal - deductionVal);

    const monthIndex = monthNames.indexOf(selectedMonth);

    setProcessing(true);
    try {
      const payload = {
        staffId: payingItem.staffId,
        amount: finalAmount,
        month: monthIndex,
        year: Number(selectedYear),
        baseSalary: payingItem.baseSalary,
        deductions: (payingItem.absentDeduction || 0) + (payingItem.halfDayDeduction || 0) + (payingItem.leaveDeduction || 0) + (payingItem.notJoinedDeduction || 0) + (payingItem.pendingDeduction || 0) + deductionVal,
        bonus: bonusVal,
        note: adjustmentNote,
        paymentMethod,
        bankName,
        accountNumber,
        ifscCode,
        upiId
      };
      const response = await api.post('/crm/staff/salary/manual-pay', payload);
      if (response.data && response.data.success) {
        toast.success('Payment recorded successfully');
        setPayingItem(null);
        fetchData();
      } else {
        toast.error(response.data.message || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Payment processing failed:', err);
      toast.error('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewMonthlyLogs = async (item) => {
    setViewingLogItem(item);
    setLoadingLogs(true);
    setDetailedLogs([]);
    try {
      const monthIndex = monthNames.indexOf(selectedMonth);
      const response = await api.get(`/crm/staff/${item.staffId}/payroll`, {
        params: {
          month: monthIndex,
          year: selectedYear
        }
      });
      if (response.data && response.data.success) {
        setDetailedLogs(response.data.data.dailyLogs || []);
      }
    } catch (error) {
      console.error('Failed to load detailed logs:', error);
      toast.error('Error loading attendance logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDownloadSlip = (item) => {
    const doc = new jsPDF();
    const formatCurrency = (amt) => {
      return `Rs. ${Number(amt).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Header Color Fill
    doc.setFillColor(28, 32, 92); // premiumColors.primary (#1C205C)
    doc.rect(0, 0, 220, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DriveOn CRM", 20, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Operations Hub & Smart Payroll System", 20, 26);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL SALARY RECEIPT", 130, 24);

    // Reset Color
    doc.setTextColor(0, 0, 0);

    // Employee Block
    doc.setFontSize(12);
    doc.text("EMPLOYEE SUMMARY", 20, 55);
    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Staff Member:", 20, 68);
    doc.setFont("helvetica", "normal");
    doc.text(item.name, 50, 68);

    doc.setFont("helvetica", "bold");
    doc.text("Role:", 20, 76);
    doc.setFont("helvetica", "normal");
    doc.text(item.role || 'Staff', 50, 76);

    doc.setFont("helvetica", "bold");
    doc.text("Pay Period:", 120, 68);
    doc.setFont("helvetica", "normal");
    doc.text(item.monthString, 150, 68);

    doc.setFont("helvetica", "bold");
    doc.text("Payment Status:", 120, 76);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); // Green
    doc.text("PAID", 150, 76);
    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "bold");
    doc.text("Paid On Date:", 120, 84);
    doc.setFont("helvetica", "normal");
    doc.text(item.paidDate ? new Date(item.paidDate).toLocaleDateString('en-GB') : '-', 150, 84);

    // Salary Calculation Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SALARY LOGICAL SUMMARY", 20, 102);
    doc.line(20, 105, 190, 105);

    // Earnings
    doc.setFontSize(10);
    doc.text("Earnings (Credit)", 20, 115);
    doc.setFont("helvetica", "normal");
    doc.text("Basic Fixed Salary:", 25, 125);
    doc.text(formatCurrency(item.baseSalary), 105, 125, { align: 'right' });

    doc.text("Overtime Allowance:", 25, 133);
    doc.text(formatCurrency(item.extraWorkAmount || 0), 105, 133, { align: 'right' });

    doc.text("Incentives / Bonus:", 25, 141);
    doc.text(formatCurrency(item.bonus || 0), 105, 141, { align: 'right' });

    // Deductions
    doc.setFont("helvetica", "bold");
    doc.text("Deductions (Debit)", 120, 115);
    doc.setFont("helvetica", "normal");

    let deductY = 125;
    if (item.salaryStatus === 'Paid') {
      doc.text("Total Deductions:", 125, deductY);
      doc.text(`- ${formatCurrency(item.absentDeduction || 0)}`, 190, deductY, { align: 'right' });
    } else {
      if (item.absentDeduction > 0) {
        doc.text("Absent Days Loss:", 125, deductY);
        doc.text(`- ${formatCurrency(item.absentDeduction)}`, 190, deductY, { align: 'right' });
        deductY += 7;
      }
      if (item.leaveDeduction > 0) {
        doc.text("Leave Days Loss:", 125, deductY);
        doc.text(`- ${formatCurrency(item.leaveDeduction)}`, 190, deductY, { align: 'right' });
        deductY += 7;
      }
      if (item.halfDayDeduction > 0) {
        doc.text("Half Day Absences:", 125, deductY);
        doc.text(`- ${formatCurrency(item.halfDayDeduction)}`, 190, deductY, { align: 'right' });
        deductY += 7;
      }
      const otherDeductions = (item.notJoinedDeduction || 0) + (item.pendingDeduction || 0);
      if (otherDeductions > 0) {
        doc.text("Other Deductions:", 125, deductY);
        doc.text(`- ${formatCurrency(otherDeductions)}`, 190, deductY, { align: 'right' });
      }
    }

    doc.setLineWidth(0.2);
    doc.line(20, 149, 190, 149);

    // Total Amount Box
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("NET DEPOSITED TOTAL AMOUNT", 20, 160);
    doc.setTextColor(22, 163, 74); // Green
    doc.text(formatCurrency(item.paidAmount || item.totalNetPayable + item.bonus), 190, 160, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // Payment details
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Mode: ${item.paymentMethod.toUpperCase()}`, 20, 174);
    doc.text(`Transaction Reference: ${item.transactionId}`, 20, 180);

    let yOffset = 186;
    if (item.paymentMethod === 'bank_transfer') {
      doc.text(`Bank Name: ${item.bankName || 'N/A'}`, 20, yOffset);
      doc.text(`Account No: ${item.accountNumber || 'N/A'}`, 20, yOffset + 6);
      doc.text(`IFSC: ${item.ifscCode || 'N/A'}`, 20, yOffset + 12);
      yOffset += 18;
    } else if (item.paymentMethod === 'razorpay') {
      doc.text(`UPI ID: ${item.upiId || 'N/A'}`, 20, yOffset);
      yOffset += 6;
    } else {
      doc.text(`Paid via Cash (Manual)`, 20, yOffset);
      yOffset += 6;
    }

    if (item.note) {
      doc.text(`Remarks / Notes: ${item.note}`, 20, yOffset);
    }

    // Footnotes
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text("Generated securely via DriveOn Smart Payroll Hub", 105, 275, { align: 'center' });
    doc.text("This document is computer-generated and holds official validity without physical signatures.", 105, 280, { align: 'center' });

    doc.save(`SalarySlip_${item.name.replace(/\s+/g, '_')}_${item.monthString.replace(/\s+/g, '_')}.pdf`);
  };

  const filteredSalary = salaryList.filter(item => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    const keywords = trimmedSearch.split(/\s+/).filter(Boolean);
    const matchesSearch = keywords.length === 0 || keywords.every(keyword =>
      item.name.toLowerCase().includes(keyword) ||
      (item.role || '').toLowerCase().includes(keyword)
    );

    let matchesStaff = true;
    if (staffFilter !== 'Staff: All') {
      matchesStaff = item.role && item.role.trim() === staffFilter.trim();
    }
    return matchesSearch && matchesStaff;
  });


  const totalPayoutVal = salaryList
    .filter(s => s.salaryStatus === 'Paid')
    .reduce((acc, curr) => acc + curr.paidAmount, 0);

  const pendingPayoutVal = salaryList
    .filter(s => s.salaryStatus !== 'Paid')
    .reduce((acc, curr) => acc + curr.netPayable, 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
              <span>/</span>
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/staff/directory')}>Staff</span>
              <span>/</span>
              <span className="text-gray-800 font-medium">Salary</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
            <p className="text-gray-500 text-sm">Review calculated payroll logs and credit monthly staff salaries.</p>
          </div>
        </div>

        {/* Overview Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Active Payroll</span>
              <h3 className="text-2xl font-black text-[#1C205C] mt-1">₹ {(totalPayoutVal + pendingPayoutVal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <MdCurrencyRupee size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid This Month</span>
              <h3 className="text-2xl font-black text-green-600 mt-1">₹ {totalPayoutVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <MdCheckCircle size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Payouts</span>
              <h3 className="text-2xl font-black text-orange-600 mt-1">₹ {pendingPayoutVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <MdAccessTime size={24} />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search staff name or role..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.trimStart())}
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <ThemedDropdown
              options={['Staff: All', ...roles.map(r => r.roleName)]}
              value={staffFilter}
              onChange={(val) => setStaffFilter(val)}
              className="bg-white text-sm"
              width="w-40"
            />
            <ThemedDropdown
              options={monthNames}
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val)}
              className="bg-white text-sm"
              width="w-40"
            />
            <ThemedDropdown
              options={yearOptions}
              value={selectedYear}
              onChange={(val) => setSelectedYear(val)}
              className="bg-white text-sm"
              width="w-32"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4">Staff Name</th>
                  <th className="p-4">Shift Details (Days)</th>
                  <th className="p-4">Basic Pay</th>
                  <th className="p-4">Deductions</th>
                  <th className="p-4">Net Payable</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredSalary.length > 0 ? (
                  filteredSalary.map((item) => (
                    <tr key={item.staffId} className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.role}</div>
                      </td>
                      <td className="p-4 text-gray-600 font-medium">
                        <div className="flex flex-col">
                          {item.role && (item.role.toLowerCase() === 'driver' || item.role.toLowerCase().includes('driver')) ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl text-xs font-bold border border-indigo-100/50 shadow-sm w-fit mt-1">
                                {item.salaryMethod === 'Per Trip' ? 'Per Trip' : 'Monthly'}
                              </span>
                              {item.salaryMethod === 'Per Trip' && (
                                <span className="text-[11px] text-gray-500 font-semibold mt-0.5">
                                  Completed Trips: <strong className="text-green-600 font-black">{item.completedTrips || 0}</strong>
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              <span>P: <strong className="text-green-600">{item.presentDays}</strong> | A: <strong className="text-red-500">{item.absentDays}</strong> | H: <strong className="text-orange-500">{item.halfDays}</strong> | L: <strong className="text-purple-500">{item.leaveDays || 0}</strong></span>
                              <span className="text-[10px] text-gray-400">Total Work Days: {item.workingDays}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-700 font-semibold">
                        ₹ {item.baseSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-red-500 font-medium">
                        - ₹ {((item.absentDeduction || 0) + (item.halfDayDeduction || 0) + (item.leaveDeduction || 0) + (item.notJoinedDeduction || 0) + (item.pendingDeduction || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 font-bold text-[#1C205C]">
                        ₹ {item.salaryStatus === 'Paid' ? (item.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (item.netPayable).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        {item.salaryStatus === 'Paid' ? (
                          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-100 shadow-sm">
                            <MdCheck size={14} /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold border border-orange-100">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewMonthlyLogs(item)}
                            className="w-[125px] py-1.5 text-center text-[#1C205C] hover:text-[#2a3550] text-xs font-bold bg-[#1C205C]/5 hover:bg-[#1C205C]/10 rounded-lg transition-colors border border-[#1C205C]/10"
                          >
                            Attendance Log
                          </button>
                          {item.salaryStatus === 'Paid' ? (
                            <button
                              onClick={() => handleDownloadSlip(item)}
                              className="w-[115px] py-1.5 text-center text-indigo-600 border border-indigo-100 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                            >
                              Receipt PDF
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePayNow(item)}
                              className="w-[115px] py-1.5 text-center bg-green-600 text-white border border-transparent rounded-lg text-xs font-bold shadow-sm hover:bg-green-700 transition-colors"
                            >
                              Credit Salary
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400 text-sm">
                      No payroll calculations found for this filter selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pay Now Adjustments Modal */}
      {payingItem && (
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Credit Monthly Payroll</h3>
                  <p className="text-xs text-gray-500">Employee: {payingItem.name} ({payingItem.role})</p>
                </div>
                <button onClick={() => setPayingItem(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <MdClose size={20} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
                {/* Details Breakdown */}
                <div className="bg-[#1C205C]/5 p-4 rounded-2xl border border-[#1C205C]/10 text-sm space-y-2">
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-2 mb-2">
                    <span className="text-gray-600 font-semibold text-xs uppercase tracking-wider">Attendance Status:</span>
                    <span className="text-xs font-semibold">
                      P: <strong className="text-green-600 font-bold">{payingItem.presentDays}</strong> |{' '}
                      A: <strong className="text-red-500 font-bold">{payingItem.absentDays}</strong> |{' '}
                      H: <strong className="text-orange-500 font-bold">{payingItem.halfDays}</strong> |{' '}
                      L: <strong className="text-purple-500 font-bold">{payingItem.leaveDays || 0}</strong>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Base Salary:</span>
                    <span className="font-bold text-gray-900">₹ {payingItem.baseSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Overtime Incentives:</span>
                    <span className="font-bold text-green-600">+ ₹ {payingItem.extraWorkAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Attendance Deductions:</span>
                    <span className="font-bold text-red-500">- ₹ {((payingItem.absentDeduction || 0) + (payingItem.halfDayDeduction || 0) + (payingItem.leaveDeduction || 0) + (payingItem.notJoinedDeduction || 0) + (payingItem.pendingDeduction || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {/* Deductions Breakdown */}
                  {((payingItem.absentDeduction || 0) > 0 || (payingItem.halfDayDeduction || 0) > 0 || (payingItem.leaveDeduction || 0) > 0) && (
                    <div className="pl-3 py-1 border-l-2 border-red-200 space-y-1 text-xs text-gray-500">
                      {(payingItem.absentDeduction || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>• Absent ({payingItem.absentDays} days):</span>
                          <span>- ₹ {payingItem.absentDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {(payingItem.halfDayDeduction || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>• Half Day ({payingItem.halfDays} days):</span>
                          <span>- ₹ {payingItem.halfDayDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {(payingItem.leaveDeduction || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>• Leaves (Exceeded limit of {payingItem.freeLeavesPerMonth || 0} by {Math.max(0, payingItem.leaveDays - (payingItem.freeLeavesPerMonth || 0))} days):</span>
                          <span>- ₹ {payingItem.leaveDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
                    <span className="text-gray-800">Standard Net Payable:</span>
                    <span className="text-[#1C205C]">₹ {payingItem.totalNetPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Adjustments Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Add Custom Bonus (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 font-bold"
                      value={customBonus}
                      onChange={(e) => setCustomBonus(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deduct Adjustment (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-red-600"
                      value={customDeduction}
                      onChange={(e) => setCustomDeduction(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adjustment Notes / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Festival advance deduction, performance bonus"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={adjustmentNote}
                    onChange={(e) => setAdjustmentNote(e.target.value)}
                  />
                </div>

                {/* Payment Method Option */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Payment Gateway Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('manual')}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all
                        ${paymentMethod === 'manual' ? 'bg-[#1C205C] border-[#1C205C] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      Cash (Manual)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all
                        ${paymentMethod === 'bank_transfer' ? 'bg-[#1C205C] border-[#1C205C] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      Bank Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all
                        ${paymentMethod === 'razorpay' ? 'bg-[#1C205C] border-[#1C205C] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      Razorpay UPI
                    </button>
                  </div>
                </div>

                {/* Extra Payment Details */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                      <input type="text" placeholder="e.g. HDFC Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                      <input type="text" placeholder="Account Number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IFSC Code</label>
                      <input type="text" placeholder="IFSC Code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm" />
                    </div>
                  </div>
                )}

                {paymentMethod === 'razorpay' && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UPI ID</label>
                    <input type="text" placeholder="e.g. user@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm" />
                  </div>
                )}

                {/* Final Computation Box */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase">Final Deposit Amount</span>
                    <h3 className="text-2xl font-black text-green-600">
                      ₹ {Math.max(0, payingItem.totalNetPayable + (Number(customBonus) || 0) - (Number(customDeduction) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-6 py-3 bg-[#1C205C] text-white font-bold rounded-xl shadow-md hover:bg-[#2a306e] transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm Credit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )
      )}

      {/* Attendance Logs View Modal */}
      {viewingLogItem && (
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
            >
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Monthly Attendance Logs</h3>
                  <p className="text-xs text-gray-500">{viewingLogItem.name} • {selectedMonth} {selectedYear}</p>
                </div>
                <button onClick={() => setViewingLogItem(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <MdClose size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {loadingLogs ? (
                  <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailedLogs.length > 0 ? (
                      detailedLogs.map((log) => (
                        <div key={log.day} className={`p-3 rounded-xl border flex justify-between items-center text-sm
                          ${log.status === 'Holiday' ? 'bg-red-50/40 border-red-100' : log.isWeekend ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-white border-gray-100'}
                        `}>
                          <div className="flex items-center gap-3">
                            <span className={`w-10 h-10 rounded-lg font-bold flex items-center justify-center
                              ${log.status === 'Holiday' ? 'bg-red-100 text-red-700 shadow-sm' : 'bg-gray-100 text-[#1C205C]'}
                            `}>
                              {log.day}
                            </span>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {new Date(selectedYear, monthNames.indexOf(selectedMonth), log.day).toLocaleDateString('en-GB', { weekday: 'long' })}
                              </p>
                              <p className="text-xs text-gray-400 font-medium">Shift: {log.inTime} - {log.outTime}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {log.workHours && log.workHours !== '-' && (
                              <span className="text-xs text-gray-500 font-semibold bg-gray-150 px-2 py-0.5 rounded">
                                {log.workHours}
                              </span>
                            )}
                            <div>
                              {log.status === 'Weekend' && <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">Sunday</span>}
                              {log.status === 'Present' && <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold border border-green-100">Present</span>}
                              {log.status === 'Late' && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-100">Late</span>}
                              {log.status === 'Half Day' && <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs font-bold border border-orange-100">Half Day</span>}
                              {log.status === 'Leave' && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">Leave</span>}
                              {log.status === 'Absent' && <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold border border-red-100">Absent</span>}
                              {log.status === 'Holiday' && <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-black border border-red-600 shadow-sm animate-pulse">Holiday: {log.holidayReason || 'Official'}</span>}
                              {log.status === 'Pending' && <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium border border-gray-200">Pending</span>}
                              {log.status === 'Not Joined' && <span className="px-2 py-1 bg-gray-100 text-gray-400 rounded text-xs font-medium border border-gray-200">Not Joined</span>}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 text-sm py-12">No detailed daily logs found.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 flex justify-end">
                <button
                  onClick={() => setViewingLogItem(null)}
                  className="px-5 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>,
          document.body
        )
      )}
    </>
  );
};

/**
 * @desc Attendance Settings Page Component
 */
export const AttendanceSettingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for attendance settings
  const [settings, setSettings] = useState({
    officeStartTime: '09:00 AM',
    officeEndTime: '06:00 PM',
    halfDayDeduction: 250,
    absentDeduction: 500,
    lateGracePeriod: 15,
    overtimeRate: 0,
    freeLeavesPerMonth: 0,
  });

  // State for Holidays Calendar
  const [holidays, setHolidays] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedHolidayDate, setSelectedHolidayDate] = useState(null);
  const [holidayReason, setHolidayReason] = useState('');
  const [isNewHoliday, setIsNewHoliday] = useState(true);

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Convert 12h to 24h for time input value
  const convert12to24 = (time12h) => {
    if (!time12h) return "09:00";
    try {
      const parts = time12h.split(' ');
      if (parts.length !== 2) return "09:00";
      const [time, modifier] = parts;
      const [hours, minutes] = time.split(':');
      let hr = parseInt(hours, 10);
      if (modifier === 'PM' && hr < 12) {
        hr += 12;
      }
      if (modifier === 'AM' && hr === 12) {
        hr = 0;
      }
      return `${String(hr).padStart(2, '0')}:${minutes}`;
    } catch (e) {
      return "09:00";
    }
  };

  // Convert 24h to 12h for saving to database
  const convert24to12 = (time24h) => {
    if (!time24h) return "09:00 AM";
    try {
      const [hours, minutes] = time24h.split(':');
      let hr = parseInt(hours, 10);
      const modifier = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      hr = hr ? hr : 12; // the hour '0' should be '12'
      return `${String(hr).padStart(2, '0')}:${minutes} ${modifier}`;
    } catch (e) {
      return "09:00 AM";
    }
  };

  // Fetch current settings and holidays on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [settingsRes, holidaysRes] = await Promise.all([
          api.get('/crm/attendance/settings'),
          api.get('/crm/attendance/holidays')
        ]);

        if (settingsRes.data && settingsRes.data.success) {
          setSettings({
            officeStartTime: settingsRes.data.data.officeStartTime || '09:00 AM',
            officeEndTime: settingsRes.data.data.officeEndTime || '06:00 PM',
            halfDayDeduction: settingsRes.data.data.halfDayDeduction !== undefined ? settingsRes.data.data.halfDayDeduction : 250,
            absentDeduction: settingsRes.data.data.absentDeduction !== undefined ? settingsRes.data.data.absentDeduction : 500,
            lateGracePeriod: settingsRes.data.data.lateGracePeriod !== undefined ? settingsRes.data.data.lateGracePeriod : 15,
            overtimeRate: settingsRes.data.data.overtimeRate !== undefined ? settingsRes.data.data.overtimeRate : 0,
            freeLeavesPerMonth: settingsRes.data.data.freeLeavesPerMonth !== undefined ? settingsRes.data.data.freeLeavesPerMonth : 0,
          });
        }

        if (holidaysRes.data && holidaysRes.data.success) {
          setHolidays(holidaysRes.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching attendance settings/holidays:', error);
        toast.error('Failed to load attendance settings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkHoliday = async () => {
    if (!holidayReason.trim()) {
      toast.error('Holiday reason is required');
      return;
    }

    try {
      const res = await api.post('/crm/attendance/holidays', {
        date: selectedHolidayDate,
        reason: holidayReason.trim()
      });
      if (res.data.success) {
        toast.success('Holiday marked successfully!');
        setHolidays(res.data.data || []);
        setShowHolidayModal(false);
        setHolidayReason('');
      }
    } catch (err) {
      console.error('Error marking holiday:', err);
      toast.error('Failed to mark holiday');
    }
  };

  const handleDeleteHoliday = async (date) => {
    try {
      const res = await api.delete(`/crm/attendance/holidays/${date}`);
      if (res.data.success) {
        toast.success('Holiday removed successfully!');
        setHolidays(res.data.data || []);
        setShowHolidayModal(false);
        setHolidayReason('');
      }
    } catch (err) {
      console.error('Error removing holiday:', err);
      toast.error('Failed to remove holiday');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Perform simple validation
      const start24 = convert12to24(settings.officeStartTime);
      const end24 = convert12to24(settings.officeEndTime);

      if (start24 >= end24) {
        toast.error('Office end time must be after start time');
        setSaving(false);
        return;
      }

      const response = await api.put('/crm/attendance/settings', settings);
      if (response.data && response.data.success) {
        toast.success('Attendance settings saved successfully!');
      } else {
        toast.error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Server error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const calendarDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarFirstDay = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun

  const calendarDays = [];
  for (let i = 0; i < calendarFirstDay; i++) {
    calendarDays.push({ day: null, isEmpty: true });
  }
  for (let i = 1; i <= calendarDaysInMonth; i++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const holiday = holidays.find(h => h.date === dateStr);
    calendarDays.push({
      day: i,
      date: dateStr,
      isEmpty: false,
      isWeekend: new Date(calendarYear, calendarMonth, i).getDay() === 0,
      isHoliday: !!holiday,
      reason: holiday ? holiday.reason : ''
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
            <span>/</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/staff/directory')}>Staff</span>
            <span>/</span>
            <span className="text-gray-800 font-medium">Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Settings</h1>
          <p className="text-gray-500 text-sm">Configure global work shift timings and salary deduction multipliers.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
        {/* Core Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Shift & Office Timings */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <MdAccessTime size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Office Timings</h3>
                <p className="text-xs text-gray-500">Define office hours for lateness and attendance tracking.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Office Start Time</label>
                <div className="relative">
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-800"
                    value={convert12to24(settings.officeStartTime)}
                    onChange={(e) => setSettings({
                      ...settings,
                      officeStartTime: convert24to12(e.target.value)
                    })}
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Currently configured: <span className="font-semibold text-indigo-600">{settings.officeStartTime}</span></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Office End Time</label>
                <div className="relative">
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-800"
                    value={convert12to24(settings.officeEndTime)}
                    onChange={(e) => setSettings({
                      ...settings,
                      officeEndTime: convert24to12(e.target.value)
                    })}
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Currently configured: <span className="font-semibold text-indigo-600">{settings.officeEndTime}</span></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Late Grace Period (Minutes)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-gray-800"
                    value={settings.lateGracePeriod}
                    onChange={(e) => setSettings({
                      ...settings,
                      lateGracePeriod: parseInt(e.target.value, 10) || 0
                    })}
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Late status is triggered if check-in is after Office Start Time + Grace Period.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Payroll Deduction Configurations */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <MdCurrencyRupee size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Salary Deductions</h3>
                <p className="text-xs text-gray-500">Specify flat salary penalties for late/leave instances.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Half-Day Absence Deduction (₹)</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-800"
                    placeholder="Enter half-day deduction"
                    value={settings.halfDayDeduction}
                    onChange={(e) => setSettings({
                      ...settings,
                      halfDayDeduction: Number(e.target.value) || 0
                    })}
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Charged when staff clocks in late or registers a half-day shift.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Absent / Leave Deduction (₹)</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-800"
                    placeholder="Enter full-day deduction"
                    value={settings.absentDeduction}
                    onChange={(e) => setSettings({
                      ...settings,
                      absentDeduction: Number(e.target.value) || 0
                    })}
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Charged for unauthorized leaves or fully marked absent days.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Overtime Rate per Hour (₹)</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">₹</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-800"
                    placeholder="e.g. 100"
                    value={settings.overtimeRate}
                    onChange={(e) => setSettings({
                      ...settings,
                      overtimeRate: Number(e.target.value) || 0
                    })}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Applied for each hour worked beyond the standard office hours.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Free Leaves Per Month (Days)</label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-medium">📅</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-semibold text-gray-800"
                    placeholder="e.g. 2"
                    value={settings.freeLeavesPerMonth}
                    onChange={(e) => setSettings({
                      ...settings,
                      freeLeavesPerMonth: Number(e.target.value) || 0
                    })}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Employees get this many paid leave days per month — no deduction. Leaves beyond this limit are deducted at per-day salary rate.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Card 3: Official Holiday Calendar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <MdDateRange size={22} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-900">Official Holiday Calendar</h3>
                <p className="text-xs text-gray-500">Configure global official holidays. Marked days are exempt from salary deduction and turn red.</p>
              </div>
            </div>
            {/* Calendar Month & Year Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors font-bold text-lg select-none"
              >
                &larr;
              </button>
              <span className="font-black text-gray-800 px-3 min-w-[130px] text-center select-none text-sm">
                {monthsList[calendarMonth]} {calendarYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors font-bold text-lg select-none"
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="max-w-md mx-auto bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((item, idx) => {
                if (item.isEmpty) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-transparent"></div>;
                }

                return (
                  <div
                    key={item.date}
                    onClick={() => {
                      setSelectedHolidayDate(item.date);
                      setHolidayReason(item.reason || '');
                      setIsNewHoliday(!item.isHoliday);
                      setShowHolidayModal(true);
                    }}
                    className={`
                      aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-bold cursor-pointer relative group transition-all duration-200 hover:scale-105 shadow-sm select-none
                      ${item.isHoliday ? 'bg-red-600 border-red-600 text-white shadow-red-200 hover:bg-red-700' :
                        item.isWeekend ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' :
                        'bg-white border-gray-100 text-gray-700 hover:bg-gray-100'}
                    `}
                  >
                    <span>{item.day}</span>
                    {item.isHoliday && (
                      <span className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></span>
                    )}

                    {/* Premium Interactive Hover Tooltip */}
                    {item.isHoliday && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-40 bg-[#212c40] text-white text-[9px] rounded-lg p-2.5 opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-20 shadow-lg border border-gray-700 text-center font-bold">
                        {item.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">
            Changes will take effect instantly for all future payroll computations.
          </span>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: premiumColors.primary.DEFAULT }}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <MdCheckCircle size={20} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>

      {/* Holiday Markup Modal Popup */}
      {showHolidayModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={() => setShowHolidayModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100"
          >
            <div className="bg-[#1C205C] px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm select-none">
                {isNewHoliday ? 'Mark Official Holiday' : 'Holiday Details'}
              </h3>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Selected Date</label>
                <p className="font-bold text-[#1C205C] text-sm select-none">
                  {selectedHolidayDate ? new Date(selectedHolidayDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Holiday Reason *</label>
                {isNewHoliday ? (
                  <input
                    type="text"
                    placeholder="e.g. Eid al-Adha, Diwali, etc."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20 transition-all font-semibold text-xs text-gray-800"
                    value={holidayReason}
                    onChange={(e) => setHolidayReason(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <p className="font-extrabold text-red-600 bg-red-50/50 px-4 py-3 rounded-xl border border-red-100 text-xs leading-relaxed select-none">
                    {holidayReason}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => setShowHolidayModal(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-xs shadow-sm hover:bg-gray-100 transition-colors select-none"
              >
                Close
              </button>

              {isNewHoliday ? (
                <button
                  onClick={handleMarkHoliday}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors select-none"
                >
                  Mark Holiday
                </button>
              ) : (
                <button
                  onClick={() => handleDeleteHoliday(selectedHolidayDate)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-1 select-none animate-pulse"
                >
                  <MdDelete size={14} /> Remove Holiday
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};


