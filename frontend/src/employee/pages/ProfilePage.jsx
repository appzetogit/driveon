import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { FiUser, FiSettings, FiLogOut, FiAward, FiChevronRight, FiBriefcase, FiDollarSign, FiFileText, FiBell, FiShield, FiPhone, FiMail, FiMapPin, FiAlertTriangle, FiHeadphones, FiCamera, FiImage, FiEdit } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { logoutUser } from '../../store/slices/authSlice';
import { useEmployee } from '../../context/EmployeeContext';
import { updateUser } from '../../store/slices/userSlice';
import HeaderTopBar from '../components/HeaderTopBar';
import BottomNav from '../components/BottomNav';

const compressImage = (file) => {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        // Only compress if size is larger than 1MB
        if (file.size <= 1024 * 1024) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const newFileName = (file.name || 'photo.jpg').replace(/\.[^/.]+$/, "") + ".jpg";
                            const compressedFile = new File([blob], newFileName, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    0.8
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { unreadCount } = useEmployee();
    const galleryInputRef = React.useRef(null);
    const cameraInputRef = React.useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!editName.trim()) {
            toast.error('Name is required');
            return;
        }

        setIsSavingProfile(true);
        const loadingToast = toast.loading('Saving changes...');
        try {
            const response = await api.put('/auth/staff-profile', {
                name: editName.trim(),
                email: editEmail.trim(),
            });
            if (response.data.success) {
                toast.success('Profile updated successfully', { id: loadingToast });
                dispatch(updateUser(response.data.data.user));
                setShowEditModal(false);
            }
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile', { id: loadingToast });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleAvatarClick = () => {
        if (!isUploading) {
            setShowSourceModal(true);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const loadingToast = toast.loading('Processing and uploading photo...');
        try {
            const processedFile = await compressImage(file);

            // Size check on processed/compressed file
            if (processedFile.size > 5 * 1024 * 1024) {
                toast.error('File size too large. Maximum size is 5MB.', { id: loadingToast });
                setIsUploading(false);
                return;
            }

            const formData = new FormData();
            formData.append('photo', processedFile);

            const response = await api.post('/auth/staff-upload-photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                toast.success('Profile photo updated successfully', { id: loadingToast });
                dispatch(updateUser(response.data.data.user));
            }
        } catch (error) {
            console.error('Upload photo error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload photo', { id: loadingToast });
        } finally {
            setIsUploading(false);
            if (galleryInputRef.current) galleryInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/employee/login');
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const response = await api.delete('/auth/staff-profile');
            if (response.data.success) {
                toast.success('Account deleted successfully');
                await dispatch(logoutUser());
                navigate('/employee/login');
            }
        } catch (error) {
            console.error('Delete account error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete account');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const { user: userData } = useSelector(state => state.user);
    const { isInitializing } = useSelector(state => state.auth);

    const user = {
        name: userData?.name || "",
        role: userData?.role || "",
        id: userData?.employeeId || "",
        phone: userData?.phone || "",
        email: userData?.email || "",
        avatar: userData?.avatar || `https://ui-avatars.com/api/?name=${userData?.name || 'User'}&background=1C205C&color=fff&size=128`,
        joinDate: userData?.joinDate ? new Date(userData.joinDate).toLocaleDateString() : ""
    };

    useEffect(() => {
        if (userData) {
            setEditName(userData.name || '');
            setEditEmail(userData.email || '');
        }
    }, [userData, showEditModal]);

    // Lock background body scroll when any modal or bottom sheet is open
    useEffect(() => {
        if (showDeleteModal || showSourceModal || showEditModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDeleteModal, showSourceModal, showEditModal]);

    if (isInitializing || !userData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA] p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4 border-[#1C205C]"></div>
                <p className="text-[#1C205C] font-medium">Loading profile...</p>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F5F7FA] font-sans selection:bg-blue-100">
            <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
                <div>
                    {/* WHITE HEADER SECTION */}
                    <div className="bg-white pt-6 pb-6 px-6 border-b border-gray-150 shadow-sm relative z-0">
                        <div className="flex justify-between items-center mb-6">
                            <div className="w-9" />
                            <h1 className="text-lg font-bold text-gray-800 tracking-wide">My Profile</h1>
                            <div className="w-9" />
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="flex items-center gap-6 mt-4"
                        >
                            <input 
                                type="file" 
                                ref={galleryInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                            <input 
                                type="file" 
                                ref={cameraInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                capture="user" 
                                className="hidden" 
                            />
                            <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
                                <div className="w-20 h-20 rounded-full border border-gray-100 shadow-md overflow-hidden p-0.5 bg-white transition-transform duration-300 group-hover:scale-105 relative">
                                    {isUploading ? (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 rounded-full">
                                            <FiCamera className="text-white" size={18} />
                                        </div>
                                    )}
                                    <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                </div>
                                <div className="absolute bottom-0 right-0 bg-white text-gray-700 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center shadow-md group-hover:scale-110 transition-all duration-300">
                                    <FiCamera size={11} className="stroke-[2.5]" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none mb-1">{user.name}</h2>
                                <p className="text-sm text-gray-500 font-medium truncate mb-2">{user.email}</p>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 rounded-lg text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/10 w-fit"
                                >
                                    <FiEdit size={11} className="stroke-[2.5]" /> Edit Profile
                                </button>
                            </div>
                        </motion.div>
                    </div>


                </div>

                {/* MENU LIST */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="px-5 mt-8 space-y-8"
                >
                    {/* PERSONAL INFO SECTION */}
                    <motion.div variants={itemVariants} className="space-y-3">
                        <SectionTitle title="Personal Information" />
                        <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 overflow-hidden">
                            <InfoRow icon={<FiPhone size={18} />} label="Phone Number" value={user.phone} />
                            <InfoRow icon={<FiMail size={18} />} label="Email Address" value={user.email} />
                            <InfoRow icon={<FiBriefcase size={18} />} label="Role" value={user.role} />
                            <InfoRow icon={<FiUser size={18} />} label="Staff ID" value={user.id} isLast />
                        </div>
                    </motion.div>

                    {/* APP SETTINGS */}
                    <motion.div variants={itemVariants} className="space-y-3">
                        <SectionTitle title="App & Settings" />
                        <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 overflow-hidden">
                            <MenuRow
                                icon={<FiShield size={20} />}
                                label="Privacy & Security"
                                color="text-indigo-600"
                                bg="bg-indigo-50"
                                onClick={() => navigate('/employee/privacy')}
                            />
                            <MenuRow
                                icon={<FiBell size={20} />}
                                label="Notifications"
                                color="text-amber-600"
                                bg="bg-amber-50"
                                hasBadge={unreadCount > 0}
                                badgeCount={unreadCount}
                                onClick={() => navigate('/employee/notifications')}
                            />
                            <MenuRow
                                icon={<FiHeadphones size={20} />}
                                label="Support"
                                color="text-teal-600"
                                bg="bg-teal-50"
                                onClick={() => navigate('/employee/support')}
                                isLast
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="pt-2 space-y-3">
                        <button
                            onClick={handleLogout}
                            className="w-full bg-red-50/80 text-red-600 font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-[0.98]"
                        >
                            <FiLogOut size={20} /> Logout
                        </button>

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full bg-transparent text-gray-400 font-bold py-4 rounded-[20px] flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-[0.98]"
                        >
                            <FiAlertTriangle size={18} /> Delete Account
                        </button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="text-center pb-8">
                        <p className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">DriveOn Employee App</p>
                        <p className="text-[10px] text-gray-300 font-medium mt-1">v1.2.0 • Build 429</p>
                    </motion.div>
                </motion.div>
            </div>

            <BottomNav />

            {/* Premium Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setShowDeleteModal(false)}
                            className="absolute inset-0 bg-[#1C205C]/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-white/20"
                        >
                            <div className="p-8 text-center">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <FiAlertTriangle className="text-red-500" size={36} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Account?</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-8 px-2">
                                    This action is permanent and cannot be undone. All your data will be permanently removed.
                                </p>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            "Yes, Delete My Account"
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={isDeleting}
                                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Photo Source Selection Bottom Sheet */}
            <AnimatePresence>
                {showSourceModal && (
                    <div className="fixed inset-0 z-[100] flex items-end justify-center">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSourceModal(false)}
                            className="absolute inset-0 bg-[#1C205C]/40 backdrop-blur-sm"
                        />
                        {/* Bottom Sheet */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl relative z-10 border-t border-gray-100 pb-10 animate-in"
                        >
                            {/* Drag Handle Indicator */}
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                            
                            <h3 className="text-xl font-black text-gray-900 mb-6 text-center">Change Profile Photo</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => {
                                        setShowSourceModal(false);
                                        setTimeout(() => {
                                            cameraInputRef.current?.click();
                                        }, 100);
                                    }}
                                    className="flex flex-col items-center justify-center p-5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-2xl transition-all active:scale-95 group"
                                >
                                    <div className="w-14 h-14 bg-[#1C205C] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                                        <FiCamera size={24} />
                                    </div>
                                    <span className="font-bold text-gray-800 text-sm">Camera</span>
                                </button>
                                
                                <button
                                    onClick={() => {
                                        setShowSourceModal(false);
                                        setTimeout(() => {
                                            galleryInputRef.current?.click();
                                        }, 100);
                                    }}
                                    className="flex flex-col items-center justify-center p-5 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-2xl transition-all active:scale-95 group"
                                >
                                    <div className="w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-3">
                                        <FiImage size={24} />
                                    </div>
                                    <span className="font-bold text-gray-800 text-sm">Gallery</span>
                                </button>
                            </div>
                            
                            <button
                                onClick={() => setShowSourceModal(false)}
                                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all text-center"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Edit Profile Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isSavingProfile && setShowEditModal(false)}
                            className="absolute inset-0 bg-[#1C205C]/40 backdrop-blur-md"
                        />
                        {/* Modal Dialog */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-white/20 p-8"
                        >
                            <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">Edit Profile</h3>
                            
                            <form onSubmit={handleSaveProfile} className="space-y-5">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                            <FiUser size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Enter your name"
                                            disabled={isSavingProfile}
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20 focus:border-[#1C205C] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                            <FiMail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            disabled={isSavingProfile}
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-[15px] font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1C205C]/20 focus:border-[#1C205C] transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Phone Input (Disabled) */}
                                <div>
                                    <div className="flex justify-between items-center mb-2 ml-1">
                                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Not Editable</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                                            <FiPhone size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            value={user.phone}
                                            disabled
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl text-[15px] font-bold text-gray-400 cursor-not-allowed select-none"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-300">
                                            <FiShield size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex flex-col gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSavingProfile}
                                        className="w-full bg-[#1C205C] hover:bg-[#242976] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#1C205C]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSavingProfile ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={isSavingProfile}
                                        className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SectionTitle = ({ title }) => (
    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-2">{title}</h3>
);

const InfoRow = ({ icon, label, value, isLast }) => (
    <div className={`flex items-center gap-4 p-3 hover:bg-gray-50/50 transition-colors rounded-[16px] ${!isLast ? 'mb-1' : ''}`}>
        <div className="w-12 h-12 rounded-[14px] bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 shadow-sm border border-gray-100">
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-[15px] font-bold text-gray-800 tracking-wide">{value}</p>
        </div>
    </div>
);

const MenuRow = ({ icon, label, color, bg, hasBadge, badgeCount, onClick, isLast }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50/80 transition-all rounded-[16px] group active:scale-[0.98] ${!isLast ? 'mb-1' : ''}`}
    >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${bg} ${color} shadow-sm border border-white group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
            <span className="font-bold text-gray-800 text-[15px] tracking-wide">{label}</span>
        </div>
        <div className="flex items-center gap-3 pr-2">
            {hasBadge && <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">{badgeCount}</span>}
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                <FiChevronRight className="text-gray-400" size={18} />
            </div>
        </div>
    </button>
);

export default ProfilePage;
