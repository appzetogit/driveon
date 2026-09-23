import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdFolderOpen,
  MdWarning,
  MdSearch,
  MdAdd,
  MdFilterList,
  MdDirectionsCar,
  MdLocalGasStation,
  MdSettings,
  MdVisibility,
  MdMoreVert,
  MdRefresh,
  MdLocationOn,
  MdAccessTime,
  MdCheckCircle,
  MdTimer,
  MdLocalParking,
  MdPlayArrow,
  MdHistory,
  MdBuild,

  MdHealthAndSafety,
  MdSpeed,
  MdDescription,
  MdFileUpload,
  MdDateRange,
  MdError,
  MdPerson,
  MdDriveEta,
  MdCloudUpload,
  MdImage,
  MdPolicy,
  MdMoneyOff,
  MdGavel,
  MdLocalShipping,
  MdCall,
  MdAutorenew,
  MdFolderOff,
  MdClose,
  MdAttachMoney
} from 'react-icons/md';
import { premiumColors } from '../../../theme/colors';
import { rgba } from 'polished';
import ThemedDropdown from '../../components/ThemedDropdown';

// Mock Data for Cars
const MOCK_CARS_DATA = [
  { id: 1, name: "Toyota Innova Crysta", plate: "PB 01 1234", type: "SUV", fuel: "Diesel", seats: "7 Seater", price: "₹ 2,500", status: "Active", trips: 45, image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/115025/innova-crysta-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80" },
  { id: 2, name: "Mahindra Thar", plate: "PB 65 9876", type: "SUV", fuel: "Diesel", seats: "4 Seater", price: "₹ 3,000", status: "Maintenance", trips: 12, image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/40087/thar-exterior-right-front-three-quarter-11.jpeg?q=80" },
  { id: 3, name: "Maruti Swift Dzire", plate: "PB 10 5678", type: "Sedan", fuel: "CNG", seats: "5 Seater", price: "₹ 1,200", status: "Active", trips: 89, image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/45691/dzire-exterior-right-front-three-quarter-3.jpeg?q=80" },
  { id: 4, name: "Hyundai Creta", plate: "PB 08 4321", type: "SUV", fuel: "Petrol", seats: "5 Seater", price: "₹ 2,000", status: "Active", trips: 34, image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/141115/creta-exterior-right-front-three-quarter.jpeg?isig=0&q=80" },
];

/**
 * Generic Placeholder for Car Sub-Pages
 */
const CarPlaceholder = ({ title, subtitle, isAccident = false }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
      </div>

      <div className={`bg-white rounded-xl border-2 border-dashed ${isAccident ? 'border-red-300' : 'border-gray-300'} p-10 flex flex-col items-center justify-center text-center min-h-[400px]`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isAccident ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
          {isAccident ? <MdWarning size={40} /> : <MdFolderOpen size={40} />}
        </div>
        <h3 className="text-xl font-semibold text-gray-700">Module: {title}</h3>
        <p className="text-gray-500 max-w-sm mt-2">
          Features for "{title}" will be implemented here. {isAccident ? 'This is a critical module for accident tracking.' : ''}
        </p>
      </div>
    </div>
  );
};

const SimpleModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <MdClose size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AllCarsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);

  const handleViewCar = (car) => {
    setSelectedCar(car);
    setIsViewModalOpen(true);
    setOpenActionMenu(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-100">Active</span>;
      case 'Maintenance': return <span className="px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-bold border border-red-100">Maintenance</span>;
      case 'Idle': return <span className="px-2 py-1 rounded bg-gray-50 text-gray-600 text-xs font-bold border border-gray-100">Idle</span>;
      default: return <span className="px-2 py-1 rounded bg-gray-50 text-gray-700 text-xs font-bold border border-gray-100">{status}</span>;
    }
  };

  const filteredCars = MOCK_CARS_DATA.filter(car => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = car.name.toLowerCase().includes(cleanSearch) ||
      car.plate.toLowerCase().includes(cleanSearch);
    const matchesStatus = statusFilter === 'All' || car.status === statusFilter;
    const matchesType = typeFilter === 'All' || car.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span> 
              <span>/</span> 
              <span className="hover:text-[#1c205c] cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/all')}>Cars</span> 
              <span>/</span> 
              <span className="text-gray-800 font-medium">All Cars</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Inventory</h1>
            <p className="text-gray-500 text-sm">Manage your entire fleet and viewing details.</p>
          </div>
          </div>
  
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search Make, Model, Plate..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{ focusRingColor: rgba(premiumColors.primary.DEFAULT, 0.2), borderColor: 'transparent' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
               <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] transition-all cursor-pointer"
               >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Idle">Idle</option>
               </select>
               <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c205c]/20 focus:border-[#1c205c] transition-all cursor-pointer"
               >
                  <option value="All">All Types</option>
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
               </select>
            </div>
        </div>
  
        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4 w-24">Image</th>
                <th className="p-4">Car Details</th>
                <th className="p-4">Reg No</th>
                <th className="p-4">Price/Day</th>
                <th className="p-4">Status & Trips</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredCars.map((car) => (
                <tr key={car.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <img src={car.image} alt={car.name} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{car.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                       <span>{car.fuel}</span> • <span>{car.type}</span> • <span>{car.seats}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-gray-600 font-medium">
                    {car.plate}
                  </td>
                  <td className="p-4 font-bold text-gray-800">
                    {car.price}
                  </td>
                  <td className="p-4">
                     <div className="flex flex-col items-start gap-1">
                        {getStatusBadge(car.status)}
                        <span className="text-[10px] text-gray-400 font-semibold">{car.trips} Trips Completed</span>
                     </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="relative">
                      <button 
                          onClick={() => setOpenActionMenu(openActionMenu === car.id ? null : car.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                          <MdMoreVert size={18} />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openActionMenu === car.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                          <button 
                            onClick={() => handleViewCar(car)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#1c205c]/10 hover:text-[#1c205c] transition-colors flex items-center gap-2"
                          >
                            <MdVisibility size={16} /> View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCars.length === 0 && (
             <div className="p-10 text-center text-gray-500">No cars found matching your filters.</div>
          )}
        </div>

        {/* View Car Details Modal */}
        <SimpleModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Vehicle Details">
          {selectedCar && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <img src={selectedCar.image} alt={selectedCar.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{selectedCar.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{selectedCar.plate}</p>
                </div>
                {getStatusBadge(selectedCar.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Vehicle Type</p>
                  <p className="text-sm font-medium text-gray-800">{selectedCar.type}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Fuel Type</p>
                  <p className="text-sm font-medium text-gray-800">{selectedCar.fuel}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Seating</p>
                  <p className="text-sm font-medium text-gray-800">{selectedCar.seats}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Price/Day</p>
                  <p className="text-sm font-bold text-[#1c205c]">{selectedCar.price}</p>
                </div>
              </div>
              
              <div className="bg-[#1c205c]/10 p-4 rounded-lg border border-[#1c205c]/20">
                <p className="text-xs text-[#1c205c] font-bold uppercase mb-1">Total Trips</p>
                <p className="text-2xl font-bold text-[#1c205c]">{selectedCar.trips} Completed</p>
              </div>

              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="w-full py-2.5 bg-[#1c205c] text-white rounded-xl font-bold hover:bg-[#252d6d] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </SimpleModal>

    </div>
  );
};

// Mock Data for Idle Cars
const MOCK_IDLE_CARS = [
  { id: 1, car: "Maruti Swift Dzire", reg: "PB 10 5678", location: "Office HQ", idleFor: "2 Days", condition: "Good" },
  { id: 2, car: "Hyundai Creta", reg: "PB 08 4321", location: "Airport Yard", idleFor: "1 Day", condition: "Needs Wash" },
  { id: 3, car: "Toyota Etios", reg: "PB 01 9988", location: "Sector 17", idleFor: "5 Hours", condition: "Fuel Low" },
];

export const IdleCarsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('Walk-in Customer');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'Good': return <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-bold border border-green-100">Good</span>;
      case 'Needs Wash': return <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">Needs Wash</span>;
      case 'Fuel Low': return <span className="px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-bold border border-red-100">Fuel Low</span>;
      default: return <span className="px-2 py-1 rounded bg-gray-50 text-gray-700 text-xs font-bold border border-gray-100">{condition}</span>;
    }
  };

  const filteredIdleCars = MOCK_IDLE_CARS.filter(item => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = item.car.toLowerCase().includes(cleanSearch) ||
      item.reg.toLowerCase().includes(cleanSearch);
    const matchesLocation = locationFilter === 'All' || item.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span> 
              <span>/</span> 
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/all')}>Cars</span> 
              <span>/</span> 
              <span className="text-gray-800 font-medium">Idle Cars</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Idle Inventory</h1>
            <p className="text-gray-500 text-sm">Vehicles available for immediate booking.</p>
          </div>
        </div>
  
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search Vehicle..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                />
            </div>
            <div className="flex gap-3">
               <ThemedDropdown 
                 options={['All', 'Office HQ', 'Airport Yard', 'Sector 17']}
                 value={locationFilter}
                 onChange={(val) => setLocationFilter(val)}
                 className="bg-white text-sm"
                 width="w-40"
               />
            </div>
        </div>
  
        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4">Vehicle Details</th>
                <th className="p-4">Parked At</th>
                <th className="p-4">Idle Duration</th>
                <th className="p-4">Condition</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredIdleCars.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{item.car}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.reg}</div>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-1.5 text-gray-700">
                        <MdLocalParking className="text-gray-400" size={16} /> {item.location}
                     </div>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <MdTimer className="text-orange-400" size={16} /> {item.idleFor}
                     </div>
                  </td>
                  <td className="p-4">
                     {getConditionBadge(item.condition)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                        onClick={() => setIsBookingModalOpen(true)}
                        className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-indigo-600 text-white border border-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <MdPlayArrow size={16} /> Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredIdleCars.length === 0 && (
             <div className="p-10 text-center text-gray-500">No idle cars found matching your filters.</div>
          )}
        </div>

      {/* Booking Modal */}
      <SimpleModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="Create Fast Booking">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer</label>
            <ThemedDropdown 
              options={['Walk-in Customer', 'Rahul Sharma (Returning)']}
              value={selectedCustomer}
              onChange={(val) => setSelectedCustomer(val)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
            <ThemedDropdown 
              options={MOCK_IDLE_CARS.map(car => `${car.car} - ${car.reg}`)}
              value={selectedVehicle || `${MOCK_IDLE_CARS[0]?.car} - ${MOCK_IDLE_CARS[0]?.reg}`}
              onChange={(val) => setSelectedVehicle(val)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
          <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors" style={{ backgroundColor: premiumColors.primary.DEFAULT }}>
            Confirm Booking
          </button>
        </div>
      </SimpleModal>
    </div>
  );
};




// Accident Pages - Mock Data
const MOCK_ACCIDENTS = [
  {
    id: 1,
    car: "Toyota Innova Crysta",
    reg: "PB 01 1234",
    date: "26 Dec 2025",
    location: "Delhi-Agra Hwy",
    severity: "Major",
    status: "In Repair",
    image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/115025/innova-crysta-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80"
  },
  {
    id: 2,
    car: "Mahindra Thar",
    reg: "PB 65 9876",
    date: "20 Dec 2025",
    location: "Manali, HP",
    severity: "Medium",
    status: "Survey Pending",
    image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/40087/thar-exterior-right-front-three-quarter-11.jpeg?q=80"
  },
  {
    id: 3,
    car: "Maruti Swift Dzire",
    reg: "PB 10 5678",
    date: "15 Dec 2025",
    location: "Chandigarh",
    severity: "Minor",
    status: "Reported",
    image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/45691/dzire-exterior-right-front-three-quarter-3.jpeg?q=80"
  },
];

export const AccidentActivePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('Severity: All');

  const filteredAccidents = MOCK_ACCIDENTS.filter(item => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = !cleanSearch ||
      item.car.toLowerCase().includes(cleanSearch) ||
      item.reg.toLowerCase().includes(cleanSearch) ||
      item.location.toLowerCase().includes(cleanSearch);
      
    const severityVal = severityFilter.replace('Severity: ', '');
    const matchesSeverity = severityFilter === 'Severity: All' || item.severity === severityVal;
    
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Major': return 'bg-red-50 text-red-700 border-red-200';
      case 'Medium': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Minor': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span> 
              <span>/</span> 
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/all')}>Cars</span> 
              <span>/</span> 
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/accidents/active')}>Accidents</span> 
              <span>/</span> 
              <span className="text-gray-800 font-medium">Active</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Active Accident Cases</h1>
            <p className="text-gray-500 text-sm">Track and manage ongoing accident claims and repairs.</p>
          </div>
          <button 
            onClick={() => navigate('/crm/cars/accidents/add')}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium shadow-sm hover:bg-red-700 transition-colors"
          >
            <MdAdd size={20} />
            Report New Case
          </button>
        </div>
  
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search car, number..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                />
            </div>
            <div className="flex gap-3">
               <ThemedDropdown 
                 options={['Severity: All', 'Major', 'Medium', 'Minor']}
                 value={severityFilter}
                 onChange={(val) => setSeverityFilter(val)}
                 className="bg-white text-sm"
                 width="w-40"
               />
            </div>
        </div>

      {/* Alerts */}
      <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
        <MdError className="text-red-500 mt-0.5 shrink-0" size={20} />
        <div>
          <h4 className="text-sm font-bold text-red-800">Critical Alerts</h4>
          <p className="text-xs text-red-600 mt-0.5">2 New claims filed today requiring immediate surveyor approval.</p>
        </div>
      </div>

      {/* Cards Content */}
      {filteredAccidents.length === 0 ? (
        <div className="col-span-full p-10 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-100">
            No active accident cases found matching "{searchTerm}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccidents.map((item, index) => (
            <div
              key={item.id}
              onClick={() => navigate(`/crm/cars/accidents/${item.id}`)}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Car Image */}
              <div className="h-48 bg-gray-100 relative overflow-hidden">
                <img src={item.image} alt={item.car} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getSeverityColor(item.severity)}`}>
                    {item.severity} Damage
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.car}</h3>
                    <p className="text-sm font-mono text-gray-500 font-medium">{item.reg}</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Incident Date</span>
                    <span className="font-medium text-gray-800">{item.date}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Location</span>
                    <span className="font-medium text-gray-800">{item.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1">
                    <span className="text-gray-500">Current Status</span>
                    <span className="font-bold text-indigo-600">{item.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export const AccidentAddPage = () => {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState('Select a car...');
  const [severity, setSeverity] = useState('Minor (Scratches/Dents)');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>Home</span> <span>/</span> <span>Cars</span> <span>/</span> <span>Accidents</span> <span>/</span> <span className="text-gray-800 font-medium">New Report</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Report New Accident</h1>
        <p className="text-gray-500 text-sm">File a detailed incident report for insurance and repairs.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Step 1: Vehicle & Incident */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">1</span>
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
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Incident Date & Time</label>
              <div className="relative">
                <MdAccessTime className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="datetime-local" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Incident Location</label>
              <div className="relative">
                <MdLocationOn className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Enter exact location (e.g. NH-44 near Ambala)" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Driver Name</label>
              <div className="relative">
                <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Driver on duty" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Driver License No.</label>
              <div className="relative">
                <MdDriveEta className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="DL Number" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Damage Assessment */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">2</span>
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
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estimated Cost (Optional)</label>
                <div className="relative">
                  <MdAttachMoney className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Approx repair cost" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description of Incident & Damage</label>
              <textarea
                rows="4"
                placeholder="Describe how the accident happened and visible damages..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-shadow resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Step 3: Evidence */}
        <div className="p-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">3</span>
            Evidence & Photos
          </h3>

          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors group">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MdCloudUpload size={30} />
            </div>
            <h4 className="text-lg font-bold text-gray-700">Click to Upload Photos/Videos</h4>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">Upload images of all 4 sides of the car and close-ups of damaged areas.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={() => navigate('/crm/cars/accidents')}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => navigate('/crm/cars/accidents')}
            className="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center gap-2"
          >
            <MdWarning size={18} />
            Alert Admin & Save Case
          </button>
        </div>
      </div>
    </div>
  );
};




export const AccidentClosedPage = () => <CarPlaceholder title="Closed & Settled Cases" subtitle="History of resolved accidents" isAccident={true} />;
export const AccidentSummaryPage = () => <CarPlaceholder title="Loss Recovery Summary" subtitle="Financial impact analysis" isAccident={true} />;
