import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { AnimatePresence, motion } from 'framer-motion';
import {
    MdLocationCity,
    MdAdd,
    MdEdit,
    MdDelete,
    MdAttachMoney,
    MdLabel,
    MdRule,
    MdSecurity,
    MdCheckCircle,
    MdNotificationsActive,
    MdFlashOn,
    MdClose,
    MdGroup,
    MdSearch
} from 'react-icons/md';
import { premiumColors } from '../../../theme/colors';
import { rgba } from 'polished';
import ThemedDropdown from '../../components/ThemedDropdown';

// --- Shared Components ---

const Toggle = ({ enabled, onToggle }) => (
    <div
        onClick={onToggle}
        className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors`}
        style={{ backgroundColor: enabled ? premiumColors.primary.DEFAULT : '#e0e3e8' }}
    >
        <motion.div
            layout
            className="w-5 h-5 bg-white rounded-full shadow-sm"
        />
    </div>
);

const SettingCard = ({ title, subtitle, children, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}
    >
        <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {children}
    </motion.div>
);

// --- Mock Data ---

// Mock Data MOCK_CITIES removed for backend integration





// --- Overview Page ---
export const SettingsOverviewPage = () => {
    const navigate = useNavigate();

    const menuItems = [
        { title: "Locations", desc: "Cities & Hubs Management", icon: MdLocationCity, path: '/crm/settings/locations' },

        { title: "Team Access", desc: "Roles & Permissions", icon: MdSecurity, path: '/crm/settings/roles' },
        { title: "Automations", desc: "Workflow Rules", icon: MdFlashOn, path: '/crm/settings/automation' },

    ];

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
                    <span>/</span>
                    <span className="text-gray-800 font-medium">Settings</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: premiumColors.primary.DEFAULT }}>Settings Dashboard</h1>
                <p className="text-gray-500 text-sm">Central control panel for your CRM.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item, i) => (
                    <motion.div
                        key={i}
                        onClick={() => navigate(item.path)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 flex items-center gap-4 cursor-pointer hover:shadow-xl transition-all"
                    >
                        <div
                            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                            style={{ backgroundColor: rgba(premiumColors.primary.DEFAULT, 0.1), color: premiumColors.primary.DEFAULT }}
                        >
                            <item.icon />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">{item.title}</h3>
                            <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

const AddCityModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    const [name, setName] = useState('');
    const [state, setState] = useState('');
    const [hubs, setHubs] = useState(0);

    React.useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setState(initialData.state);
            setHubs(initialData.hubs);
        } else {
            setName('');
            setState('');
            setHubs(0);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ name, state, hubs: parseInt(hubs) || 0, id: initialData?.id });
        setName('');
        setState('');
        setHubs(0);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">{initialData ? 'Edit City' : 'Add New City'}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                            <MdClose size={24} />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">City Name</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="e.g. Mumbai"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">State / UT</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="e.g. Maharashtra"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Number of Hubs</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={hubs}
                                onChange={(e) => setHubs(e.target.value)}
                                required
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl">Cancel</button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 text-white font-bold rounded-xl shadow-lg hover:bg-opacity-90 transition-all"
                                style={{ backgroundColor: premiumColors.primary.DEFAULT }}
                            >
                                {initialData ? 'Save Changes' : 'Add City'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// --- Pages ---

export const LocationsPage = () => {
    const navigate = useNavigate();
    const [cities, setCities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCity, setEditingCity] = useState(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        setLoading(true);
        try {
            const response = await api.get('/crm/settings/cities');
            if (response.data.success) {
                const formattedCities = response.data.data.cities.map(city => ({
                    id: city._id,
                    name: city.cityName,
                    state: city.state,
                    status: city.isActive,
                    hubs: city.numberOfHubs
                }));
                setCities(formattedCities);
            }
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCity = async (id) => {
        const cityToToggle = cities.find(c => c.id === id);
        if (!cityToToggle) return;

        try {
            const response = await api.put(`/crm/settings/cities/${id}`, { isActive: !cityToToggle.status });
            if (response.data.success) {
                setCities(cities.map(c => c.id === id ? { ...c, status: !c.status } : c));
            }
        } catch (error) {
            console.error("Error toggling city status:", error);
        }
    };

    const handleSaveCity = async (cityData) => {
        try {
            const payload = {
                cityName: cityData.name,
                state: cityData.state,
                numberOfHubs: cityData.hubs,
                isActive: true
            };

            if (cityData.id) {
                // Update
                const response = await api.put(`/crm/settings/cities/${cityData.id}`, payload);
                if (response.data.success) {
                    fetchCities();
                }
            } else {
                // Create
                const response = await api.post('/crm/settings/cities', payload);
                if (response.data.success) {
                    fetchCities();
                }
            }
            setIsModalOpen(false);
            setEditingCity(null);
        } catch (error) {
            console.error("Error saving city:", error);
        }
    };

    const openEditModal = (city) => {
        setEditingCity(city);
        setIsModalOpen(true);
    };

    const handleDeleteCity = async (id) => {
        if (window.confirm('Are you sure you want to delete this city?')) {
            try {
                const response = await api.delete(`/crm/settings/cities/${id}`);
                if (response.data.success) {
                    setCities(cities.filter(c => c.id !== id));
                }
            } catch (error) {
                console.error("Error deleting city:", error);
            }
        }
    };

    const filteredCities = cities.filter(city => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        return (
            city.name.toLowerCase().includes(cleanSearch) ||
            city.state.toLowerCase().includes(cleanSearch)
        );
    });

    return (
        <div className="space-y-6">
            <AddCityModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingCity(null); }}
                onSave={handleSaveCity}
                initialData={editingCity}
            />

            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
                        <span>/</span>
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/settings')}>Settings</span>
                        <span>/</span>
                        <span className="text-gray-800 font-medium">Locations</span>
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: premiumColors.primary.DEFAULT }}>Cities & Locations</h1>
                    <p className="text-gray-500 text-sm">Manage operational cities and pickup hubs.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-end w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search cities..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                        />
                    </div>
                    <button
                        onClick={() => { setEditingCity(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                        style={{ backgroundColor: premiumColors.primary.DEFAULT, boxShadow: `0 4px 14px ${rgba(premiumColors.primary.DEFAULT, 0.4)}` }}
                    >
                        <MdAdd size={20} /> Add City
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 w-full col-span-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCities.map((city) => (
                        <motion.div
                            key={city.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden group transition-all`}
                            style={{ borderColor: city.status ? rgba(premiumColors.primary.DEFAULT, 0.2) : '#f0f0f0', backgroundColor: 'white' }}
                        >
                            <div
                                className={`absolute top-0 right-0 p-10 rounded-bl-full opacity-50`}
                                style={{ background: city.status ? `linear-gradient(135deg, ${rgba(premiumColors.primary.DEFAULT, 0.05)}, transparent)` : 'transparent' }}
                            ></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner`}
                                        style={{
                                            backgroundColor: city.status ? rgba(premiumColors.primary.DEFAULT, 0.1) : '#f3f4f6',
                                            color: city.status ? premiumColors.primary.DEFAULT : '#9ca3af'
                                        }}
                                    >
                                        <MdLocationCity size={24} />
                                    </div>
                                    <Toggle enabled={city.status} onToggle={() => toggleCity(city.id)} />
                                </div>
                                <h3 className={`text-xl font-bold ${city.status ? 'text-gray-900' : 'text-gray-500'}`}>{city.name}</h3>
                                <p className="text-sm text-gray-500">{city.state}</p>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span
                                        className={`text-xs font-bold px-2 py-1 rounded-md`}
                                        style={{
                                            backgroundColor: city.status ? rgba(premiumColors.primary.DEFAULT, 0.1) : '#f3f4f6',
                                            color: city.status ? premiumColors.primary.DEFAULT : '#6b7280'
                                        }}
                                    >
                                        {city.hubs} Hubs
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEditModal(city)}
                                            className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                        >
                                            <MdEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCity(city.id)}
                                            className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <MdDelete />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && filteredCities.length === 0 && (
                <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-100 col-span-full">
                    No cities found matching "{searchTerm}"
                </div>
            )}
        </div>
    );
};











