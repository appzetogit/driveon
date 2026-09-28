import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdSearch, 
  MdAdd, 
  MdError,
  MdRefresh,
  MdDirectionsCar
} from 'react-icons/md';
import api from '../../../services/api';
import ThemedDropdown from '../../components/ThemedDropdown';

const AccidentActiveCases = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('Severity: All');
    const [activeCases, setActiveCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alertCount, setAlertCount] = useState(0);

    const fetchActiveCases = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/crm/accidents', { params: { status: 'Active' } });
            if (res.data?.success && res.data?.data?.cases) {
                setActiveCases(res.data.data.cases);
                // Count cases reported today or major severity
                const highAlerts = res.data.data.cases.filter(c => c.severity === 'Major').length;
                setAlertCount(highAlerts);
            } else {
                setActiveCases([]);
                setAlertCount(0);
            }
        } catch (error) {
            console.error('Failed to load active accident cases:', error);
            setActiveCases([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveCases();
    }, [fetchActiveCases]);

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'Major': return 'bg-red-50 text-red-700 border-red-200';
            case 'Medium': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'Minor': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const filteredAccidents = activeCases.filter(item => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        const carName = item.car ? `${item.car.brand || ''} ${item.car.model || ''}`.toLowerCase() : '';
        const reg = (item.car?.registrationNumber || item.driverLicenseNo || '').toLowerCase();
        const location = (item.incidentLocation || '').toLowerCase();
        const driver = (item.driverName || '').toLowerCase();

        const matchesSearch = !cleanSearch || 
            carName.includes(cleanSearch) || 
            reg.includes(cleanSearch) || 
            location.includes(cleanSearch) ||
            driver.includes(cleanSearch);

        const cleanSeverity = severityFilter.replace('Severity: ', '');
        const matchesSeverity = cleanSeverity === 'All' || item.severity === cleanSeverity;

        return matchesSearch && matchesSeverity;
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
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/accidents/active')}>Accidents</span> 
              <span>/</span> 
              <span className="text-gray-800 font-medium">Active</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Active Accident Cases</h1>
            <p className="text-gray-500 text-sm">Track and manage ongoing accident claims and repairs.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchActiveCases}
              className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm"
              title="Refresh"
            >
              <MdRefresh size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => navigate('/crm/cars/accidents/add')}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium shadow-sm hover:bg-red-700 transition-colors"
            >
              <MdAdd size={20} />
              Report New Case
            </button>
          </div>
        </div>
  
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search car, registration, driver, location..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                />
            </div>
            <div className="flex gap-3">
               <ThemedDropdown
                 options={['Severity: All', 'Severity: Major', 'Severity: Medium', 'Severity: Minor']}
                 value={severityFilter}
                 onChange={(val) => setSeverityFilter(val)}
                 className="bg-white text-sm"
                 width="w-44"
               />
            </div>
        </div>

        {/* Alerts */}
        {alertCount > 0 && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
              <MdError className="text-red-500 mt-0.5 shrink-0" size={20} />
              <div>
                  <h4 className="text-sm font-bold text-red-800">Critical Priority Alerts</h4>
                  <p className="text-xs text-red-600 mt-0.5">{alertCount} Major severity case(s) currently open requiring active coordination.</p>
              </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500 font-medium">Loading active accident cases...</p>
          </div>
        ) : (
          /* Cards Content */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccidents.map((item, index) => {
              const carTitle = item.car ? `${item.car.brand} ${item.car.model}` : 'Vehicle';
              const regNumber = item.car?.registrationNumber || item.driverLicenseNo || 'N/A';
              const displayImage = item.evidence?.[0]?.url || item.car?.images?.[0]?.url;
              const formattedDate = item.incidentDate ? new Date(item.incidentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'N/A';

              return (
                <div 
                    key={item._id || item.id} 
                    onClick={() => navigate(`/crm/cars/accidents/${item._id || item.id}`)}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                   {/* Car / Evidence Image */}
                   <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                       {displayImage ? (
                         <img src={displayImage} alt={carTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       ) : (
                         <div className="text-gray-300 flex flex-col items-center">
                           <MdDirectionsCar size={48} />
                           <span className="text-xs mt-1">No Image Available</span>
                         </div>
                       )}
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
                               <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{carTitle}</h3>
                               <p className="text-sm font-mono text-gray-500 font-medium">{regNumber}</p>
                           </div>
                       </div>
                       
                       <div className="space-y-3 mt-4">
                           <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                               <span className="text-gray-500">Incident Date</span>
                               <span className="font-medium text-gray-800">{formattedDate}</span>
                           </div>
                           <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                               <span className="text-gray-500">Location</span>
                               <span className="font-medium text-gray-800 truncate max-w-[180px]" title={item.incidentLocation}>{item.incidentLocation || 'N/A'}</span>
                           </div>
                           <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                               <span className="text-gray-500">Driver</span>
                               <span className="font-medium text-gray-800 truncate max-w-[180px]">{item.driverName || 'N/A'}</span>
                           </div>
                           <div className="flex items-center justify-between text-sm pt-1">
                               <span className="text-gray-500">Current Status</span>
                               <span className="font-bold text-indigo-600">{item.status}</span>
                           </div>
                       </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredAccidents.length === 0 && (
            <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                <p className="font-bold text-gray-700">No active accident cases found</p>
                <p className="text-xs text-gray-400 mt-1">There are no ongoing accident cases matching "{searchTerm}"</p>
            </div>
        )}
      </div>
    );
};

export default AccidentActiveCases;
