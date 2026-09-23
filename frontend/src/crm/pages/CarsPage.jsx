import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MdDirectionsCar, 
  MdAccessTime, 
  MdWarning, 
  MdBuild, 
  MdHistory,
  MdDescription,
  MdTimeline,
  MdAdd,
  MdCheckCircle
} from 'react-icons/md';
import { premiumColors } from '../../theme/colors';
import ThemedDropdown from '../components/ThemedDropdown';

// MOCK DATA: CARS
const MOCK_FLEET = [
  { id: 1, name: 'Toyota Innova Crysta', plate: 'MH-12-AB-1234', status: 'On Trip', health: 92, lastService: '2023-11-10', insuranceExp: '2024-05-20', image: 'https://imgd.aeplcdn.com/370x208/n/cw/ec/129643/innova-crysta-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80' },
  { id: 2, name: 'Hyundai Creta', plate: 'MH-14-GH-5678', status: 'Available', health: 98, lastService: '2023-12-01', insuranceExp: '2024-08-15', image: 'https://imgd.aeplcdn.com/370x208/n/cw/ec/141113/creta-exterior-right-front-three-quarter.jpeg?isig=0&q=80' },
  { id: 3, name: 'Maruti Swift Dzire', plate: 'MH-12-XY-9012', status: 'Maintenance', health: 75, lastService: '2023-10-25', insuranceExp: '2023-12-30', image: 'https://imgd.aeplcdn.com/370x208/n/cw/ec/158673/dzire-exterior-right-front-three-quarter.jpeg?isig=0&q=80' },
  { id: 4, name: 'Mahindra XUV700', plate: 'MH-46-JK-3456', status: 'Available', health: 100, lastService: '2023-12-15', insuranceExp: '2024-11-01', image: 'https://imgd.aeplcdn.com/370x208/n/cw/ec/42355/xuv700-exterior-right-front-three-quarter.jpeg?isig=0&q=80' },
  { id: 5, name: 'Honda City', plate: 'MH-02-CD-7890', status: 'Accident', health: 40, lastService: '2023-09-10', insuranceExp: '2024-02-10', image: 'https://imgd.aeplcdn.com/370x208/n/cw/ec/134287/city-exterior-right-front-three-quarter.jpeg?isig=0&q=80' },
];

const MOCK_ACCIDENTS = [
  { id: 101, car: 'Honda City', date: '2023-12-20', type: 'Major Collision', status: 'Insurance Claim', estimatedCost: 55000 },
  { id: 102, car: 'Swift Dzire', date: '2023-12-18', type: 'Scratch/Dent', status: 'Repairing', estimatedCost: 4500 },
];

const DOCUMENT_ALERTS = [
  { id: 1, car: 'Maruti Swift Dzire', doc: 'Insurance', expiry: '2023-12-30', status: 'Critical' },
  { id: 2, car: 'Toyota Innova Crysta', doc: 'PUC', expiry: '2024-01-05', status: 'Warning' },
];

// SUB-COMPONENT: Fleet Grid
const FleetView = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
     {MOCK_FLEET.map(car => (
        <div key={car.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
           {/* Image & Status Tag */}
           <div className="h-40 bg-gray-100 relative overflow-hidden">
              <img src={car.image} alt={car.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm
                    ${car.status === 'Available' ? 'bg-green-500 text-white' : 
                      car.status === 'On Trip' ? 'bg-blue-500 text-white' : 
                      car.status === 'Maintenance' ? 'bg-orange-500 text-white' : 
                      'bg-red-500 text-white'}`}>
                    {car.status}
                 </span>
              </div>
           </div>
           
           {/* Content */}
           <div className="p-4">
              <h3 className="font-bold text-gray-900 truncate">{car.name}</h3>
              <p className="text-xs text-gray-500 font-mono mb-3">{car.plate}</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                 <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <span className="block text-gray-400 mb-1">Health</span>
                    <span className={`font-bold ${car.health < 80 ? 'text-red-500' : 'text-green-600'}`}>
                       {car.health}%
                    </span>
                 </div>
                 <div className="bg-gray-50 p-2 rounded-lg text-center">
                    <span className="block text-gray-400 mb-1">Service Due</span>
                    <span className="font-bold text-gray-700">20d</span>
                 </div>
              </div>

              <div className="flex gap-2">
                 <button className="flex-1 py-2 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                    View Timeline
                 </button>
                 <button className="px-3 py-2 text-gray-400 bg-gray-50 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <MdBuild size={16} />
                 </button>
              </div>
           </div>
        </div>
     ))}
  </div>
);

// SUB-COMPONENT: Timeline Visual
const TimelineView = ({ timelineRange, setTimelineRange }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
     <div className="flex justify-between mb-6">
        <h3 className="font-bold text-lg">Toyota Innova Crysta Lifecycle</h3>
        <ThemedDropdown
           options={['Last 30 Days', 'All Time']}
           value={timelineRange}
           onChange={(val) => setTimelineRange(val)}
           className="bg-gray-50 text-sm"
           width="w-40"
        />
     </div>
     
     {/* Timeline Chain Visual */}
     <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        {/* Connecting Line */}
        <div className="hidden md:block absolute top-[28px] left-0 w-full h-1 bg-gray-200 z-0"></div>

        {/* Event 1 */}
        <div className="relative z-10 flex flex-col items-center text-center w-full md:w-auto">
           <div className="w-14 h-14 rounded-full bg-green-100 border-4 border-white shadow-sm flex items-center justify-center text-green-600 mb-2">
              <MdDirectionsCar size={24} />
           </div>
           <p className="font-bold text-sm">Booking #1024</p>
           <p className="text-xs text-gray-500">10 Dec - 15 Dec</p>
           <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded mt-1">+ Rs. 15,000</span>
        </div>

        {/* Event 2 (Accident) */}
        <div className="relative z-10 flex flex-col items-center text-center w-full md:w-auto">
           <div className="w-14 h-14 rounded-full bg-red-100 border-4 border-white shadow-sm flex items-center justify-center text-red-600 mb-2">
              <MdWarning size={24} />
           </div>
           <p className="font-bold text-sm">Minor Accident</p>
           <p className="text-xs text-gray-500">15 Dec</p>
           <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded mt-1">Damaged Bumper</span>
        </div>

        {/* Event 3 (Repair) */}
        <div className="relative z-10 flex flex-col items-center text-center w-full md:w-auto">
           <div className="w-14 h-14 rounded-full bg-orange-100 border-4 border-white shadow-sm flex items-center justify-center text-orange-600 mb-2">
              <MdBuild size={24} />
           </div>
           <p className="font-bold text-sm">Garage Repair</p>
           <p className="text-xs text-gray-500">16 Dec - 18 Dec</p>
           <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded mt-1">- Rs. 5,000</span>
        </div>

        {/* Event 4 (Back) */}
         <div className="relative z-10 flex flex-col items-center text-center w-full md:w-auto">
           <div className="w-14 h-14 rounded-full bg-blue-100 border-4 border-white shadow-sm flex items-center justify-center text-blue-600 mb-2">
              <MdCheckCircle size={24} />
           </div>
           <p className="font-bold text-sm">Back to Fleet</p>
           <p className="text-xs text-gray-500">18 Dec</p>
           <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1">Ready</span>
        </div>
     </div>
  </div>
);

// SUB-COMPONENT: Accidents List
const AccidentsView = () => (
  <div className="space-y-4">
     <div className="flex justify-end">
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">
           <MdAdd /> Report New Accident
        </button>
     </div>
     
     <div className="grid gap-4">
        {MOCK_ACCIDENTS.map(acc => (
           <div key={acc.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <MdWarning size={24} />
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900">{acc.car}</h4>
                    <p className="text-xs text-gray-500">Date: {acc.date} • Type: {acc.type}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase">Est. Cost</p>
                    <p className="font-bold text-gray-800">Rs. {acc.estimatedCost}</p>
                 </div>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border
                    ${acc.status === 'Insurance Claim' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                    {acc.status}
                 </span>
                 <button className="text-xs font-semibold text-blue-600 hover:underline">Details</button>
              </div>
           </div>
        ))}
     </div>
  </div>
);

// SUB-COMPONENT: Documents View
const DocsView = () => (
   <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <h3 className="font-bold text-lg p-4 border-b border-gray-100">Expiring Documents</h3>
      <table className="w-full text-left text-sm">
         <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
               <th className="px-5 py-3">Car Name</th>
               <th className="px-5 py-3">Document</th>
               <th className="px-5 py-3">Expiry Date</th>
               <th className="px-5 py-3">Status</th>
               <th className="px-5 py-3 text-right">Action</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-gray-100">
            {DOCUMENT_ALERTS.map(doc => (
               <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{doc.car}</td>
                  <td className="px-5 py-3 flex items-center gap-2">
                     <MdDescription className="text-gray-400" /> {doc.doc}
                  </td>
                  <td className="px-5 py-3 font-mono">{doc.expiry}</td>
                  <td className="px-5 py-3">
                     <span className={`text-xs font-bold px-2 py-1 rounded-full
                        ${doc.status === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {doc.status}
                     </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                     <button className="text-blue-600 font-semibold text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">Renew</button>
                  </td>
               </tr>
            ))}
         </tbody>
      </table>
   </div>
);

const CarsPage = () => {
  const [activeTab, setActiveTab] = useState('Fleet'); // Fleet, Timeline, Accidents, Documents
  const [timelineRange, setTimelineRange] = useState('Last 30 Days');

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
         {['Fleet', 'Timeline', 'Accidents', 'Documents'].map(tab => (
            <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                  ${activeTab === tab 
                     ? 'bg-gray-800 text-white shadow-md' 
                     : 'text-gray-500 hover:bg-gray-100'}`}
            >
               {tab === 'Fleet' && <MdDirectionsCar />}
               {tab === 'Timeline' && <MdTimeline />}
               {tab === 'Accidents' && <MdWarning />}
               {tab === 'Documents' && <MdDescription />}
               {tab}
            </button>
         ))}
      </div>

      {/* Content */}
      <motion.div
         key={activeTab}
         initial={{ opacity: 0, x: -10 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ duration: 0.2 }}
      >
         {activeTab === 'Fleet' && <FleetView />}
         {activeTab === 'Timeline' && <TimelineView timelineRange={timelineRange} setTimelineRange={setTimelineRange} />}
         {activeTab === 'Accidents' && <AccidentsView />}
         {activeTab === 'Documents' && <DocsView />}
      </motion.div>
    </div>
  );
};


export default CarsPage;
