import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdSearch, 
  MdCheckCircle,
  MdCalendarToday,
  MdRefresh
} from 'react-icons/md';
import api from '../../../services/api';
import ThemedDropdown from '../../components/ThemedDropdown';

const AccidentClosedCases = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState('Year: All');
    const [allCases, setAllCases] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchClosedCases = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/crm/accidents');
            if (res.data?.success && res.data?.data?.cases) {
                // Filter only closed / settled cases
                const closed = res.data.data.cases.filter(
                    c => c.status === 'Settled' || c.status === 'Full Recovery'
                );
                setAllCases(closed);
            } else {
                setAllCases([]);
            }
        } catch (error) {
            console.error('Failed to load closed accident cases:', error);
            setAllCases([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClosedCases();
    }, [fetchClosedCases]);

    const filteredCases = allCases.filter(item => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        const carName = item.car ? `${item.car.brand || ''} ${item.car.model || ''}`.toLowerCase() : '';
        const reg = (item.car?.registrationNumber || item.driverLicenseNo || '').toLowerCase();
        const location = (item.incidentLocation || '').toLowerCase();

        const matchesSearch = !cleanSearch ||
            carName.includes(cleanSearch) || 
            reg.includes(cleanSearch) ||
            location.includes(cleanSearch);

        // Year filter
        const incidentYear = item.incidentDate ? new Date(item.incidentDate).getFullYear().toString() : '';
        const cleanYear = yearFilter.replace('Year: ', '');
        const matchesYear = cleanYear === 'All' || incidentYear === cleanYear;

        return matchesSearch && matchesYear;
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
              <span className="text-gray-800 font-medium">Closed Cases</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Closed & Settled Cases</h1>
            <p className="text-gray-500 text-sm">History of resolved accidents and financial settlements.</p>
          </div>
          <button
            onClick={fetchClosedCases}
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 shadow-sm flex items-center gap-2 text-sm font-medium"
          >
            <MdRefresh size={18} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
  
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search Vehicle or Reg No..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                />
            </div>
            <div className="flex gap-3">
               <div className="relative">
                   <MdCalendarToday className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <ThemedDropdown
                     options={['Year: All', 'Year: 2026', 'Year: 2025', 'Year: 2024']}
                     value={yearFilter}
                     onChange={(val) => setYearFilter(val)}
                     className="bg-white text-sm"
                     width="w-40"
                   />
               </div>
            </div>
        </div>
  
        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500 font-medium">Loading closed cases...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Incident Date</th>
                    <th className="p-4 text-right">Final Cost</th>
                    <th className="p-4 text-right">Recovered</th>
                    <th className="p-4 text-right">Net Loss</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredCases.map((item) => {
                    const carTitle = item.car ? `${item.car.brand} ${item.car.model}` : 'Vehicle';
                    const regNumber = item.car?.registrationNumber || item.driverLicenseNo || 'N/A';
                    const incidentDate = item.incidentDate ? new Date(item.incidentDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : 'N/A';
                    const finalCost = item.finalCost || 0;
                    const recovered = item.recoveredAmount || 0;
                    const netLoss = item.netLoss !== undefined ? item.netLoss : Math.max(0, finalCost - recovered);

                    return (
                      <tr 
                        key={item._id || item.id} 
                        onClick={() => navigate(`/crm/cars/accidents/${item._id || item.id}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{carTitle}</div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">{regNumber}</div>
                        </td>
                        <td className="p-4 text-gray-600 font-medium">
                           {incidentDate}
                        </td>
                        <td className="p-4 font-bold text-gray-900 text-right font-mono">
                           ₹{finalCost.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 font-bold text-emerald-600 text-right font-mono">
                           ₹{recovered.toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 text-right font-mono">
                           <span className={`font-bold ${netLoss <= 0 ? 'text-gray-400' : 'text-rose-600'}`}>
                               ₹{netLoss.toLocaleString('en-IN')}
                           </span>
                        </td>
                        <td className="p-4 text-center">
                           <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                               <MdCheckCircle className="text-emerald-500" />
                               <span>{item.status}</span>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredCases.length === 0 && (
            <div className="p-12 text-center text-gray-500">
                <p className="font-bold text-gray-700">No closed cases found</p>
                <p className="text-xs text-gray-400 mt-1">Settled or recovered cases will be recorded here</p>
            </div>
          )}
        </div>
      </div>
    );
};

export default AccidentClosedCases;
