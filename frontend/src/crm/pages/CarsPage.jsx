import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MdDirectionsCar, 
  MdWarning, 
  MdBuild, 
  MdDescription, 
  MdTimeline, 
  MdAdd, 
  MdCheckCircle,
  MdRefresh
} from 'react-icons/md';
import api from '../../services/api';
import ThemedDropdown from '../components/ThemedDropdown';

// SUB-COMPONENT: Fleet Grid
const FleetView = ({ cars, loading, onSelectCarForTimeline }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500 font-medium">Loading fleet vehicles...</p>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="p-16 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-200">
        <MdDirectionsCar size={48} className="mx-auto text-gray-300 mb-2" />
        <p className="font-bold text-gray-700">No cars found in fleet</p>
        <p className="text-xs text-gray-400 mt-1">Add cars in the fleet management module</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
       {cars.map(car => {
          const carTitle = `${car.brand || ''} ${car.model || ''}`.trim() || 'Vehicle';
          const plate = car.registrationNumber || 'N/A';
          const imageUrl = car.images?.[0]?.url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&q=80';
          const isAvailable = car.isAvailable !== false;
          const status = car.status === 'in_repair' || car.status === 'maintenance' 
            ? 'Maintenance' 
            : isAvailable 
              ? 'Available' 
              : 'On Trip';

          return (
            <div key={car._id || car.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-lg transition-all flex flex-col">
               {/* Image & Status Tag */}
               <div className="h-44 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  <img src={imageUrl} alt={carTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3">
                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                        status === 'Available' ? 'bg-emerald-500 text-white' : 
                        status === 'On Trip' ? 'bg-blue-500 text-white' : 
                        'bg-amber-500 text-white'
                     }`}>
                        {status}
                     </span>
                  </div>
               </div>
               
               {/* Content */}
               <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 truncate text-base">{carTitle}</h3>
                    <p className="text-xs text-gray-500 font-mono mb-3">{plate}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                       <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
                          <span className="block text-gray-400 text-[10px] uppercase font-bold mb-0.5">Rate</span>
                          <span className="font-bold text-gray-800">
                             ₹{(car.pricePerDay || 0).toLocaleString('en-IN')}/d
                          </span>
                       </div>
                       <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
                          <span className="block text-gray-400 text-[10px] uppercase font-bold mb-0.5">Fuel / Type</span>
                          <span className="font-bold text-gray-700 capitalize truncate block">
                             {car.fuelType || car.carType || 'Standard'}
                          </span>
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                     <button 
                        onClick={() => onSelectCarForTimeline(car)}
                        className="flex-1 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                     >
                        View Lifecycle
                     </button>
                     <button 
                        onClick={() => navigate('/crm/garage/active')}
                        className="px-3 py-2 text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-gray-800 transition-colors border border-gray-200"
                        title="Open Repairs / Garage"
                     >
                        <MdBuild size={16} />
                     </button>
                  </div>
               </div>
            </div>
          );
       })}
    </div>
  );
};

// SUB-COMPONENT: Timeline Visual
const TimelineView = ({ cars, selectedCar, setSelectedCar, timelineRange, setTimelineRange }) => {
  const activeCar = selectedCar || cars[0];
  const carName = activeCar ? `${activeCar.brand} ${activeCar.model}` : 'Vehicle';
  const regNumber = activeCar?.registrationNumber || 'Fleet Unit';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{carName} Lifecycle</h3>
            <p className="text-xs text-gray-500 font-mono">{regNumber}</p>
          </div>
          <div className="flex items-center gap-3">
             {cars.length > 1 && (
               <select
                 value={activeCar?._id || ''}
                 onChange={(e) => {
                   const found = cars.find(c => c._id === e.target.value);
                   if (found) setSelectedCar(found);
                 }}
                 className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer"
               >
                 {cars.map(c => (
                   <option key={c._id} value={c._id}>
                     {c.brand} {c.model} ({c.registrationNumber})
                   </option>
                 ))}
               </select>
             )}
             <ThemedDropdown
                options={['Last 30 Days', 'All Time']}
                value={timelineRange}
                onChange={(val) => setTimelineRange(val)}
                className="bg-gray-50 text-xs font-bold"
                width="w-36"
             />
          </div>
       </div>
       
       {/* Timeline Chain Visual */}
       <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 w-full pt-4">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-[44px] left-8 right-8 h-1 bg-gray-200 z-0"></div>

          {/* Event 1 */}
          <div className="relative z-10 flex flex-col items-center text-center w-full md:w-auto">
             <div className="w-14 h-14 rounded-full bg-emerald-100 border-4 border-white shadow-sm flex items-center justify-center text-emerald-600 mb-2">
                <MdDirectionsCar size={24} />
             </div>
             <p className="font-bold text-sm text-gray-900">Registered</p>
             <p className="text-xs text-gray-400 font-medium">Verified in Fleet</p>
             <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-100">
               Active
             </span>
          </div>

          {/* Event 2 */}
          <div className="relative z-10 flex flex-col items-center text-center w-full md:w-auto">
             <div className="w-14 h-14 rounded-full bg-blue-100 border-4 border-white shadow-sm flex items-center justify-center text-blue-600 mb-2">
                <MdTimeline size={24} />
             </div>
             <p className="font-bold text-sm text-gray-900">Rental Operations</p>
             <p className="text-xs text-gray-400 font-medium">Customer Trips</p>
             <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mt-1 border border-blue-100">
               Rate: ₹{(activeCar?.pricePerDay || 0).toLocaleString('en-IN')}/d
             </span>
          </div>

          {/* Event 3 */}
          <div className="relative z-10 flex flex-col items-center text-center w-full md:w-auto">
             <div className="w-14 h-14 rounded-full bg-amber-100 border-4 border-white shadow-sm flex items-center justify-center text-amber-600 mb-2">
                <MdBuild size={24} />
             </div>
             <p className="font-bold text-sm text-gray-900">Maintenance Check</p>
             <p className="text-xs text-gray-400 font-medium">Periodic Inspection</p>
             <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 border border-amber-100">
               Up to date
             </span>
          </div>

          {/* Event 4 */}
          <div className="relative z-10 flex flex-col items-center text-center w-full md:w-auto">
             <div className="w-14 h-14 rounded-full bg-indigo-100 border-4 border-white shadow-sm flex items-center justify-center text-indigo-600 mb-2">
                <MdCheckCircle size={24} />
             </div>
             <p className="font-bold text-sm text-gray-900">Current Status</p>
             <p className="text-xs text-gray-400 font-medium">Road Ready</p>
             <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 border border-indigo-100">
               {activeCar?.isAvailable ? 'Available' : 'Assigned'}
             </span>
          </div>
       </div>
    </div>
  );
};

// SUB-COMPONENT: Accidents List
const AccidentsView = ({ accidents, loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-500 font-medium">Loading accident logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 font-medium">{accidents.length} Accident record(s) on file</p>
          <button 
             onClick={() => navigate('/crm/cars/accidents/add')}
             className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm"
          >
             <MdAdd size={16} /> Report New Accident
          </button>
       </div>
       
       {accidents.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-100">
             <MdCheckCircle size={40} className="mx-auto text-emerald-400 mb-2" />
             <p className="font-bold text-gray-700">No accident records found</p>
             <p className="text-xs text-gray-400 mt-1">Fleet has no active or reported accident damage</p>
          </div>
       ) : (
          <div className="grid gap-4">
             {accidents.map(acc => {
                const carTitle = acc.car ? `${acc.car.brand} ${acc.car.model}` : 'Vehicle';
                const formattedDate = acc.incidentDate ? new Date(acc.incidentDate).toLocaleDateString('en-IN', {
                   day: 'numeric',
                   month: 'short',
                   year: 'numeric'
                }) : 'N/A';

                return (
                   <div key={acc._id || acc.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                            <MdWarning size={24} />
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900 text-base">{carTitle}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                               Date: {formattedDate} • Severity: <span className="font-bold text-rose-600">{acc.severity}</span>
                               {acc.incidentLocation ? ` • ${acc.incidentLocation}` : ''}
                            </p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-5 self-end md:self-auto">
                         <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Est. Cost</p>
                            <p className="font-bold text-gray-900 font-mono text-sm">₹{(acc.estimatedCost || 0).toLocaleString('en-IN')}</p>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            acc.status === 'Active' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                         }`}>
                            {acc.status}
                         </span>
                         <button 
                            onClick={() => navigate(`/crm/cars/accidents/${acc._id || acc.id}`)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                         >
                            Details →
                         </button>
                      </div>
                   </div>
                );
             })}
          </div>
       )}
    </div>
  );
};

// SUB-COMPONENT: Documents View
const DocsView = ({ cars, loading }) => {
  const alerts = [];
  const now = new Date();

  cars.forEach(car => {
    const carTitle = `${car.brand} ${car.model} (${car.registrationNumber || 'N/A'})`;

    if (car.insuranceExpiry) {
      const exp = new Date(car.insuranceExpiry);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 30) {
        alerts.push({
          id: `${car._id}-ins`,
          car: carTitle,
          doc: 'Insurance Policy',
          expiry: exp.toLocaleDateString('en-IN'),
          status: diffDays <= 7 ? 'Critical' : 'Warning'
        });
      }
    } else {
      alerts.push({
        id: `${car._id}-ins-none`,
        car: carTitle,
        doc: 'Insurance Policy',
        expiry: 'Missing / Unset',
        status: 'Warning'
      });
    }

    if (car.pucExpiry) {
      const exp = new Date(car.pucExpiry);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 15) {
        alerts.push({
          id: `${car._id}-puc`,
          car: carTitle,
          doc: 'PUC Certificate',
          expiry: exp.toLocaleDateString('en-IN'),
          status: diffDays <= 3 ? 'Critical' : 'Warning'
        });
      }
    }
  });

  return (
     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <h3 className="font-bold text-base text-gray-900">Vehicle Compliance & Document Expiry</h3>
           <span className="text-xs font-semibold text-gray-500">{alerts.length} Pending Actions</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Checking document records...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
             <MdCheckCircle size={36} className="mx-auto text-emerald-400 mb-2" />
             <p className="font-bold text-gray-700">All vehicle compliance documents are active</p>
             <p className="text-xs text-gray-400 mt-1">No insurance or certificate expiration alerts at this time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                     <th className="px-5 py-3.5">Car Identifier</th>
                     <th className="px-5 py-3.5">Document Type</th>
                     <th className="px-5 py-3.5">Status / Expiry</th>
                     <th className="px-5 py-3.5 text-center">Priority</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {alerts.map(doc => (
                     <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-800 text-sm">{doc.car}</td>
                        <td className="px-5 py-3.5 flex items-center gap-2 text-gray-600">
                           <MdDescription className="text-gray-400" size={18} /> {doc.doc}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-gray-700 text-xs">{doc.expiry}</td>
                        <td className="px-5 py-3.5 text-center">
                           <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              doc.status === 'Critical' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                           }`}>
                              {doc.status}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
        )}
     </div>
  );
};

const CarsPage = () => {
  const [activeTab, setActiveTab] = useState('Fleet'); // Fleet, Timeline, Accidents, Documents
  const [timelineRange, setTimelineRange] = useState('Last 30 Days');
  const [selectedCar, setSelectedCar] = useState(null);

  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(false);

  const [accidents, setAccidents] = useState([]);
  const [accidentsLoading, setAccidentsLoading] = useState(false);

  const fetchCars = useCallback(async () => {
    try {
      setCarsLoading(true);
      const res = await api.get('/cars');
      if (res.data?.success && res.data?.data?.cars) {
        setCars(res.data.data.cars);
        if (!selectedCar && res.data.data.cars.length > 0) {
          setSelectedCar(res.data.data.cars[0]);
        }
      } else {
        setCars([]);
      }
    } catch (err) {
      console.error('Failed to load fleet cars:', err);
      setCars([]);
    } finally {
      setCarsLoading(false);
    }
  }, [selectedCar]);

  const fetchAccidents = useCallback(async () => {
    try {
      setAccidentsLoading(true);
      const res = await api.get('/crm/accidents');
      if (res.data?.success && res.data?.data?.cases) {
        setAccidents(res.data.data.cases);
      } else {
        setAccidents([]);
      }
    } catch (err) {
      console.error('Failed to load accident logs:', err);
      setAccidents([]);
    } finally {
      setAccidentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCars();
    fetchAccidents();
  }, [fetchCars, fetchAccidents]);

  const handleSelectCarForTimeline = (car) => {
    setSelectedCar(car);
    setActiveTab('Timeline');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Operations</h1>
          <p className="text-xs text-gray-500">Live fleet inventory, compliance & accident records</p>
        </div>
        <button
          onClick={() => { fetchCars(); fetchAccidents(); }}
          className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-2 text-xs font-bold"
        >
          <MdRefresh size={16} className={carsLoading || accidentsLoading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-200">
         {['Fleet', 'Timeline', 'Accidents', 'Documents'].map(tab => (
            <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === tab 
                     ? 'bg-[#1C205C] text-white shadow-md' 
                     : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
               }`}
            >
               {tab === 'Fleet' && <MdDirectionsCar size={16} />}
               {tab === 'Timeline' && <MdTimeline size={16} />}
               {tab === 'Accidents' && <MdWarning size={16} />}
               {tab === 'Documents' && <MdDescription size={16} />}
               {tab}
            </button>
         ))}
      </div>

      {/* Content */}
      <motion.div
         key={activeTab}
         initial={{ opacity: 0, y: 8 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.2 }}
      >
         {activeTab === 'Fleet' && (
           <FleetView 
             cars={cars} 
             loading={carsLoading} 
             onSelectCarForTimeline={handleSelectCarForTimeline} 
           />
         )}
         {activeTab === 'Timeline' && (
           <TimelineView 
             cars={cars} 
             selectedCar={selectedCar} 
             setSelectedCar={setSelectedCar} 
             timelineRange={timelineRange} 
             setTimelineRange={setTimelineRange} 
           />
         )}
         {activeTab === 'Accidents' && (
           <AccidentsView 
             accidents={accidents} 
             loading={accidentsLoading} 
           />
         )}
         {activeTab === 'Documents' && (
           <DocsView 
             cars={cars} 
             loading={carsLoading} 
           />
         )}
      </motion.div>
    </div>
  );
};

export default CarsPage;
