import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdWarning, 
  MdDirectionsCar, 
  MdAccessTime, 
  MdLocationOn, 
  MdAttachMoney, 
  MdPerson, 
  MdDriveEta, 
  MdCloudUpload 
} from 'react-icons/md';
import ThemedDropdown from '../../components/ThemedDropdown';

const AccidentAddCase = () => {
    const navigate = useNavigate();
    const [vehicle, setVehicle] = useState('Select a car...');
    const [severity, setSeverity] = useState('Minor (Scratches/Dents)');
    
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span> 
                  <span>/</span> 
                  <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/all')}>Cars</span> 
                  <span>/</span> 
                  <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/accidents/active')}>Accidents</span> 
                  <span>/</span> 
                  <span className="text-gray-800 font-medium">New Report</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Report New Accident</h1>
                <p className="text-gray-500 text-sm">File a detailed incident report for insurance and repairs.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Step 1: Vehicle & Incident */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#212c40]/10 text-[#212c40] flex items-center justify-center text-xs">1</span>
                        Vehicle & Incident Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Vehicle</label>
                             <div className="relative">
                                 <MdDirectionsCar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                 <ThemedDropdown
                                     options={['Select a car...', 'Toyota Innova Crysta (PB 01 1234)', 'Mahindra Thar (PB 65 9876)']}
                                     value={vehicle}
                                     onChange={(val) => setVehicle(val)}
                                     className="bg-gray-50 bg-white" 
                                     width="w-full"
                                 />
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Incident Date & Time</label>
                             <div className="relative">
                                 <MdAccessTime className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                 <input type="datetime-local" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] transition-shadow" />
                             </div>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Incident Location</label>
                             <div className="relative">
                                 <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                 <input type="text" placeholder="Enter exact location (e.g. NH-44 near Ambala)" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] transition-shadow" />
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Driver Name</label>
                             <div className="relative">
                                 <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                 <input type="text" placeholder="Driver on duty" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] transition-shadow" />
                             </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Driver License No.</label>
                             <div className="relative">
                                 <MdDriveEta className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                 <input type="text" placeholder="DL Number" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] transition-shadow" />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Step 2: Damage Assessment */}
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#212c40]/10 text-[#212c40] flex items-center justify-center text-xs">2</span>
                        Damage Assessment
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Severity Level</label>
                                <ThemedDropdown
                                    options={['Minor (Scratches/Dents)', 'Major (Parts Replacement)', 'Critical (Non-drivable)']}
                                    value={severity}
                                    onChange={(val) => setSeverity(val)}
                                    className="bg-gray-50 bg-white"
                                    width="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estimated Cost (Optional)</label>
                                <div className="relative">
                                    <MdAttachMoney className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Approx repair cost" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] transition-shadow" />
                                </div>
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description of Incident & Damage</label>
                             <textarea 
                                rows="4" 
                                placeholder="Describe how the accident happened and visible damages..."
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#212c40]/20 focus:border-[#212c40] transition-shadow resize-none"
                             ></textarea>
                        </div>
                    </div>
                </div>

                {/* Step 3: Evidence */}
                <div className="p-6">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#212c40]/10 text-[#212c40] flex items-center justify-center text-xs">3</span>
                        Evidence & Photos
                    </h3>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors group">
                        <div className="w-16 h-16 bg-[#212c40]/10 text-[#212c40] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <MdCloudUpload size={30} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-700">Click to Upload Photos/Videos</h4>
                        <p className="text-gray-400 text-sm mt-1 max-w-xs">Upload images of all 4 sides of the car and close-ups of damaged areas.</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button 
                        onClick={() => navigate('/crm/cars/accidents/active')}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                         onClick={() => navigate('/crm/cars/accidents/active')}
                         className="px-6 py-2.5 bg-[#212c40] text-white font-bold rounded-xl hover:bg-[#2a3550] transition-colors shadow-lg shadow-gray-300 flex items-center gap-2"
                    >
                        <MdWarning size={18} />
                        Alert Admin & Save Case
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccidentAddCase;
