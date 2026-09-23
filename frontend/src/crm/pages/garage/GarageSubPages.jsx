import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdStore,
    MdBuild,
    MdHistory,
    MdAttachMoney,
    MdSecurity,
    MdNotificationsActive,
    MdPhone,
    MdStar,
    MdLocationOn,
    MdSearch,
    MdFilterList,
    MdMoreVert,
    MdDirectionsCar,
    MdDateRange,
    MdReceipt,
    MdWarning,
    MdCheckCircle,
    MdAccessTime,
    MdClose,
    MdAdd,
    MdEdit,
    MdDelete,
    MdVisibility
} from 'react-icons/md';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import ThemedDropdown from '../../components/ThemedDropdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Shared Components ---

const SimpleModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <MdClose size={20} className="text-gray-500" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        'Active': 'bg-green-50 text-green-700 border-green-200',
        'Inactive': 'bg-red-50 text-red-700 border-red-200',
        'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
        'Pending': 'bg-orange-50 text-orange-700 border-orange-200',
        'Completed': 'bg-gray-50 text-gray-700 border-gray-200',
        'Expiring Soon': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Valid': 'bg-green-50 text-green-700 border-green-200',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
            {status}
        </span>
    );
};

const GarageCard = ({ garage, onDetails, onEdit, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-[#1c205c]/10 group-hover:text-[#1c205c] transition-colors">
                        <MdStore size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-[#1c205c] transition-colors">{garage.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MdLocationOn /> {garage.location}
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        className="p-1 text-gray-400 hover:text-[#1c205c] hover:bg-[#1c205c]/10 rounded-full transition-colors"
                    >
                        <MdMoreVert size={20} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(garage); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#1c205c]/10 hover:text-[#1c205c] transition-colors flex items-center gap-2"
                            >
                                <MdEdit size={14} /> Edit
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(garage._id); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <MdDelete size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                    <MdPhone className="text-gray-400" /> {garage.phone}
                </div>
                <div className="flex items-center gap-2">
                    <MdBuild className="text-gray-400" /> Specialist: <span className="font-medium text-gray-800">{garage.specialist || garage.specialistIn}</span>
                </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                <button
                    onClick={() => onDetails(garage)}
                    className="w-full py-2 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    View Details
                </button>
            </div>
        </motion.div>
    );
};

const RepairItem = ({ repair, onDelete, onComplete, onEdit, onShowHistory }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 shrink-0 mt-1">
                    <MdBuild size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 flex flex-wrap items-center gap-2">
                        {repair.car}
                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md uppercase">
                            {repair.reg}
                        </span>
                    </h4>

                    <p className="text-sm font-medium text-[#1c205c] mt-1">
                        <span className="text-gray-400">At garage:</span> {repair.garage}
                    </p>

                    {repair.issues && repair.issues.length > 0 ? (
                        <div className="mt-3 pl-4 border-l-2 border-red-200 space-y-1.5">
                            {repair.issues.map((item, idx) => (
                                <p key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
                                    {item}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 mt-2 pl-4 border-l-2 border-red-200 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
                            {repair.issue}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 border-t md:border-0 pt-4 md:pt-0 border-gray-50">
                <div className="text-left md:text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Estimated Cost</span>
                    <span className="text-base font-extrabold text-[#1c205c] bg-[#1c205c]/5 px-2.5 py-1 rounded-lg inline-block mt-0.5">
                        ₹{(repair.cost || 0).toLocaleString('en-IN')}
                    </span>
                </div>

                <div className="text-left md:text-right font-medium">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Return Date and Time</span>
                    <span className="text-sm font-bold text-gray-700 block mt-1">{repair.completionDate}</span>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-gray-400 hover:text-[#1c205c] hover:bg-[#1c205c]/10 rounded-full transition-colors"
                    >
                        <MdMoreVert size={24} />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                            <button
                                onClick={() => { onEdit(repair); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#1c205c]/10 hover:text-[#1c205c] transition-colors flex items-center gap-2"
                            >
                                <MdEdit size={16} /> Edit Repair
                            </button>
                            <button
                                onClick={() => { onComplete(repair.id); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#1c205c]/10 hover:text-[#1c205c] transition-colors flex items-center gap-2"
                            >
                                <MdCheckCircle size={16} /> Mark as Complete
                            </button>
                            <button
                                onClick={() => { onDelete(repair.id); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <MdClose size={16} /> Delete Repair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// --- Mock Data ---

// MOCK_GARAGES and MOCK_REPAIRS removed as they are now fetched from API




const MOCK_PARTS = [
    { id: 1, name: "Exide Battery 65Ah", category: "Battery", stock: 4, cost: 4500, supplier: "Exide Dealer Delhi" },
    { id: 2, name: "Michelin Primacy 4ST", category: "Tyres", stock: 2, cost: 9500, supplier: "Tyre Empire" },
    { id: 3, name: "Motul 5W40 Engine Oil", category: "Fluid", stock: 15, cost: 3500, supplier: "Lube Distributors" },
];



// --- Pages ---

export const AllGaragesPage = () => {
    const navigate = useNavigate();
    const [garages, setGarages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedGarage, setSelectedGarage] = useState(null);
    const [editingGarage, setEditingGarage] = useState(null);
    const [newGarage, setNewGarage] = useState({ name: '', location: '', phone: '', specialist: '', rating: '4.0' });
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchGarages();
    }, []);

    const fetchGarages = async () => {
        try {
            const res = await api.get('/crm/garages');
            if (res.data.success) {
                setGarages(res.data.data.garages);
            }
        } catch (error) {
            console.error('Error fetching garages:', error);
            toast.error('Failed to load garages');
        } finally {
            setLoading(false);
        }
    };

    const trimmedSearch = searchTerm.trim().toLowerCase();
    const keywords = trimmedSearch.split(/\s+/).filter(Boolean);
    const filteredGarages = garages.filter(garage =>
        keywords.length === 0 || keywords.every(keyword =>
            garage.name.toLowerCase().includes(keyword) ||
            garage.location.toLowerCase().includes(keyword) ||
            (garage.specialistIn || '').toLowerCase().includes(keyword)
        )
    );


    const validate = () => {
        let tempErrors = {};
        if (!newGarage.name) tempErrors.name = "Garage Name is required.";
        if (!newGarage.location) tempErrors.location = "Location is required.";
        if (!newGarage.specialist) tempErrors.specialist = "Specialist field is required.";
        if (!/^\d{10}$/.test(newGarage.phone)) {
            tempErrors.phone = "Phone number must be 10 digits.";
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleAddGarage = async () => {
        if (!validate()) return;

        try {
            const payload = {
                ...newGarage,
                specialistIn: newGarage.specialist // Map specialist to specialistIn
            };

            let res;
            if (editingGarage) {
                res = await api.put(`/crm/garages/${editingGarage._id}`, payload);
            } else {
                res = await api.post('/crm/garages', payload);
            }

            if (res.data.success) {
                toast.success(editingGarage ? 'Garage updated successfully' : 'Garage added successfully');
                fetchGarages();
                setIsAddModalOpen(false);
                setNewGarage({ name: '', location: '', phone: '', specialist: '', rating: '4.0' });
                setEditingGarage(null);
                setErrors({});
            }
        } catch (error) {
            console.error('Error saving garage:', error);
            toast.error(error.response?.data?.message || 'Failed to save garage');
        }
    };

    const handleEditGarage = (garage) => {
        setEditingGarage(garage);
        setNewGarage({
            name: garage.name,
            location: garage.location,
            phone: garage.phone,
            specialist: garage.specialistIn || garage.specialist, // Handle both cases just in case
            rating: garage.rating || '4.0'
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteGarage = async (id) => {
        if (!window.confirm('Are you sure you want to delete this garage?')) return;
        try {
            await api.delete(`/crm/garages/${id}`);
            toast.success('Garage deleted successfully');
            setGarages(garages.filter(g => g._id !== id));
        } catch (error) {
            console.error('Error deleting garage:', error);
            toast.error('Failed to delete garage');
        }
    };

    const handleViewDetails = (garage) => {
        setSelectedGarage(garage);
        setIsDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
                        <span>/</span>
                        <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/garage/all')}>Garage</span>
                        <span>/</span>
                        <span className="text-gray-800 font-medium">All Garages</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Partner Garages</h1>
                    <p className="text-gray-500 text-sm">Network of authorized service centers.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search garages..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingGarage(null);
                            setNewGarage({ name: '', location: '', phone: '', specialist: '', rating: '4.0' });
                            setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-[#1c205c] text-white rounded-xl shadow-lg shadow-gray-300 hover:bg-[#252d6d] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <MdStore /> Add Garage
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading garages...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredGarages.map(active => (
                        <GarageCard
                            key={active._id || active.id}
                            garage={{ ...active, specialist: active.specialistIn || active.specialist }}
                            onDetails={handleViewDetails}
                            onEdit={handleEditGarage}
                            onDelete={handleDeleteGarage}
                        />
                    ))}
                </div>
            )}

            {!loading && filteredGarages.length === 0 && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
                        <MdSearch size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">No results found</h3>
                    <p className="text-gray-500">No garages match your search for "{searchTerm}"</p>
                </div>
            )}

            {/* Add/Edit Garage Modal */}
            <SimpleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingGarage ? "Edit Garage" : "Add New Garage"}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Garage Name</label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="e.g. Speed Auto Works"
                            value={newGarage.name}
                            onChange={(e) => {
                                setNewGarage({ ...newGarage, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: null });
                            }}
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] ${errors.location ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="e.g. Sector 15, Noida"
                            value={newGarage.location}
                            onChange={(e) => {
                                setNewGarage({ ...newGarage, location: e.target.value });
                                if (errors.location) setErrors({ ...errors, location: null });
                            }}
                        />
                        {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="10 digit mobile number"
                            value={newGarage.phone}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val) && val.length <= 10) {
                                    setNewGarage({ ...newGarage, phone: val });
                                    if (errors.phone) setErrors({ ...errors, phone: null });
                                }
                            }}
                        />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialist In</label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] ${errors.specialist ? 'border-red-500' : 'border-gray-200'}`}
                            placeholder="e.g. Engine, Denting"
                            value={newGarage.specialist}
                            onChange={(e) => {
                                setNewGarage({ ...newGarage, specialist: e.target.value });
                                if (errors.specialist) setErrors({ ...errors, specialist: null });
                            }}
                        />
                        {errors.specialist && <p className="text-xs text-red-500 mt-1">{errors.specialist}</p>}
                    </div>
                    <button
                        onClick={handleAddGarage}
                        className="w-full py-2.5 bg-[#1c205c] text-white rounded-xl font-bold hover:bg-[#252d6d] transition-colors shadow-lg shadow-gray-300"
                    >
                        {editingGarage ? "Update Garage" : "Add Garage"}
                    </button>
                </div>
            </SimpleModal>

            {/* Garage Details Modal */}
            <SimpleModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Garage Details">
                {selectedGarage && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                                <MdStore size={40} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl text-gray-900">{selectedGarage.name}</h4>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <MdLocationOn /> {selectedGarage.location}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <p className="text-xs text-gray-400 uppercase font-bold">Contact</p>
                                <p className="font-medium text-gray-800">{selectedGarage.phone}</p>
                            </div>
                        </div>
                        <div className="bg-[#1c205c]/10 p-4 rounded-xl border border-[#1c205c]/20">
                            <p className="text-xs text-[#1c205c] uppercase font-bold mb-1">Specialization</p>
                            <div className="flex items-center gap-2 text-[#1c205c] font-medium">
                                <MdBuild /> {selectedGarage.specialistIn || selectedGarage.specialist}
                            </div>
                        </div>

                    </div>
                )}
            </SimpleModal>
        </div>
    );
};

const CarRepairHistoryModal = ({ repair, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await api.get('/crm/repairs/logs');
                if (res.data.success) {
                    // Filter completed repairs for this specific car
                    const carLogs = res.data.data.logs.filter(log => 
                        log.car?._id === repair.carId || 
                        (log.car?.registrationNumber || '').toUpperCase().trim() === (repair.reg || '').toUpperCase().trim()
                    );
                    setLogs(carLogs);
                }
            } catch (err) {
                console.error('Error fetching repair history:', err);
                toast.error('Failed to load repair history');
            } finally {
                setLoading(false);
            }
        };

        if (repair) {
            fetchHistory();
        }
    }, [repair]);

    if (!repair) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-150 px-6 py-5 flex items-center justify-between z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100 uppercase">
                                {repair.reg}
                            </span>
                            <span className="text-sm font-semibold text-gray-500">Repair History</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {repair.car}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-400 hover:text-gray-650">
                        <MdClose size={22} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                            <p className="text-gray-500 text-sm font-medium">Fetching history...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
                            <MdBuild size={36} className="mx-auto mb-2 text-gray-300 animate-pulse" />
                            <p className="font-bold text-sm text-gray-600">No previous repairs recorded</p>
                            <p className="text-xs text-gray-450 mt-1">This is the first repair job for this vehicle in our CRM database.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Stats summary */}
                            <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Total Repairs</span>
                                    <p className="text-lg font-black text-indigo-950">{logs.length}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Total Repair Cost</span>
                                    <p className="text-lg font-black text-indigo-950">₹{logs.reduce((sum, log) => sum + (log.cost || 0), 0).toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            {/* Timeline / logs list */}
                            <div className="relative border-l-2 border-gray-150 pl-4 ml-2 space-y-6 py-2">
                                {logs.map((log, idx) => {
                                    const compDate = log.completedAt 
                                        ? new Date(log.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                        : 'N/A';
                                    
                                    return (
                                        <div key={log._id || idx} className="relative">
                                            {/* Bullet point */}
                                            <span className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white ring-4 ring-red-50"></span>
                                            
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className="text-xs font-bold text-gray-400 block">{compDate}</span>
                                                    <span className="text-xs font-bold text-red-650 bg-red-50 px-2.5 py-0.5 rounded border border-red-100">
                                                        ₹{(log.cost || 0).toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                                                    At garage: <span className="text-gray-800">{log.garage?.name || 'Unknown'}</span>
                                                </p>
                                                
                                                {/* pointwise issues */}
                                                {log.issues && log.issues.length > 0 ? (
                                                    <div className="mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xxs font-medium text-gray-600 space-y-1">
                                                        {log.issues.map((issue, issueIdx) => (
                                                            <div key={issueIdx} className="flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                                                                <span>{issue}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-xl mt-1.5 border border-gray-100">
                                                        {log.serviceType || log.description || 'N/A'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const OverallRepairHistoryModal = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssues, setSelectedIssues] = useState(null);

    useEffect(() => {
        const fetchOverallHistory = async () => {
            try {
                setLoading(true);
                const res = await api.get('/crm/repairs/logs');
                if (res.data.success) {
                    setLogs(res.data.data.logs || []);
                }
            } catch (err) {
                console.error('Error fetching overall history:', err);
                toast.error('Failed to load overall history');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchOverallHistory();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-150 px-6 py-5 flex items-center justify-between z-10">
                    <div>
                        <span className="text-sm font-semibold text-gray-500 mb-1 block">Garage Analytics</span>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <MdHistory className="text-[#1c205c]" />
                            Overall Completed Repairs & Logs
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95 text-gray-400 hover:text-gray-650">
                        <MdClose size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p className="text-gray-500 font-semibold">Loading completed repair logs...</p>
                        </div>
                    ) : (
                        <>
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/30 border border-indigo-100 rounded-2xl">
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Total Jobs Completed</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-indigo-950">{logs.length}</span>
                                        <span className="text-xs text-indigo-600 font-bold">vehicles fixed</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-emerald-50/60 to-teal-50/30 border border-emerald-100 rounded-2xl">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Total Historical Cost</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-emerald-950">₹{totalCost.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <MdReceipt className="text-indigo-600" />
                                    All Historical Repairs List
                                </h3>

                                {logs.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-250 p-6">
                                        <p className="text-gray-500 font-bold text-sm">No completed repairs found.</p>
                                    </div>
                                ) : (
                                    <div className="border border-gray-150 rounded-xl overflow-hidden shadow-sm bg-white overflow-x-auto">
                                        <table className="w-full text-xs text-left text-gray-500">
                                            <thead className="text-[10px] text-gray-700 uppercase bg-gray-50 border-b border-gray-150 font-black sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3">Vehicle</th>
                                                    <th className="px-4 py-3">Reg. Number</th>
                                                    <th className="px-4 py-3">Garage</th>
                                                    <th className="px-4 py-3">Issues Resolved</th>
                                                    <th className="px-4 py-3 text-right">Cost</th>
                                                    <th className="px-4 py-3 text-right">Completion Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logs.map((log, index) => {
                                                    const dateStr = log.completedAt 
                                                        ? new Date(log.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : 'N/A';

                                                    const issuesList = log.issues && log.issues.length > 0
                                                        ? log.issues.join(', ')
                                                        : log.serviceType || log.description || 'N/A';

                                                    return (
                                                        <tr key={log._id || index} className="bg-white border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-4 py-3 font-bold text-gray-900">{log.car ? `${log.car.brand} ${log.car.model}` : 'Deleted Car'}</td>
                                                            <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-gray-600 font-mono font-bold uppercase">{log.car?.registrationNumber || 'N/A'}</span></td>
                                                            <td className="px-4 py-3 font-medium text-gray-600">{log.garage?.name || 'N/A'}</td>
                                                            <td className="px-4 py-3 text-gray-550 max-w-xs">
                                                                <div className="flex items-center gap-2 justify-between">
                                                                    <span className="truncate flex-1" title={issuesList}>{issuesList}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            const list = log.issues && log.issues.length > 0 
                                                                                ? log.issues 
                                                                                : [log.serviceType || log.description || 'No issues recorded'];
                                                                            setSelectedIssues({
                                                                                car: log.car ? `${log.car.brand} ${log.car.model}` : 'Deleted Car',
                                                                                reg: log.car?.registrationNumber || 'N/A',
                                                                                issues: list
                                                                            });
                                                                        }}
                                                                        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95 shrink-0"
                                                                        title="View Full Issues"
                                                                    >
                                                                        <MdVisibility size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-gray-900">₹{(log.cost || 0).toLocaleString('en-IN')}</td>
                                                            <td className="px-4 py-3 text-right font-medium text-gray-500">{dateStr}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* View Issues Modal */}
            <SimpleModal 
                isOpen={!!selectedIssues} 
                onClose={() => setSelectedIssues(null)} 
                title="Issues Resolved"
            >
                {selectedIssues && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded border border-red-100 uppercase">
                                {selectedIssues.reg}
                            </span>
                            <span className="font-bold text-gray-800 text-sm">
                                {selectedIssues.car}
                            </span>
                        </div>
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                            {selectedIssues.issues.map((issue, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 animate-pulse"></span>
                                    <span className="text-sm font-medium text-gray-700 leading-relaxed">{issue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </SimpleModal>
        </div>
    );
};

export const ActiveRepairsPage = () => {
    const navigate = useNavigate();
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingRepair, setEditingRepair] = useState(null);
    const [newRepair, setNewRepair] = useState({
        car: '',
        garage: '',
        issue: '',
        issues: [],
        cost: '',
        progress: 0,
        completionDate: '',
        completionTime: ''
    });

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyRepair, setHistoryRepair] = useState(null);
    const [isOverallHistoryModalOpen, setIsOverallHistoryModalOpen] = useState(false);

    const handleShowHistory = (repair) => {
        setHistoryRepair(repair);
        setIsHistoryModalOpen(true);
    };

    const handleShowOverallHistory = () => {
        setIsOverallHistoryModalOpen(true);
    };

    const [carOptions, setCarOptions] = useState([]);
    const [garageOptions, setGarageOptions] = useState([]);
    const [selectedGarageFilter, setSelectedGarageFilter] = useState('all');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [repairsRes, carsRes, garagesRes] = await Promise.all([
                api.get('/crm/repairs/active'),
                api.get('/crm/cars-simple'),
                api.get('/crm/garages')
            ]);

            if (repairsRes.data.success) {
                // Map API data to UI structure
                const mappedRepairs = repairsRes.data.data.repairs.map(r => ({
                    id: r._id,
                    car: r.car ? `${r.car.brand} ${r.car.model}` : 'Unknown Car',
                    carId: r.car?._id,
                    reg: r.car?.registrationNumber || 'N/A',
                    garage: r.garage?.name || 'Unknown Garage',
                    garageId: r.garage?._id,
                    issue: r.serviceType || r.description,
                    issues: r.issues || [],
                    cost: r.cost || 0,
                    progress: r.progress,
                    rawEstimatedCompletion: r.estimatedCompletion,
                    completionDate: r.estimatedCompletion
                        ? new Date(r.estimatedCompletion).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                        : 'Pending'
                }));
                setRepairs(mappedRepairs);
            }

            if (carsRes.data.success) {
                setCarOptions(carsRes.data.data.cars);
            }

            if (garagesRes.data.success) {
                const gOptions = garagesRes.data.data.garages.map(g => ({
                    value: g._id,
                    label: g.name
                }));
                setGarageOptions(gOptions);
            }

        } catch (error) {
            console.error('Error fetching repairs/options:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddIssueItem = () => {
        if (!newRepair.issue.trim()) {
            toast.error("Please type an issue first!");
            return;
        }
        setNewRepair(prev => ({
            ...prev,
            issues: [...prev.issues, prev.issue.trim()],
            issue: ''
        }));
    };

    const handleRemoveIssueItem = (index) => {
        setNewRepair(prev => ({
            ...prev,
            issues: prev.issues.filter((_, idx) => idx !== index)
        }));
    };

    const handleAddRepair = async () => {
        if (newRepair.issues.length === 0) {
            toast.error('Please add at least one issue using the "+" button');
            return;
        }
        if (!newRepair.car || !newRepair.garage) {
            toast.error('Please select both Vehicle and Garage');
            return;
        }

        try {
            const serviceType = newRepair.issues.join(', ');
            const description = newRepair.issues.map(item => `• ${item}`).join('\n');

            let estimatedCompletion = undefined;
            if (newRepair.completionDate) {
                const timeStr = newRepair.completionTime || '12:00';
                estimatedCompletion = new Date(`${newRepair.completionDate}T${timeStr}`);
            }

            const payload = {
                car: newRepair.car,
                garage: newRepair.garage,
                serviceType: serviceType.substring(0, 100),
                description: description,
                issues: newRepair.issues,
                cost: parseFloat(newRepair.cost) || 0,
                estimatedCompletion,
                status: 'Repair'
            };

            let res;
            if (editingRepair) {
                res = await api.put(`/crm/repairs/${editingRepair.id}`, payload);
            } else {
                res = await api.post('/crm/repairs', payload);
            }

            if (res.data.success) {
                toast.success(editingRepair ? 'Repair job updated' : 'Repair job started');
                fetchInitialData();
                setIsAddModalOpen(false);
                setEditingRepair(null);
                setNewRepair({ car: '', garage: '', issue: '', issues: [], cost: '', progress: 0, completionDate: '', completionTime: '' });
            }

        } catch (error) {
            console.error('Error saving repair:', error);
            toast.error('Failed to save repair job');
        }
    };

    const handleDeleteRepair = async (id) => {
        if (!window.confirm('Are you sure you want to delete this repair job?')) return;
        try {
            await api.delete(`/crm/repairs/${id}`);
            toast.success('Repair job deleted');
            setRepairs(repairs.filter(r => r.id !== id));
        } catch (error) {
            console.error('Delete repair error:', error);
            toast.error('Failed to delete repair');
        }
    };

    const handleCompleteRepair = async (id) => {
        if (!window.confirm('Mark this repair as complete?')) return;
        try {
            await api.put(`/crm/repairs/${id}`, { status: 'Completed', progress: 100 });
            toast.success('Repair marked as complete');
            setRepairs(repairs.filter(r => r.id !== id));
        } catch (error) {
            console.error('Complete repair error:', error);
            toast.error('Failed to complete repair');
        }
    };

    const handleEditRepair = (repair) => {
        setEditingRepair(repair);
        const estDate = repair.rawEstimatedCompletion ? new Date(repair.rawEstimatedCompletion) : null;
        let dateStr = '';
        let timeStr = '';
        if (estDate) {
            const y = estDate.getFullYear();
            const m = String(estDate.getMonth() + 1).padStart(2, '0');
            const d = String(estDate.getDate()).padStart(2, '0');
            dateStr = `${y}-${m}-${d}`;

            const hh = String(estDate.getHours()).padStart(2, '0');
            const mm = String(estDate.getMinutes()).padStart(2, '0');
            timeStr = `${hh}:${mm}`;
        }

        setNewRepair({
            car: repair.carId,
            garage: repair.garageId,
            issue: '',
            issues: repair.issues || (repair.issue ? [repair.issue] : []),
            cost: repair.cost !== undefined ? repair.cost.toString() : '',
            progress: repair.progress,
            completionDate: dateStr,
            completionTime: timeStr
        });
        setIsAddModalOpen(true);
    };

    const handleDownloadPDF = (type) => {
        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Colors
            const primaryColor = [28, 32, 92]; // #1c205c

            // Title and Header Styling
            doc.setFontSize(18);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont('helvetica', 'bold');

            const title = type === 'filtered' && selectedGarageFilter !== 'all'
                ? `Active Repairs - ${selectedGarageFilter}`
                : 'Active Garage Repairs - Overall Report';

            doc.text(title, 14, 15);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 21);

            // Table Data Compilation
            const dataToExport = type === 'filtered' ? filteredRepairs : repairs;

            if (dataToExport.length === 0) {
                toast.error('No repair data available to export!');
                return;
            }

            const tableRows = dataToExport.map((repair, idx) => {
                const issuesStr = repair.issues && repair.issues.length > 0
                    ? repair.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')
                    : repair.issue || 'N/A';

                return [
                    idx + 1,
                    repair.car,
                    repair.reg,
                    repair.garage,
                    issuesStr,
                    `Rs. ${(repair.cost || 0).toLocaleString('en-IN')}`,
                    repair.completionDate || 'Pending'
                ];
            });

            const tableHeaders = [
                ['#', 'Vehicle Name', 'Reg. Number', 'Garage Name', 'Repair Issues / Services', 'Estimated Cost', 'Estimated Return']
            ];

            autoTable(doc, {
                head: tableHeaders,
                body: tableRows,
                startY: 26,
                theme: 'striped',
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [50, 50, 50],
                    valign: 'top'
                },
                columnStyles: {
                    0: { cellWidth: 10 }, // #
                    1: { cellWidth: 40, fontStyle: 'bold' }, // Vehicle
                    2: { cellWidth: 35 }, // Reg
                    3: { cellWidth: 40 }, // Garage
                    4: { cellWidth: 85 }, // Issues
                    5: { cellWidth: 30, fontStyle: 'bold' }, // Cost
                    6: { cellWidth: 35 } // Return
                },
                didParseCell: (data) => {
                    if (data.column.index === 4 && data.cell.section === 'body') {
                        data.cell.styles.cellPadding = 3;
                    }
                },
                styles: {
                    overflow: 'linebreak',
                    cellPadding: 2
                }
            });

            const filename = type === 'filtered' && selectedGarageFilter !== 'all'
                ? `repairs_${selectedGarageFilter.toLowerCase().replace(/\s+/g, '_')}.pdf`
                : 'overall_active_repairs.pdf';

            doc.save(filename);
            toast.success('PDF report downloaded successfully!');
        } catch (error) {
            console.error('PDF Generation Error:', error);
            toast.error('Failed to generate PDF report');
        }
    };

    const filteredRepairs = repairs.filter(repair => {
        if (selectedGarageFilter === 'all') return true;
        return repair.garage === selectedGarageFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
                        <span>/</span>
                        <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/garage/all')}>Garage</span>
                        <span>/</span>
                        <span className="text-gray-800 font-medium">Active Repairs</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Active Repairs</h1>
                    <p className="text-gray-500 text-sm">Real-time status of vehicles in garage.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleShowOverallHistory}
                        className="px-4 py-2.5 bg-indigo-50 text-[#1c205c] border border-indigo-200 rounded-xl hover:bg-indigo-100 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                    >
                        <MdHistory size={20} />Overall History
                    </button>
                    <button
                        onClick={() => {
                            setEditingRepair(null);
                            setNewRepair({ car: '', garage: '', issue: '', issues: [], cost: '', progress: 0, completionDate: '', completionTime: '' });
                            setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-[#1c205c] text-white rounded-xl shadow-lg shadow-gray-300 hover:bg-[#252d6d] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <MdAdd size={20} />Add New Repair
                    </button>
                </div>
            </div>

            {/* Premium Filter and PDF Export Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Filter by Garage:</span>
                    <select
                        value={selectedGarageFilter}
                        onChange={(e) => setSelectedGarageFilter(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] text-sm font-semibold text-gray-700 w-full sm:w-64 transition-all cursor-pointer"
                    >
                        <option value="all">All Garages</option>
                        {garageOptions.map(opt => (
                            <option key={opt.value} value={opt.label}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => handleDownloadPDF('overall')}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#1c205c] hover:bg-[#252d6d] text-white font-bold rounded-xl shadow-lg shadow-gray-200 text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <MdReceipt size={18} /> Download Overall PDF
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10">Loading repairs...</div>
                ) : filteredRepairs.length > 0 ? (
                    filteredRepairs.map(repair => (
                        <RepairItem key={repair.id} repair={repair} onDelete={handleDeleteRepair} onComplete={handleCompleteRepair} onEdit={handleEditRepair} onShowHistory={handleShowHistory} />
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        No active repairs found for this selection.
                    </div>
                )}
            </div>

            {/* Add Repair Modal */}
            <SimpleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingRepair ? "Edit Repair" : "New Repair"}>
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                        <ThemedDropdown
                            options={carOptions}
                            value={newRepair.car}
                            onChange={(val) => setNewRepair({ ...newRepair, car: val })}
                            className="bg-white"
                            placeholder="Select Vehicle"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Garage</label>
                        <ThemedDropdown
                            options={garageOptions}
                            value={newRepair.garage}
                            onChange={(val) => setNewRepair({ ...newRepair, garage: val })}
                            className="bg-white"
                            placeholder="Select Garage"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Add Repair Issue</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] text-sm"
                                placeholder="e.g. Brake Pad Replacement"
                                value={newRepair.issue}
                                onChange={(e) => setNewRepair({ ...newRepair, issue: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddIssueItem();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddIssueItem}
                                className="px-3 py-2 bg-[#1c205c] text-white rounded-lg hover:bg-[#252d6d] transition-colors flex items-center justify-center shadow-sm"
                            >
                                <MdAdd size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Point-wise Issue Table Format */}
                    {newRepair.issues.length > 0 && (
                        <div className="border border-gray-150 rounded-xl overflow-hidden bg-gray-50 max-h-48 overflow-y-auto shadow-inner">
                            <table className="w-full text-xs text-left text-gray-500">
                                <thead className="text-[10px] text-gray-700 uppercase bg-gray-100 border-b border-gray-150 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-3 py-2">#</th>
                                        <th scope="col" className="px-3 py-2">Issue Description</th>
                                        <th scope="col" className="px-3 py-2 text-right">Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {newRepair.issues.map((item, idx) => (
                                        <tr key={idx} className="bg-white border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="px-3 py-2 font-medium text-gray-900">{idx + 1}</td>
                                            <td className="px-3 py-2 text-gray-700 font-medium">{item}</td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveIssueItem(idx)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-colors inline-flex items-center"
                                                >
                                                    <MdDelete size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost (₹)</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] text-sm"
                            placeholder="e.g. 5000"
                            value={newRepair.cost}
                            onChange={(e) => setNewRepair({ ...newRepair, cost: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] text-sm"
                                value={newRepair.completionDate}
                                onChange={(e) => setNewRepair({ ...newRepair, completionDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                            <input
                                type="time"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] text-sm"
                                value={newRepair.completionTime}
                                onChange={(e) => setNewRepair({ ...newRepair, completionTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAddRepair}
                        className="w-full py-2.5 bg-[#1c205c] text-white rounded-xl font-bold hover:bg-[#252d6d] transition-colors shadow-lg shadow-gray-300 mt-2"
                    >
                        {editingRepair ? "Update Repair" : "Start Repair"}
                    </button>
                </div>
            </SimpleModal>

            {/* Specific Car Repair History Modal */}
            <CarRepairHistoryModal repair={historyRepair} onClose={() => setIsHistoryModalOpen(false)} />

            {/* Overall Repair History Modal */}
            <OverallRepairHistoryModal isOpen={isOverallHistoryModalOpen} onClose={() => setIsOverallHistoryModalOpen(false)} />
        </div>
    );
};



export const PartsCostPage = () => {
    const navigate = useNavigate();
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
                        <span>/</span>
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/garage/all')}>Garage</span>
                        <span>/</span>
                        <span className="text-gray-800 font-medium">Inventory</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory & Parts Cost</h1>
                    <p className="text-gray-500 text-sm">Track spare parts inventory and pricing.</p>
                </div>
                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 flex items-center gap-2">
                    <MdFilterList /> Filter
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MOCK_PARTS.map(part => (
                    <div key={part.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-800">{part.name}</h4>
                            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{part.category}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{part.supplier}</p>

                        <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Unit Cost</p>
                                <p className="text-lg font-bold text-indigo-600">₹ {part.cost.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase text-right">Stock</p>
                                <p className="text-lg font-bold text-gray-900 text-right">{part.stock} Units</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


