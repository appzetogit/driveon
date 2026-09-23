import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MdAttachMoney,
    MdAdd,
    MdDelete,
    MdSearch,
    MdFilterList,
    MdDateRange,
    MdReceipt,
    MdClose,
    MdFolderSpecial,
    MdTrendingUp,
    MdPrint,
    MdEvent
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../../services/api';

// --- Shared Simple Modal ---
const SimpleModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative m-4 max-h-[90vh] overflow-y-auto">
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

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
};

const TrackExpensesPage = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [uniqueMonths, setUniqueMonths] = useState([]);
    const [uniqueYears, setUniqueYears] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [selectedYear, setSelectedYear] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Add Expense Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [customDate, setCustomDate] = useState(''); // Default will be empty (means now)
    const [isSubmitting, setIsSubmitting] = useState(false);



    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, [selectedCategory, selectedMonth, selectedYear]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const params = {};
            if (selectedCategory !== 'All') params.category = selectedCategory;
            if (selectedMonth !== 'All') params.month = selectedMonth;
            if (selectedYear !== 'All') params.year = selectedYear;
            if (searchTerm.trim() !== '') params.search = searchTerm.trim();

            const res = await api.get('/crm/expenses', { params });
            if (res.data.success) {
                setExpenses(res.data.data.expenses || []);
                if (res.data.data.uniqueMonths) {
                    setUniqueMonths(res.data.data.uniqueMonths);
                }
                if (res.data.data.uniqueYears) {
                    setUniqueYears(res.data.data.uniqueYears);
                }
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/crm/finance/categories');
            if (res.data.success) {
                setCategories(res.data.data.categories || []);
                // If category is not selected in modal, set first one as default
                if (res.data.data.categories?.length > 0 && !category) {
                    setCategory(res.data.data.categories[0].name);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Auto trigger search with debounce or manual
    const handleSearch = (e) => {
        e.preventDefault();
        fetchExpenses();
    };

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (!category) {
            toast.error('Please select an expense category');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                category,
                amount: Number(amount),
                description: description.trim(),
            };
            if (customDate) {
                payload.date = new Date(customDate).toISOString();
            }

            const res = await api.post('/crm/expenses', payload);
            if (res.data.success) {
                toast.success('Expense added successfully');
                setIsAddModalOpen(false);
                setAmount('');
                setDescription('');
                setCustomDate('');
                fetchExpenses();
            }
        } catch (error) {
            console.error('Error creating expense:', error);
            toast.error('Failed to save expense');
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense record?')) {
            return;
        }

        try {
            const res = await api.delete(`/crm/expenses/${id}`);
            if (res.data.success) {
                toast.success('Expense record deleted');
                fetchExpenses();
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Failed to delete expense record');
        }
    };

    // Calculate Analytics
    const totalSpentAllTime = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Total spent current month
    const monthsList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthStr = `${monthsList[new Date().getMonth()]} ${new Date().getFullYear()}`;
    const totalSpentCurrentMonth = expenses
        .filter(exp => exp.month === currentMonthStr)
        .reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate distribution by category
    const categoryTotals = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    // Find highest spending category
    let topCategory = 'None';
    let topCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
        if (amt > topCategoryAmount) {
            topCategoryAmount = amt;
            topCategory = cat;
        }
    });

    const categoryStats = Object.entries(categoryTotals)
        .map(([name, total]) => ({
            name,
            total,
            percentage: totalSpentAllTime > 0 ? Math.round((total / totalSpentAllTime) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total);

    // PDF Export function
    const exportPDF = () => {
        const doc = new jsPDF();
        
        // Add company logo / branding
        doc.setFontSize(22);
        doc.setTextColor(28, 32, 92); // #1c205c
        doc.text("DriveOn CRM - Administrative Expense Report", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);
        doc.text(`Filters applied - Category: ${selectedCategory}, Month: ${selectedMonth}, Year: ${selectedYear}`, 14, 32);

        // Stats Summary
        doc.setFillColor(245, 246, 250);
        doc.rect(14, 38, 182, 20, "F");
        doc.setFontSize(11);
        doc.setTextColor(28, 32, 92);
        doc.setFont("helvetica", "bold");
        doc.text(`Total Expenditures: Rs. ${totalSpentAllTime.toLocaleString('en-IN')}`, 20, 50);
        doc.text(`Total Records: ${expenses.length}`, 130, 50);

        // Table headers and data
        const tableColumn = ["Date & Time", "Expense Category", "Description", "Amount (INR)"];
        const tableRows = [];

        expenses.forEach(exp => {
            const expData = [
                `${formatDate(exp.date)} ${formatTime(exp.date)}`,
                exp.category,
                exp.description || 'N/A',
                `Rs. ${exp.amount.toLocaleString('en-IN')}`
            ];
            tableRows.push(expData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 65,
            theme: 'striped',
            headStyles: { fillColor: [28, 32, 92], halign: 'left' },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 40 },
                2: { cellWidth: 70 },
                3: { cellWidth: 32, halign: 'right' }
            },
            styles: { fontSize: 9 }
        });

        doc.save(`DriveOn-Expenses-${new Date().toISOString().slice(0, 10)}.pdf`);
        toast.success("Expense report exported successfully!");
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/dashboard')}>Home</span>
                        <span>/</span>
                        <span className="text-gray-800 font-medium font-sans">Expense Tracker</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 font-sans">Expense Management</h1>
                    <p className="text-gray-500 text-sm">Track, filter, and audit administrative and operational expenditures end-to-end.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={exportPDF}
                        disabled={expenses.length === 0}
                        className="px-4 py-2.5 bg-white border border-gray-250 rounded-xl text-[#1c205c] hover:bg-gray-55 shadow-sm text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <MdPrint size={18} /> Export PDF Report
                    </button>

                    <button
                        onClick={() => navigate('/crm/expenses/categories')}
                        className="px-4 py-2.5 bg-[#1c205c]/10 text-[#1c205c] rounded-xl hover:bg-[#1c205c]/15 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <MdFolderSpecial size={18} /> Manage Categories
                    </button>

                    <button
                        onClick={() => {
                            if (categories.length === 0) fetchCategories();
                            setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-[#1c205c] text-white rounded-xl shadow-lg shadow-gray-200 hover:bg-[#252d6d] text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <MdAdd size={20} /> Add Expense
                    </button>
                </div>
            </div>

            {/* KPI Metrics Dashboard Card Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <MdAttachMoney size={28} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Spent (This Month)</span>
                        <span className="text-lg font-black text-gray-900 mt-0.5">₹{totalSpentCurrentMonth.toLocaleString('en-IN')}</span>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <MdTrendingUp size={28} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Spent (Filtered)</span>
                        <span className="text-lg font-black text-gray-900 mt-0.5">₹{totalSpentAllTime.toLocaleString('en-IN')}</span>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                        <MdFolderSpecial size={28} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Top Expense Category</span>
                        <span className="text-sm font-bold text-gray-800 mt-0.5 truncate block max-w-[150px]">{topCategory}</span>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                        <MdReceipt size={28} />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Transactions Count</span>
                        <span className="text-lg font-black text-gray-900 mt-0.5">{expenses.length} Records</span>
                    </div>
                </motion.div>
            </div>

            {/* Split Screen layout: Left (Stats Breakdown), Right (Table + Filters) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left: Category Allocations */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                    <div>
                        <h3 className="font-extrabold text-gray-900 text-sm">Category Expenditure Share</h3>
                        <p className="text-gray-400 text-xxs mt-0.5">Breakdown of administrative costs across segments.</p>
                    </div>

                    {categoryStats.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-xs">No records available to analyze.</div>
                    ) : (
                        <div className="space-y-4">
                            {categoryStats.map(stat => (
                                <div key={stat.name} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-gray-700">{stat.name}</span>
                                        <span className="text-gray-900 font-bold">₹{stat.total.toLocaleString('en-IN')} ({stat.percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-[#1c205c] to-indigo-500 h-full rounded-full"
                                            style={{ width: `${stat.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Interactive Filters & Lists */}
                <div className="lg:col-span-2 space-y-4">
                    
                    {/* Filters panel */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
                        
                        {/* Search Query */}
                        <form onSubmit={handleSearch} className="relative w-full xl:w-56">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search descriptions..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                            />
                        </form>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap gap-2.5 items-center w-full xl:w-auto justify-end">
                            {/* Category Filter */}
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-150">
                                <MdFilterList className="text-gray-400" size={16} />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-transparent border-0 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="All">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Month Filter */}
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-150">
                                <MdDateRange className="text-gray-400" size={16} />
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="bg-transparent border-0 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="All">All Months</option>
                                    {monthsList.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year Filter */}
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-150">
                                <MdEvent className="text-gray-400" size={16} />
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="bg-transparent border-0 text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                                >
                                    <option value="All">All Years</option>
                                    {(() => {
                                        const years = [];
                                        for (let y = 2025; y <= 2090; y++) {
                                            years.push(y);
                                        }
                                        return years.map(yr => (
                                            <option key={yr} value={yr}>{yr}</option>
                                        ));
                                    })()}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Expense list Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="text-center py-16 text-gray-500 font-semibold">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1c205c] mx-auto mb-3"></div>
                                Loading expense records...
                            </div>
                        ) : expenses.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 border-2 border-dashed border-gray-100 rounded-2xl m-4">
                                <MdReceipt size={48} className="mx-auto mb-3 text-gray-300" />
                                <p className="font-bold text-gray-800 text-sm">No expenses recorded</p>
                                <p className="text-gray-400 text-xs mt-1">Try resetting the filters or add a new expense record.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xxs font-bold text-gray-400 uppercase tracking-wider">
                                            <th className="px-5 py-3">Date & Time</th>
                                            <th className="px-5 py-3">Category</th>
                                            <th className="px-5 py-3">Description</th>
                                            <th className="px-5 py-3 text-right">Amount</th>
                                            <th className="px-5 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {expenses.map(exp => (
                                            <tr key={exp._id} className="hover:bg-gray-50/50 transition-colors text-xs font-medium text-gray-600">
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">
                                                            {formatDate(exp.date)}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {formatTime(exp.date)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800">
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-[#1c205c] rounded-md uppercase text-[10px] font-extrabold border border-indigo-100">
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 max-w-xs truncate" title={exp.description}>
                                                    {exp.description || <span className="text-gray-300 italic">No notes</span>}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-black text-gray-900 whitespace-nowrap">
                                                    ₹{exp.amount.toLocaleString('en-IN')}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <button
                                                        onClick={() => handleDeleteExpense(exp._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors scale-90"
                                                        title="Delete Record"
                                                    >
                                                        <MdDelete size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Expense Modal */}
            <SimpleModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                }}
                title="Add Operational Expense"
            >
                <form onSubmit={handleCreateExpense} className="space-y-5">
                    {/* Amount Field */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expense Amount (INR)</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                            <input
                                type="text"
                                required
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] font-black text-[#1c205c] transition-all text-sm"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Allow only numbers and optional single decimal point
                                    if (/^\d*\.?\d*$/.test(val)) {
                                        setAmount(val);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Category Selection Field */}
                    <div>
                        <div className="mb-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Expense Category</label>
                        </div>

                        <select
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] text-xs font-bold text-gray-750 cursor-pointer"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date picker (defaults to auto now if blank) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Date & Time (Optional)
                        </label>
                        <div className="relative">
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] transition-all text-xs font-medium text-gray-700 cursor-pointer"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                            />
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                            Leave empty to automatically record the current date, time, and month.
                        </span>
                    </div>

                    {/* Description Notes Field */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description / Notes</label>
                        <textarea
                            rows="3"
                            placeholder="Details about the transaction (e.g. supplier info, month, unit details...)"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c205c]/10 focus:border-[#1c205c] transition-all text-sm resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[#1c205c] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#252d6d] active:scale-98 transition-all disabled:opacity-50"
                    >
                        <MdAdd size={20} />
                        {isSubmitting ? 'Recording Expense...' : 'Save Expense Record'}
                    </button>
                </form>
            </SimpleModal>
        </div>
    );
};

export default TrackExpensesPage;
