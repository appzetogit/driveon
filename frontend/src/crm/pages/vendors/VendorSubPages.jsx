import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    MdStore,
    MdPhone,
    MdEmail,
    MdDirectionsCar,
    MdVerified,
    MdBarChart,
    MdMoreVert,
    MdSearch,
    MdClose,
    MdEdit,
    MdDelete,
    MdReceipt,
    MdPayments,
    MdPerson
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

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
        'Pending': 'bg-orange-50 text-orange-700 border-orange-200',
        'Verified': 'bg-blue-50 text-blue-700 border-blue-200',
        'Payout': 'bg-red-50 text-red-600 border-red-200',
        'Commission': 'bg-green-50 text-green-600 border-green-200',
        'Processing': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Completed': 'bg-green-50 text-green-700 border-green-200',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
            {status}
        </span>
    );
};

// Parse payment method from remarks: "[Cash] note..." or "[Online] note..."
const parsePaymentMethod = (remarks) => {
    if (!remarks) return { method: 'Cash', note: '' };
    const match = remarks.match(/^\[(\w+)\]\s*(.*)/s);
    if (match) return { method: match[1], note: match[2].trim() };
    return { method: 'Cash', note: remarks };
};

const PaymentMethodBadge = ({ method }) => {
    if (method === 'Online') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                💳 Online
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            💵 Cash
        </span>
    );
};

// ─── VENDOR LEDGER MODAL ──────────────────────────────────────────────────────
const VendorLedgerModal = ({ vendor, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('profitability');
    const [ledgerData, setLedgerData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [settlementForms, setSettlementForms] = useState({});
    const [savingSettlementKey, setSavingSettlementKey] = useState('');
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'Cash',
        referenceId: '',
        payerName: '',
        remarks: '',
        relatedCarId: '',
        relatedCarType: '',
        relatedCarLabel: ''
    });
    const [tripDetails, setTripDetails] = useState(null); // { carId, trips, loading }
    const [submitting, setSubmitting] = useState(false);

    const fetchLedger = useCallback(async () => {
        if (!vendor?._id) return;
        setLoading(true);
        try {
            const res = await api.get(`/crm/vendors/${vendor._id}/ledger`);
            if (res.data.success) {
                setLedgerData(res.data.data);
                const nextForms = {};
                (res.data.data?.cars || []).forEach((car) => {
                    nextForms[`${car.type}-${car.id}`] = {
                        agreedAmount: car.totalVendorCost || '',
                        notes: car.settlementNotes || ''
                    };
                });
                setSettlementForms(nextForms);
            }
        } catch (err) {
            console.error('Ledger fetch error', err);
            toast.error('Failed to load ledger data');
        } finally {
            setLoading(false);
        }
    }, [vendor?._id]);

    useEffect(() => {
        if (isOpen) {
            fetchLedger();
            setActiveTab('profitability');
        }
    }, [isOpen, fetchLedger]);

    const handleRecordPayment = async () => {
        const amt = parseFloat(paymentForm.amount);
        if (!paymentForm.amount || isNaN(amt) || amt <= 0) {
            toast.error('Please enter a valid amount greater than ₹0');
            return;
        }
        if (!paymentForm.relatedCarId) {
            toast.error('Please select a car for this payment');
            return;
        }
        if (paymentForm.paymentMethod === 'Cash' && !paymentForm.payerName?.trim()) {
            toast.error('Please enter the payer name for cash payment');
            return;
        }
        if (paymentForm.paymentMethod === 'Online' && !paymentForm.referenceId?.trim()) {
            toast.error('Please enter the Transaction / Reference ID for online payment');
            return;
        }
        setSubmitting(true);
        try {
            // Build remarks to include payer name for cash
            const submissionData = { ...paymentForm };
            if (paymentForm.paymentMethod === 'Cash' && paymentForm.payerName?.trim()) {
                submissionData.remarks = `Paid by: ${paymentForm.payerName.trim()}${paymentForm.remarks ? '. ' + paymentForm.remarks : ''}`;
            }
            const res = await api.post(`/crm/vendors/${vendor._id}/payments`, submissionData);
            if (res.data.success) {
                toast.success('✅ Payment recorded successfully!');
                setPaymentForm({
                    amount: '',
                    paymentMethod: 'Cash',
                    referenceId: '',
                    payerName: '',
                    remarks: '',
                    relatedCarId: '',
                    relatedCarType: '',
                    relatedCarLabel: ''
                });
                await fetchLedger();
                setActiveTab('ledger');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to record payment';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettlementChange = (car, field, value) => {
        const key = `${car.type}-${car.id}`;
        setSettlementForms((prev) => ({
            ...prev,
            [key]: {
                agreedAmount: prev[key]?.agreedAmount ?? car.totalVendorCost ?? '',
                notes: prev[key]?.notes ?? car.settlementNotes ?? '',
                [field]: value
            }
        }));
    };

    const handleSaveSettlement = async (car) => {
        const key = `${car.type}-${car.id}`;
        const form = settlementForms[key] || {};
        const agreedAmount = Number(form.agreedAmount);

        if (!Number.isFinite(agreedAmount) || agreedAmount < 0) {
            toast.error('Please enter a valid hidden amount');
            return;
        }

        setSavingSettlementKey(key);
        try {
            const res = await api.patch(
                `/crm/vendors/${vendor._id}/cars/${car.type.toLowerCase()}/${car.id}/settlement`,
                {
                    agreedAmount,
                    notes: form.notes || ''
                }
            );

            if (res.data.success) {
                toast.success('Hidden amount updated');
                await fetchLedger();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update hidden amount');
        } finally {
            setSavingSettlementKey('');
        }
    };

    if (!isOpen) return null;

    const fmt = (n) => '₹' + (n || 0).toLocaleString('en-IN');
    const { summary, cars = [], transactions = [] } = ledgerData || {};

    const tabs = [
        { id: 'profitability', label: 'Car Profitability', icon: '📊' },
        { id: 'ledger', label: 'Transactions', icon: '📋' },
        { id: 'payment', label: 'New Payment', icon: '💸' }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#1a2240] via-[#212c40] to-[#2d3a55] p-6 text-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden">
                                <img
                                    src={vendor?.profileImage || 'https://via.placeholder.com/150'}
                                    alt={vendor?.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold">{vendor?.name}</h2>
                                <p className="text-white/60 text-sm font-medium">📊 Vendor Ledger & Profitability</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <MdClose size={22} />
                        </button>
                    </div>

                    {/* Summary Stats */}
                    {summary && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                            {[
                                { label: 'Total Trips', value: summary.totalTrips, color: 'from-blue-400/20 to-blue-500/10' },
                                { label: 'Revenue', value: fmt(summary.totalRevenue), color: 'from-emerald-400/20 to-emerald-500/10' },
                                { label: 'Total Paid', value: fmt(summary.totalPaid), color: 'from-violet-400/20 to-violet-500/10' },
                                { label: 'Net Profit', value: fmt(summary.netProfit), color: summary.netProfit >= 0 ? 'from-amber-400/20 to-orange-500/10' : 'from-red-400/20 to-red-500/10' }
                            ].map((s, i) => (
                                <div key={i} className={`bg-gradient-to-br ${s.color} backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center`}>
                                    <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider mb-1">{s.label}</p>
                                    <p className="text-white font-extrabold text-base">{s.value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="flex bg-gray-50 border-b border-gray-100 px-6 flex-shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id
                                ? 'border-[#212c40] text-[#212c40]'
                                : 'border-transparent text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span className="hidden sm:block">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="w-10 h-10 rounded-full border-4 border-[#212c40]/20 border-t-[#212c40] animate-spin" />
                            <p className="text-gray-400 text-sm font-medium">Loading ledger data...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {/* ── TAB 1: Car Profitability ── */}
                            {activeTab === 'profitability' && (
                                <motion.div
                                    key="profitability"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="p-6 space-y-4"
                                >
                                    {cars.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <MdDirectionsCar size={40} className="mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">No cars associated with this vendor</p>
                                        </div>
                                    ) : (
                                        cars.map((car, i) => {
                                            const isProfit = car.netProfit >= 0;
                                            return (
                                                <motion.div
                                                    key={car.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"
                                                >
                                                    <div className="flex items-center gap-4 p-4">
                                                        {car.image ? (
                                                            <img src={car.image} alt={`${car.brand} ${car.model}`} className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0" />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#212c40]/10 to-[#212c40]/5 flex items-center justify-center text-2xl shrink-0 border border-gray-200">🚗</div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="font-extrabold text-gray-900">{car.brand} {car.model}</h4>
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase ${car.type === 'Inward'
                                                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                                    : 'bg-purple-50 text-purple-600 border-purple-100'
                                                                    }`}>{car.type}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 font-mono mt-0.5">{car.registrationNumber}</p>
                                                        </div>
                                                        {car.vendorAgreementType === 'monthly' ? (
                                                            <div className="text-right px-3 py-1.5 rounded-xl bg-emerald-50">
                                                                <p className="text-xs font-semibold text-emerald-600">Admin Profit</p>
                                                                <p className="font-extrabold text-base text-emerald-700">
                                                                    +{fmt(car.totalRevenue)}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className={`text-right px-3 py-1.5 rounded-xl ${isProfit ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                                                <p className={`text-xs font-semibold ${isProfit ? 'text-emerald-600' : 'text-red-600'}`}>Net Profit</p>
                                                                <p className={`font-extrabold text-base ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}>
                                                                    {isProfit ? '+' : ''}{fmt(car.netProfit)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Stats Row */}
                                                    <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
                                                        <div className="p-3 text-center">
                                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Trips</p>
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <p className="text-lg font-extrabold text-[#212c40]">{car.tripsCount}</p>
                                                                {car.tripsCount > 0 && (
                                                                    <button
                                                                        title="View trip details"
                                                                        onClick={async () => {
                                                                            if (tripDetails?.carId === car.id) {
                                                                                setTripDetails(null);
                                                                                return;
                                                                            }
                                                                            setTripDetails({ carId: car.id, trips: [], loading: true });
                                                                            try {
                                                                                const res = await api.get(`/crm/vendors/${vendor._id}/cars/outward/${car.id}/trips`);
                                                                                if (res.data.success) {
                                                                                    setTripDetails({ carId: car.id, trips: res.data.data.trips, loading: false });
                                                                                }
                                                                            } catch {
                                                                                setTripDetails({ carId: car.id, trips: [], loading: false, error: true });
                                                                            }
                                                                        }}
                                                                        className="w-5 h-5 rounded-full bg-[#212c40]/10 hover:bg-[#212c40]/20 flex items-center justify-center transition-all"
                                                                    >
                                                                        <span className="text-[11px]">👁</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="p-3 text-center">
                                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Admin Revenue</p>
                                                            <p className="text-base font-extrabold text-emerald-600">{fmt(car.totalRevenue)}</p>
                                                        </div>
                                                        <div className="p-3 text-center">
                                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Vendor Total Profit</p>
                                                            <p className="text-base font-extrabold text-gray-600">{fmt(car.totalVendorCost)}</p>
                                                        </div>
                                                        <div className="p-3 text-center">
                                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Paid / Pending</p>
                                                            <p className="text-sm font-extrabold text-blue-700">{fmt(car.totalPaidForCar)}</p>
                                                            <p className="text-xs text-red-500">{fmt(car.remainingVendorDue)} left</p>
                                                        </div>
                                                    </div>
                                                    {car.type === 'Outward' && (
                                                        <div className="border-t border-gray-100 bg-white/70 p-4 flex items-center gap-2 text-xs font-semibold text-gray-600">
                                                            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Onboarded Agreement:</span>
                                                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs">
                                                                {car.vendorAgreementType === 'monthly'
                                                                    ? `${fmt(car.agreementPricePerMonth)} / Month (Fixed)`
                                                                    : `${fmt(car.agreementPricePerDay)} / Day (Per Day Wise)`
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Trip Details Expandable Panel */}
                                                    {tripDetails?.carId === car.id && (
                                                        <AnimatePresence>
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="border-t border-blue-100 bg-blue-50/50"
                                                            >
                                                                <div className="p-4">
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <p className="text-xs font-bold text-[#212c40] uppercase tracking-wide flex items-center gap-1.5">
                                                                            👁 Trip Breakdown
                                                                        </p>
                                                                        <button
                                                                            onClick={() => setTripDetails(null)}
                                                                            className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                                                                        >✕ Close</button>
                                                                    </div>
                                                                    {tripDetails.loading ? (
                                                                        <div className="flex items-center justify-center py-4 gap-2 text-sm text-gray-400">
                                                                            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                                                                            Loading trips...
                                                                        </div>
                                                                    ) : tripDetails.trips.length === 0 ? (
                                                                        <p className="text-center text-gray-400 text-xs py-3">No trip data found</p>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {tripDetails.trips.map((trip, idx) => (
                                                                                <div key={idx} className="bg-white rounded-xl border border-blue-100 p-3 flex flex-col gap-1.5">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                            <span className="font-bold text-[11px] text-[#212c40] font-mono">{trip.bookingId}</span>
                                                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${trip.source === 'Customer Booking'
                                                                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                                                    : 'bg-purple-50 text-purple-600 border-purple-100'
                                                                                                }`}>{trip.source}</span>
                                                                                        </div>
                                                                                        <span className="font-extrabold text-sm text-[#212c40]">
                                                                                            ₹{(trip.adminRevenue || 0).toLocaleString('en-IN')}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
                                                                                        <span>📅 {trip.fromDate ? new Date(trip.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                                                                                        <span>→</span>
                                                                                        <span>{trip.toDate ? new Date(trip.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                                                                                        <span className="font-bold text-[#212c40]">{trip.days} Day{trip.days !== 1 ? 's' : ''}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </AnimatePresence>
                                                    )}
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </motion.div>
                            )}

                            {/* ── TAB 2: Payment Ledger ── */}
                            {activeTab === 'ledger' && (
                                <motion.div
                                    key="ledger"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="p-6 space-y-4"
                                >
                                    {/* Outstanding Balance Card */}
                                    {summary && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className={`rounded-2xl p-4 flex items-center gap-4 ${summary.outstandingBalance > 0
                                                ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-100'
                                                : 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100'
                                                }`}>
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${summary.outstandingBalance > 0 ? 'bg-red-100' : 'bg-emerald-100'
                                                    }`}>
                                                    {summary.outstandingBalance > 0 ? '⚠️' : '✅'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-xs font-semibold uppercase tracking-wide ${summary.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                        {summary.outstandingBalance > 0 ? 'Remaining Vendor Payment' : 'Vendor Fully Settled'}
                                                    </p>
                                                    <p className={`text-2xl font-extrabold ${summary.outstandingBalance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                                        {fmt(summary.outstandingBalance)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400">Total Profit</p>
                                                    <p className="font-bold text-gray-700">{fmt(summary.totalVendorCost)}</p>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Cash Paid</p>
                                                        <p className="text-lg font-extrabold text-emerald-700">
                                                            {fmt(summary.paymentMethodBreakdown?.Cash?.amount)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {summary.paymentMethodBreakdown?.Cash?.count || 0} payments
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Online Paid</p>
                                                        <p className="text-lg font-extrabold text-blue-700">
                                                            {fmt(summary.paymentMethodBreakdown?.Online?.amount)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {summary.paymentMethodBreakdown?.Online?.count || 0} payments
                                                        </p>
                                                    </div>
                                                </div>
                                                {summary.excessPaid > 0 && (
                                                    <p className="mt-3 text-xs font-semibold text-violet-700">
                                                        Extra paid: {fmt(summary.excessPaid)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Transactions List */}
                                    {transactions.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <MdReceipt size={40} className="mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">No transactions recorded yet</p>
                                            <button
                                                onClick={() => setActiveTab('payment')}
                                                className="mt-3 text-sm text-[#212c40] font-bold underline underline-offset-2"
                                            >
                                                Record first payment →
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {transactions.map((txn, i) => {
                                                const { method, note } = parsePaymentMethod(txn.remarks);
                                                return (
                                                    <motion.div
                                                        key={txn._id}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all"
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${txn.type === 'Payout' ? 'bg-red-50' : 'bg-emerald-50'
                                                            }`}>
                                                            {txn.type === 'Payout' ? '💸' : '💰'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-gray-800 text-sm">{txn.type}</span>
                                                                <PaymentMethodBadge method={method} />
                                                                {txn.relatedCarLabel && (
                                                                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-bold text-gray-700">
                                                                        {txn.relatedCarLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                                                                <span className="font-mono">{txn.referenceId}</span>
                                                                {note && <span>• {note}</span>}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className={`font-extrabold text-base ${txn.type === 'Payout' ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                {txn.type === 'Payout' ? '-' : '+'}{fmt(txn.amount)}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {new Date(txn.date || txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── TAB 3: Record New Payment ── */}
                            {activeTab === 'payment' && (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="p-6"
                                >

                                    <div className="space-y-4">
                                        {/* Amount */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                                Amount (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    placeholder="e.g. 25000"
                                                    value={paymentForm.amount}
                                                    onChange={(e) => {
                                                        // Only allow whole digits — no negatives, no arrows
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setPaymentForm({ ...paymentForm, amount: val });
                                                    }}
                                                    className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/30 focus:border-[#212c40] font-bold text-lg transition-all"
                                                />
                                            </div>
                                        </div>


                                        {/* Payment Method */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Payment Method</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Cash', 'Online'].map(method => (
                                                    <button
                                                        key={method}
                                                        onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: method })}
                                                        className={`py-3 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${paymentForm.paymentMethod === method
                                                            ? method === 'Cash'
                                                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                                : 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <span>{method === 'Cash' ? '💵' : '💳'}</span>
                                                        {method}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Select Car - Required */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                                Select Car <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={paymentForm.relatedCarId ? `${paymentForm.relatedCarType}::${paymentForm.relatedCarId}` : ''}
                                                onChange={(e) => {
                                                    const selected = e.target.value;
                                                    if (!selected) {
                                                        setPaymentForm({
                                                            ...paymentForm,
                                                            relatedCarId: '',
                                                            relatedCarType: '',
                                                            relatedCarLabel: ''
                                                        });
                                                        return;
                                                    }

                                                    const [selectedType, selectedId] = selected.split('::');
                                                    const selectedCar = cars.find(
                                                        (car) => String(car.id) === selectedId && car.type === selectedType
                                                    );

                                                    setPaymentForm({
                                                        ...paymentForm,
                                                        relatedCarId: selectedId,
                                                        relatedCarType: selectedType,
                                                        relatedCarLabel: selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ''
                                                    });
                                                }}
                                                className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#212c40]/30 focus:border-[#212c40] ${!paymentForm.relatedCarId ? 'border-orange-300' : 'border-gray-200'
                                                    }`}
                                            >
                                                <option value="">-- Select a Car --</option>
                                                {cars.map((car) => (
                                                    <option key={`${car.type}-${car.id}`} value={`${car.type}::${car.id}`}>
                                                        {car.brand} {car.model}
                                                    </option>
                                                ))}
                                            </select>
                                            {!paymentForm.relatedCarId && (
                                                <p className="mt-1 text-xs text-orange-500 font-medium">⚠ Selecting a car is required</p>
                                            )}
                                        </div>

                                        {/* Cash: Payer Name | Online: Transaction / Reference ID */}
                                        {paymentForm.paymentMethod === 'Cash' ? (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                                    Payer Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Ramesh Kumar"
                                                    value={paymentForm.payerName}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, payerName: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/30 focus:border-[#212c40] text-sm transition-all"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">Enter the name of the person paying in cash.</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                                    Transaction / Reference ID <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. UPI-REF-123456"
                                                    value={paymentForm.referenceId}
                                                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceId: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/30 focus:border-[#212c40] font-mono text-sm transition-all"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">Enter the UPI/bank transaction or reference ID.</p>
                                            </div>
                                        )}

                                        {/* Remarks / Notes */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Remarks / Notes</label>
                                            <textarea
                                                placeholder="e.g. Monthly lease payment for May 2025"
                                                value={paymentForm.remarks}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/30 focus:border-[#212c40] text-sm resize-none transition-all"
                                            />
                                        </div>

                                        <button
                                            onClick={handleRecordPayment}
                                            disabled={submitting}
                                            className="w-full py-3.5 bg-gradient-to-r from-[#212c40] to-[#2d3a55] text-white rounded-xl font-extrabold text-base hover:from-[#1a2233] hover:to-[#212c40] transition-all shadow-lg shadow-[#212c40]/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Recording...
                                                </>
                                            ) : (
                                                <>💸 Record Payment</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

// ─── VENDOR CARD ──────────────────────────────────────────────────────────────
const VendorCard = ({ vendor, onEdit, onDelete, onViewLedger }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCars, setShowCars] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all group relative overflow-visible"
        >
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                    <img src={vendor.profileImage || "https://via.placeholder.com/150"} alt={vendor.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#212c40] transition-colors truncate">{vendor.name}</h3>
                    <p className="text-xs text-gray-500">{vendor.type}</p>
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        className="p-1 text-gray-400 hover:text-[#212c40] hover:bg-[#212c40]/10 rounded-full transition-colors"
                    >
                        <MdMoreVert size={20} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(vendor); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#1c205c]/10 hover:text-[#1c205c] transition-colors flex items-center gap-2"
                            >
                                <MdEdit size={14} /> Edit
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(vendor._id || vendor.id); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                            >
                                <MdDelete size={14} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-2.5 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2">
                    <MdPhone className="text-[#212c40]/40" /> {vendor.phone}
                </div>
                <div className="flex items-center gap-2">
                    <MdEmail className="text-[#212c40]/40 break-all" /> {vendor.email}
                </div>
            </div>

            {/* 📊 View Ledger & Profit Button */}
            <button
                onClick={() => onViewLedger(vendor)}
                className="w-full py-2.5 px-4 mt-1 mb-2 rounded-xl bg-gradient-to-r from-[#212c40]/90 to-[#2d3a55] text-white font-bold text-xs hover:from-[#1a2233] hover:to-[#212c40] transition-all shadow-md shadow-[#212c40]/15 active:scale-[0.98] flex items-center justify-center gap-2"
            >
                <MdBarChart size={15} /> 📊 View Ledger & Profit
            </button>

            {/* Associated Cars Accordion Toggle */}
            {vendor.associatedCars && vendor.associatedCars.length > 0 && (
                <div className="mt-2 pt-3 border-t border-gray-100">
                    <button
                        onClick={() => setShowCars(!showCars)}
                        className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 text-[#212c40] hover:text-[#1a2333] rounded-xl text-xs font-bold flex items-center justify-between transition-all active:scale-[0.98]"
                    >
                        <span className="flex items-center gap-1.5">
                            <MdDirectionsCar size={16} className="text-[#212c40]" />
                            {showCars ? 'Hide Associated Cars' : `View Associated Cars (${vendor.associatedCars.length})`}
                        </span>
                        <motion.span
                            animate={{ rotate: showCars ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            ▼
                        </motion.span>
                    </button>

                    {showCars && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200"
                        >
                            {vendor.associatedCars.map((car) => (
                                <motion.div
                                    key={car.id}
                                    whileHover={{ x: 2 }}
                                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all text-xs"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {car.image ? (
                                            <img
                                                src={car.image}
                                                alt={`${car.brand} ${car.model}`}
                                                className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 text-[#212c40]/60 font-bold shrink-0">
                                                🚗
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <p className="font-bold text-gray-800 truncate">{car.brand} {car.model}</p>
                                                <span className={`px-1 rounded-[4px] text-[9px] font-bold border uppercase shrink-0 ${car.type === 'Inward'
                                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                    : 'bg-purple-50 text-purple-600 border-purple-100'
                                                    }`}>
                                                    {car.type}
                                                </span>
                                                {/* Agreement type tag */}
                                                {car.vendorAgreementType && (
                                                    <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold border shrink-0 ${car.vendorAgreementType === 'monthly'
                                                            ? 'bg-orange-50 text-orange-600 border-orange-100'
                                                            : 'bg-teal-50 text-teal-600 border-teal-100'
                                                        }`}>
                                                        {car.vendorAgreementType === 'monthly' ? '📅 Monthly' : '📆 Per Day'}
                                                    </span>
                                                )}
                                            </div>
                                            {car.registrationNumber && car.registrationNumber.toLowerCase() !== 'outward' && (
                                                <span className="px-1.5 py-0.5 rounded bg-gray-200/60 text-gray-600 font-mono text-[10px] uppercase font-semibold">
                                                    {car.registrationNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {car.vendorAgreementType === 'monthly' ? (
                                            <>
                                                <p className="font-extrabold font-mono text-emerald-600">+₹{(car.totalRevenue || 0).toLocaleString('en-IN')}</p>
                                                <p className="text-[9px] text-emerald-500 font-semibold uppercase tracking-wide">Admin Profit</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className={`font-extrabold font-mono ${car.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {car.netProfit >= 0 ? '+' : '-'}₹{Math.abs(car.netProfit || 0).toLocaleString('en-IN')}
                                                </p>
                                                <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Net Profit</p>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const PaymentRow = ({ payment }) => (
    <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="hover:bg-gray-50 transition-colors"
    >
        <td className="px-6 py-4 font-bold text-gray-700">{payment.date}</td>
        <td className="px-6 py-4">
            <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{payment.vendor}</span>
                {payment.verified && <MdVerified className="text-[#1c205c]" size={14} />}
            </div>
        </td>
        <td className="px-6 py-4 text-gray-500">{payment.refId}</td>
        <td className="px-6 py-4 font-bold text-gray-900">₹ {payment.amount.toLocaleString()}</td>
        <td className="px-6 py-4">
            <StatusBadge status={payment.type} />
        </td>
        <td className="px-6 py-4">
            <StatusBadge status={payment.status} />
        </td>
    </motion.tr>
);

// --- Mock Data ---

const MOCK_HISTORY_LOGS = [
    { id: 1, date: "20 Dec 2025", vendor: "Elite Wheels", action: "Partnered", detail: "Joined as Premium Partner", status: "Verified" },
    { id: 2, date: "15 Dec 2025", vendor: "City Cabs Inc", action: "Fleet Update", detail: "Added 5 new vehicles", status: "Active" },
    { id: 3, date: "10 Dec 2025", vendor: "Rajesh Motors", action: "Payout", detail: "Monthly settlement processed", status: "Completed" },
];


// --- Pages ---

export const AllVendorsPage = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newVendor, setNewVendor] = useState({ name: '', type: 'Car Provider', phone: '', email: '', profileImage: null, preview: 'https://via.placeholder.com/150' });

    const [errors, setErrors] = useState({});

    // Car Owners Dropdown State
    const [owners, setOwners] = useState([]);
    const [showOwnersDropdown, setShowOwnersDropdown] = useState(false);

    // Ledger Modal State
    const [ledgerVendor, setLedgerVendor] = useState(null);
    const [isLedgerOpen, setIsLedgerOpen] = useState(false);

    useEffect(() => {
        fetchVendors();
        fetchOwners();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await api.get('/crm/vendors');
            if (res.data.success) {
                setVendors(res.data.data.vendors);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOwners = async () => {
        try {
            const res = await api.get('/crm/car-owners');
            if (res.data.success) {
                setOwners(res.data.data.owners || []);
            }
        } catch (error) {
            console.error('Error fetching car owners:', error);
        }
    };

    const handleSelectOwner = (owner) => {
        setNewVendor(prev => ({
            ...prev,
            name: owner.name,
            phone: owner.phone || '',
            email: owner.email || ''
        }));
        setErrors(prev => ({
            ...prev,
            phone: null,
            email: null
        }));
        setShowOwnersDropdown(false);
    };

    const filteredOwners = owners.filter(owner =>
        owner.name.toLowerCase().includes((newVendor.name || '').toLowerCase())
    );

    const filteredVendors = vendors.filter(vendor => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        const keywords = cleanSearch.split(/\s+/).filter(Boolean);
        return keywords.length === 0 || keywords.every(keyword =>
            vendor.name.toLowerCase().includes(keyword) ||
            (vendor.email || '').toLowerCase().includes(keyword) ||
            (vendor.phone || '').toLowerCase().includes(keyword) ||
            (vendor.type || '').toLowerCase().includes(keyword)
        );
    });


    const validate = () => {
        let tempErrors = {};
        if (!newVendor.name) tempErrors.name = "Name is required.";
        if (!/^\d{10}$/.test(newVendor.phone)) {
            tempErrors.phone = "Phone number must be 10 digits.";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newVendor.email)) {
            tempErrors.email = "Invalid email format.";
        }
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleAddVendor = async () => {
        if (!validate()) return;

        const formData = new FormData();
        formData.append('name', newVendor.name);
        formData.append('type', newVendor.type);
        formData.append('phone', newVendor.phone);
        formData.append('email', newVendor.email);
        if (newVendor.profileImage instanceof File) {
            formData.append('profileImage', newVendor.profileImage);
        }

        try {
            let res;
            if (editingVendor) {
                res = await api.put(`/crm/vendors/${editingVendor._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await api.post('/crm/vendors', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            if (res.data.success) {
                toast.success(editingVendor ? 'Vendor updated successfully' : 'Vendor onboarded successfully');
                fetchVendors();
                setIsAddModalOpen(false);
                setNewVendor({ name: '', type: 'Car Provider', phone: '', email: '', profileImage: null, preview: 'https://via.placeholder.com/150' });
                setEditingVendor(null);
                setErrors({});
            }
        } catch (error) {
            console.error('Error saving vendor:', error);
            toast.error(error.response?.data?.message || 'Failed to save vendor');
        }
    };

    const handleEditVendor = (vendor) => {
        setEditingVendor(vendor);
        setNewVendor({
            name: vendor.name,
            type: vendor.type,
            phone: vendor.phone,
            email: vendor.email,
            profileImage: null,
            preview: vendor.profileImage || 'https://via.placeholder.com/150'
        });
        setIsAddModalOpen(true);
    };

    const handleDeleteVendor = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vendor?')) return;
        try {
            await api.delete(`/crm/vendors/${id}`);
            toast.success('Vendor deleted successfully');
            setVendors(vendors.filter(v => v._id !== id));
        } catch (error) {
            console.error('Delete vendor error:', error);
            toast.error('Failed to delete vendor');
        }
    };

    const handleViewLedger = (vendor) => {
        setLedgerVendor(vendor);
        setIsLedgerOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="hover:text-[#212c40] cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
                        <span>/</span>
                        <span className="hover:text-[#212c40] cursor-pointer transition-colors" onClick={() => navigate('/crm/vendors/all')}>Vendors</span>
                        <span>/</span>
                        <span className="text-gray-800 font-medium">All Vendors</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor Directory</h1>
                    <p className="text-gray-500 text-sm">Manage car providers, drivers, and partners.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search vendors..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                        />
                    </div>
                    <button
                        onClick={() => {
                            setEditingVendor(null);
                            setNewVendor({ name: '', type: 'Car Provider', phone: '', email: '', profileImage: null, preview: 'https://via.placeholder.com/150' });
                            setIsAddModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-[#212c40] text-white rounded-xl shadow-lg shadow-gray-300 hover:bg-[#2a3550] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <MdStore /> Add Vendor
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10">Loading vendors...</div>
                ) : (
                    filteredVendors.map(vendor => (
                        <VendorCard
                            key={vendor._id || vendor.id}
                            vendor={vendor}
                            onEdit={handleEditVendor}
                            onDelete={handleDeleteVendor}
                            onViewLedger={handleViewLedger}
                        />
                    ))
                )}
            </div>

            {filteredVendors.length === 0 && !loading && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <h3 className="text-lg font-bold text-gray-800">No vendors found</h3>
                    <p className="text-gray-500">Try searching for something else.</p>
                </div>
            )}

            {/* Vendor Ledger Modal */}
            <AnimatePresence>
                {isLedgerOpen && (
                    <VendorLedgerModal
                        vendor={ledgerVendor}
                        isOpen={isLedgerOpen}
                        onClose={() => { setIsLedgerOpen(false); setLedgerVendor(null); }}
                    />
                )}
            </AnimatePresence>

            <SimpleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingVendor ? "Edit Vendor" : "Add New Vendor"}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Photo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                                {newVendor.preview && !newVendor.preview.includes('placeholder.com') ? (
                                    <img src={newVendor.preview} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <MdPerson size={36} className="text-gray-400" />
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const imageUrl = URL.createObjectURL(file);
                                        setNewVendor({ ...newVendor, profileImage: file, preview: imageUrl });
                                    }
                                }}
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-indigo-50 file:text-indigo-700
                                  hover:file:bg-indigo-100"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                        <input
                            type="text"
                            placeholder="Enter vendor name..."
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                            value={newVendor.name}
                            onChange={(e) => {
                                setNewVendor({ ...newVendor, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: null });
                            }}
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                            value={newVendor.phone}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val) && val.length <= 10) {
                                    setNewVendor({ ...newVendor, phone: val });
                                    if (errors.phone) setErrors({ ...errors, phone: null });
                                }
                            }}
                            placeholder="10 digit mobile number"
                        />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                            value={newVendor.email}
                            onChange={(e) => {
                                setNewVendor({ ...newVendor, email: e.target.value });
                                if (errors.email) setErrors({ ...errors, email: null });
                            }}
                            placeholder="Enter Vendor Email"
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <button
                        onClick={handleAddVendor}
                        className="w-full py-2.5 bg-[#212c40] text-white rounded-xl font-bold hover:bg-[#2a3550] transition-colors shadow-lg shadow-gray-300"
                    >
                        {editingVendor ? "Update Vendor" : "Onboard Vendor"}
                    </button>
                </div>
            </SimpleModal>
        </div>
    );
};



export const VendorHistoryPage = () => {
    const navigate = useNavigate();
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span>
                        <span>/</span>
                        <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/vendors/all')}>Vendors</span>
                        <span>/</span>
                        <span className="text-gray-800 font-medium">History</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendor History</h1>
                    <p className="text-gray-500 text-sm">Timeline of partnership milestones.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">Action</th>
                            <th className="px-6 py-4">Detail</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {MOCK_HISTORY_LOGS.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-700">{log.date}</td>
                                <td className="px-6 py-4 font-medium text-gray-900">{log.vendor}</td>
                                <td className="px-6 py-4 text-indigo-600 font-bold">{log.action}</td>
                                <td className="px-6 py-4 text-gray-600">{log.detail}</td>
                                <td className="px-6 py-4"><StatusBadge status={log.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
