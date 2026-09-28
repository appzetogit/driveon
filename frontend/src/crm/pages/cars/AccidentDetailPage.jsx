import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MdArrowBack, 
  MdEdit, 
  MdLocationOn,
  MdRefresh,
  MdDirectionsCar
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import { premiumColors } from '../../../theme/colors';

// Internal Components
import CarDiagram from './components/CarDiagram';
import DamageCharts from './components/DamageCharts';
import DamageViewer from './components/DamageViewer';
import DamageNotes from './components/DamageNotes';

export const AccidentDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Status Update State
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentStatus, setCurrentStatus] = useState('Active');
    const [newStatus, setNewStatus] = useState('Active');
    const [finalCost, setFinalCost] = useState('');
    const [recoveredAmount, setRecoveredAmount] = useState('');
    const [saving, setSaving] = useState(false);

    // Viewer State
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerImages, setViewerImages] = useState([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    const fetchCaseDetail = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/crm/accidents/${id}`);
            if (res.data?.success && res.data?.data?.accident) {
                const acc = res.data.data.accident;
                setCaseData(acc);
                setCurrentStatus(acc.status || 'Active');
                setNewStatus(acc.status || 'Active');
                if (acc.finalCost) setFinalCost(String(acc.finalCost));
                if (acc.recoveredAmount) setRecoveredAmount(String(acc.recoveredAmount));
            } else {
                setCaseData(null);
            }
        } catch (error) {
            console.error('Failed to load accident case detail:', error);
            toast.error('Failed to load case details');
            setCaseData(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchCaseDetail();
        }
    }, [id, fetchCaseDetail]);

    // Format data for presentation & child components
    const carName = caseData?.car ? `${caseData.car.brand} ${caseData.car.model}` : 'Vehicle';
    const regNumber = caseData?.car?.registrationNumber || caseData?.driverLicenseNo || 'N/A';
    const reportDate = caseData?.incidentDate ? new Date(caseData.incidentDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }) : 'N/A';
    const location = caseData?.incidentLocation || 'N/A';
    const severity = caseData?.severity || 'Medium';
    const estCost = `₹ ${(caseData?.estimatedCost || 0).toLocaleString('en-IN')}`;
    const description = caseData?.description || 'No detailed damage description provided.';

    const evidenceUrls = (caseData?.evidence || []).map(e => e.url).filter(Boolean);
    const carImageUrls = (caseData?.car?.images || []).map(img => img.url).filter(Boolean);
    const allImages = evidenceUrls.length > 0 ? evidenceUrls : carImageUrls;

    // Build damaged areas from evidence / description
    const damagedAreas = [
        { 
            id: 'front-bumper', 
            name: 'Front Bumper', 
            severity: severity, 
            images: evidenceUrls.length > 0 ? evidenceUrls.slice(0, 1) : [] 
        },
        { 
            id: 'hood', 
            name: 'Hood', 
            severity: severity === 'Major' ? 'Major' : 'Minor',
            images: evidenceUrls.length > 1 ? evidenceUrls.slice(1, 2) : []
        }
    ];

    const childData = {
        carName,
        regNumber,
        severity,
        status: currentStatus,
        reportDate,
        location,
        estCost,
        garage: 'Authorized Service Center',
        garageContact: caseData?.driverName ? `Driver: ${caseData.driverName}` : 'N/A',
        description,
        damagedAreas,
        allImages
    };

    const handlePartClick = (partName) => {
        const part = damagedAreas.find(p => p.name.toLowerCase() === partName.toLowerCase());
        if (part && part.images && part.images.length > 0) {
            setViewerImages(part.images.map(src => ({ src, alt: `${partName} Damage` })));
            setViewerIndex(0);
            setIsViewerOpen(true);
        } else if (allImages.length > 0) {
            setViewerImages(allImages.map(src => ({ src, alt: `${carName} Evidence` })));
            setViewerIndex(0);
            setIsViewerOpen(true);
        } else {
            toast('No specific photos available for this part', { icon: 'ℹ️' });
        }
    };

    const handleUpdateStatus = async () => {
        try {
            setSaving(true);
            const res = await api.put(`/crm/accidents/${id}`, {
                status: newStatus
            });
            if (res.data?.success) {
                toast.success('Status updated successfully');
                setCurrentStatus(newStatus);
                setIsStatusModalOpen(false);
            }
        } catch (error) {
            console.error('Update status error:', error);
            toast.error('Failed to update status');
        } finally {
            setSaving(false);
        }
    };

    const handleCloseCase = async () => {
        if (!finalCost || !recoveredAmount) {
            toast.error('Please enter final cost and recovered amount');
            return;
        }

        const netLoss = Math.max(0, Number(finalCost) - Number(recoveredAmount));
        const resolvedStatus = netLoss === 0 ? 'Full Recovery' : 'Settled';

        try {
            setSaving(true);
            const res = await api.put(`/crm/accidents/${id}`, {
                status: resolvedStatus,
                finalCost: Number(finalCost),
                recoveredAmount: Number(recoveredAmount),
                netLoss: netLoss
            });

            if (res.data?.success) {
                toast.success(`Case resolved as ${resolvedStatus}`);
                setIsStatusModalOpen(false);
                navigate('/crm/cars/accidents/closed');
            }
        } catch (error) {
            console.error('Close case error:', error);
            toast.error('Failed to close and settle case');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-32 text-center max-w-7xl mx-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading accident case details...</p>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div className="py-24 text-center max-w-7xl mx-auto space-y-4">
                <p className="text-lg font-bold text-gray-800">Accident case not found</p>
                <button 
                    onClick={() => navigate('/crm/cars/accidents/active')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm"
                >
                    Back to Active Cases
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors self-start font-medium">
                    <MdArrowBack size={18} /> Back to List
                </button>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsStatusModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#212c40] text-white font-bold rounded-xl hover:bg-[#2a3550] shadow-sm transition-colors text-sm"
                    >
                        <MdEdit /> Update Status / Settle
                    </button>
                </div>
            </div>

            {/* Title Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                 <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center">
                     {allImages[0] ? (
                       <img src={allImages[0]} alt="Car" className="w-full h-full object-cover" />
                     ) : (
                       <MdDirectionsCar size={40} className="text-gray-300" />
                     )}
                 </div>
                 <div className="flex-1">
                     <div className="flex flex-wrap items-center gap-3 mb-1">
                         <h1 className="text-2xl font-bold text-gray-900">{carName}</h1>
                         <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider">{severity} Damage</span>
                         <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${
                           currentStatus === 'Active' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                         }`}>
                           {currentStatus}
                         </span>
                     </div>
                     <p className="font-mono text-gray-500 font-bold text-lg mb-2">{regNumber}</p>
                     <div className="flex items-center gap-4 text-sm text-gray-500">
                         <span className="flex items-center gap-1"><MdLocationOn className="text-gray-400" /> {location}</span>
                         <span>•</span>
                         <span>Incident Date: {reportDate}</span>
                         {caseData.driverName && (
                           <>
                             <span>•</span>
                             <span>Driver: {caseData.driverName}</span>
                           </>
                         )}
                     </div>
                 </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Interaction Diagram */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Interactive Damage Map</h2>
                            <p className="text-xs text-gray-400">Click highlighted parts to view photos</p>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl overflow-hidden relative border border-gray-100">
                             <CarDiagram damagedParts={damagedAreas} onPartClick={handlePartClick} />
                        </div>
                    </div>
                </div>

                {/* Right: Charts & Summaries */}
                <div className="space-y-6">
                    <DamageNotes data={childData} />
                    <DamageCharts />
                </div>
            </div>

            {/* Viewer Modal */}
            <DamageViewer 
                visible={isViewerOpen} 
                onClose={() => setIsViewerOpen(false)} 
                images={viewerImages} 
                activeIndex={viewerIndex}
            />

            {/* Update Status Modal */}
             {isStatusModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsStatusModalOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Update Case Status</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">Select the status for this accident case:</p>
                            <div className="space-y-2">
                                {['Active', 'Settled', 'Full Recovery'].map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => setNewStatus(status)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl border font-bold text-sm transition-all
                                            ${newStatus === status 
                                                ? 'bg-[#212c40] text-white border-[#212c40]' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#212c40]/30 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            {(newStatus === 'Settled' || newStatus === 'Full Recovery') && (
                                <div className="space-y-3 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Final Repair Cost (₹)</label>
                                        <input 
                                            type="number" 
                                            value={finalCost}
                                            onChange={(e) => setFinalCost(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] outline-none transition-all font-mono text-sm"
                                            placeholder="e.g. 72000"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Amount Recovered (₹)</label>
                                        <input 
                                            type="number" 
                                            value={recoveredAmount}
                                            onChange={(e) => setRecoveredAmount(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] outline-none transition-all font-mono text-sm"
                                            placeholder="e.g. 50000"
                                            required
                                        />
                                    </div>
                                    {finalCost && recoveredAmount && (
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500 uppercase">Net Loss:</span>
                                                <span className={`text-base font-bold ${(Number(finalCost) - Number(recoveredAmount)) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    ₹ {(Number(finalCost) - Number(recoveredAmount)).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={() => {
                                    if (newStatus === 'Settled' || newStatus === 'Full Recovery') {
                                        handleCloseCase();
                                    } else {
                                        handleUpdateStatus();
                                    }
                                }}
                                disabled={saving || ((newStatus === 'Settled' || newStatus === 'Full Recovery') && (!finalCost || !recoveredAmount))}
                                className="w-full py-3 mt-4 rounded-xl bg-[#212c40] text-white font-bold shadow-lg shadow-gray-300 hover:bg-[#2a3550] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {saving ? 'Saving...' : (newStatus === 'Settled' || newStatus === 'Full Recovery' ? 'Settle & Close Case' : 'Update Status')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccidentDetailPage;
