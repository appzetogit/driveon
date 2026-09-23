import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MdArrowBack, 
  MdEdit, 
  MdCameraAlt, 
  MdNoteAdd, 
  MdLocationOn
} from 'react-icons/md';
import { premiumColors } from '../../../theme/colors';

// Internal Components
import CarDiagram from './components/CarDiagram';
import DamageCharts from './components/DamageCharts';
import DamageViewer from './components/DamageViewer';
import DamageNotes from './components/DamageNotes';

// Mock Data
const MOCK_ACCIDENT_DETAIL = {
  id: 1,
  carName: "Toyota Innova Crysta",
  regNumber: "PB 01 1234",
  severity: "Major",
  status: "In Repair",
  reportDate: "26 Dec 2025",
  location: "Delhi-Agra Hwy",
  estCost: "₹ 72,000",
  garage: "Sharma Auto Works",
  garageContact: "+91 98765 43210",
  description: "Head-on collision with divider. Front bumper and hood severely damaged. Right fender crumpled.",
  
  // Mapping names to SVG part names
  damagedAreas: [
     { 
       id: 'front-bumper', 
       name: 'Front Bumper', 
       severity: 'Major', 
       images: [
           "https://5.imimg.com/data5/SELLER/Default/2023/1/YI/IO/WO/3629087/car-denting-painting-services.jpg", // Mock
       ] 
     },
     { 
       id: 'hood', 
       name: 'Hood', 
       severity: 'Medium',
       images: [
           "https://imgd.aeplcdn.com/370x208/n/cw/ec/115025/innova-crysta-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80" 
       ]
     },
     { 
         id: 'right-fender', 
         name: 'Front Right Fender', 
         severity: 'Major',
         images: [] 
     },
     {
         id: 'roof',
         name: 'Roof',
         severity: 'Minor',
         images: []
     }
  ],
  
  allImages: [
      "https://imgd.aeplcdn.com/370x208/n/cw/ec/115025/innova-crysta-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80",
      "https://5.imimg.com/data5/SELLER/Default/2023/1/YI/IO/WO/3629087/car-denting-painting-services.jpg"
  ]
};

export const AccidentDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const data = MOCK_ACCIDENT_DETAIL;

    // Status Update State
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(data.status);
    const [newStatus, setNewStatus] = useState(data.status);
    const [finalCost, setFinalCost] = useState('');
    const [recoveredAmount, setRecoveredAmount] = useState('');

    // Viewer State
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerImages, setViewerImages] = useState([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    const handlePartClick = (partName) => {
        // Find part data
        const part = data.damagedAreas.find(p => p.name.toLowerCase() === partName.toLowerCase());
        
        if (part && part.images && part.images.length > 0) {
            setViewerImages(part.images.map(src => ({ src, alt: `${partName} Damage` })));
            setViewerIndex(0);
            setIsViewerOpen(true);
        } else if (part) {
            // No images but damaged - silently handle
            console.log(`Selected: ${partName} (${part.severity}). No specific photos available.`);
        } else {
            console.log("Clicked undamaged part:", partName);
        }
    };

    const handleUpdateStatus = () => {
        // Demo logic to update status
        setCurrentStatus(newStatus);
        setIsStatusModalOpen(false);
        // Api call would go here
    };

    const handleCloseCase = async () => {
        // Validate inputs
        if (!finalCost || !recoveredAmount) {
            return; // Form validation will handle this
        }

        const netLoss = Number(finalCost) - Number(recoveredAmount);
        
        // Create closed case entry
        const closedCase = {
            id: data.id,
            car: data.carName,
            reg: data.regNumber,
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            finalCost: `₹ ${Number(finalCost).toLocaleString()}`,
            recovered: `₹ ${Number(recoveredAmount).toLocaleString()}`,
            netLoss: `₹ ${netLoss.toLocaleString()}`,
            status: netLoss === 0 ? 'Full Recovery' : 'Settled',
            closedAt: new Date().toISOString()
        };

        // Get existing closed cases from localStorage
        const existingClosed = JSON.parse(localStorage.getItem('closedAccidentCases') || '[]');
        
        // Add new closed case
        existingClosed.push(closedCase);
        
        // Save back to localStorage
        localStorage.setItem('closedAccidentCases', JSON.stringify(existingClosed));

        // In a real app, make API call to update the case
        // await api.put(`/crm/accidents/${id}`, {
        //     status: 'Closed',
        //     finalCost: Number(finalCost),
        //     recoveredAmount: Number(recoveredAmount),
        //     netLoss: netLoss
        // });

        // Navigate to closed cases
        setIsStatusModalOpen(false);
        navigate('/crm/cars/accidents/closed');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors self-start">
                    <MdArrowBack /> Back to List
                </button>
                <div className="flex gap-2">

                    <button 
                        onClick={() => setIsStatusModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#212c40] text-white font-bold rounded-xl hover:bg-[#2a3550] shadow-sm transition-colors"
                    >
                        <MdEdit /> Update Status
                    </button>
                </div>
            </div>

            {/* Title Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                 <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                     <img src={data.allImages[0]} alt="Car" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                     <div className="flex flex-wrap items-center gap-3 mb-1">
                         <h1 className="text-2xl font-bold text-gray-900">{data.carName}</h1>
                         <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider">{data.severity} Damage</span>
                         <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-200">{currentStatus}</span>
                     </div>
                     <p className="font-mono text-gray-500 font-bold text-lg mb-2">{data.regNumber}</p>
                     <div className="flex items-center gap-4 text-sm text-gray-500">
                         <span className="flex items-center gap-1"><MdLocationOn className="text-gray-400" /> {data.location}</span>
                         <span>•</span>
                         <span>Reported: {data.reportDate}</span>
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
                             <CarDiagram damagedParts={data.damagedAreas} onPartClick={handlePartClick} />
                        </div>
                    </div>
                </div>

                {/* Right: Charts & Summaries */}
                <div className="space-y-6">
                    <DamageNotes data={data} />
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
                            <p className="text-sm text-gray-500">Select the new status for this accident case:</p>
                            <div className="space-y-2">
                                {['In Repair', 'Closed'].map(status => (
                                    <button 
                                        key={status}
                                        onClick={() => setNewStatus(status)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all
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

                            {newStatus === 'Closed' && (
                                <div className="space-y-3 pt-2 animate-fadeIn">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Final Repair Cost (₹)</label>
                                        <input 
                                            type="number" 
                                            value={finalCost}
                                            onChange={(e) => setFinalCost(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] outline-none transition-all font-mono"
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
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] outline-none transition-all font-mono"
                                            placeholder="e.g. 50000"
                                            required
                                        />
                                    </div>
                                    {finalCost && recoveredAmount && (
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500 uppercase">Net Loss:</span>
                                                <span className={`text-lg font-bold ${(Number(finalCost) - Number(recoveredAmount)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    ₹ {(Number(finalCost) - Number(recoveredAmount)).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={() => {
                                    if (newStatus === 'Closed') {
                                        handleCloseCase();
                                    } else {
                                        handleUpdateStatus();
                                    }
                                }}
                                disabled={newStatus === 'Closed' && (!finalCost || !recoveredAmount)}
                                className="w-full py-3 mt-4 rounded-xl bg-[#212c40] text-white font-bold shadow-lg shadow-gray-300 hover:bg-[#2a3550] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {newStatus === 'Closed' ? 'Close Case & Save' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Default export mainly for the route lazy load
export default AccidentDetailPage;
