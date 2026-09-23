import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiPhone, FiMessageCircle, FiUser, FiCheckCircle, FiXCircle, FiClock, FiFilter, FiArrowLeft } from 'react-icons/fi';
import HeaderTopBar from '../components/HeaderTopBar';
import BottomNav from '../components/BottomNav';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StaffDirectoryPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [staffList, setStaffList] = useState([]);
    const [counts, setCounts] = useState({ present: 0, absent: 0, leave: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/crm/team-presence');
            if (response.data.success) {
                const { activeStaff, present, absent, leave, total } = response.data.data;
                setStaffList(activeStaff || []);
                setCounts({ present, absent, leave, total });
            }
        } catch (error) {
            console.error('Error fetching team presence:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredList = staffList.filter(staff => {
        const searchLower = searchTerm.trim().toLowerCase();
        const matchesSearch = (staff.name || '').toLowerCase().includes(searchLower) ||
            (staff.role || '').toLowerCase().includes(searchLower);
        const matchesFilter = activeFilter === 'All' || staff.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Absent': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Leave': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] pb-32 font-sans selection:bg-blue-100 flex flex-col">

            {/* HEADER SECTION */}
            <div className="bg-[#1C205C] pt-6 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden z-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => navigate(-1)} className="text-white p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                        <FiArrowLeft size={20} />
                    </button>
                    <HeaderTopBar title="Staff Directory" />
                </div>

                <div className="mt-6 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="w-full bg-white/10 backdrop-blur-md text-white placeholder-blue-200/70 border border-white/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all font-medium"
                        placeholder="Search colleague..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* SUMMARY STATS (Matches Home Page) */}
            <div className="px-6 -mt-10 z-20">
                <div className="bg-white rounded-3xl p-4 shadow-xl border border-white flex justify-between gap-3">
                    <div className="flex-1 bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-100/50">
                        <span className="block text-xl font-black text-emerald-600">{counts.present}</span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">Present</span>
                    </div>
                    <div className="flex-1 bg-rose-50 rounded-2xl p-3 text-center border border-rose-100/50">
                        <span className="block text-xl font-black text-rose-500">{counts.absent}</span>
                        <span className="text-[10px] font-bold text-rose-400 uppercase">Absent</span>
                    </div>
                    <div className="flex-1 bg-amber-50 rounded-2xl p-3 text-center border border-amber-100/50">
                        <span className="block text-xl font-black text-amber-500">{counts.leave}</span>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">On Leave</span>
                    </div>
                </div>
            </div>

            {/* FILTER TABS */}
            <div className="px-6 mt-6 z-10 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {['All', 'Present', 'Absent', 'Leave'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm whitespace-nowrap transition-all border ${activeFilter === filter ? 'bg-[#1C205C] text-white border-[#1C205C]' : 'bg-white text-gray-500 border-white hover:bg-gray-50'}`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* STAFF LIST */}
            <div className="px-5 mt-4 space-y-3 flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-2 px-1">
                    <h3 className="text-gray-800 font-bold text-sm">Team Members <span className="text-gray-400 text-xs font-medium">({filteredList.length})</span></h3>
                </div>

                {filteredList.length > 0 ? (
                    filteredList.map((staff) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={staff.id}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm overflow-hidden ${!staff.avatar ? (staff.color || 'bg-blue-100 text-blue-600') : ''}`}>
                                    {staff.avatar && staff.avatar.startsWith('http') ? (
                                        <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                                    ) : (
                                        staff.shortName || (staff.name ? staff.name.charAt(0) : '?')
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#1C205C] text-sm">{staff.name}</h4>
                                    <p className="text-xs text-gray-400 font-medium">{staff.role}</p>
                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border mt-1 ${getStatusColor(staff.status)}`}>
                                        {staff.status === 'Present' && '● Online'}
                                        {staff.status === 'Absent' && '● Offline'}
                                        {staff.status === 'Leave' && '● On Leave'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">

                                <button className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors">
                                    <FiPhone size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-3">
                            <FiUser size={32} />
                        </div>
                        <p className="font-bold text-gray-500">No members found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
};

export default StaffDirectoryPage;
