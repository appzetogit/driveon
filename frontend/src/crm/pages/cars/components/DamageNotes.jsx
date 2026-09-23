import React from 'react';
import { MdEdit, MdAttachMoney, MdBuild, MdNotes } from 'react-icons/md';

const DamageNotes = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div>
           <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MdAttachMoney className="text-green-600" size={18} />
              Repair Estimate
           </h3>
           <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{data.estCost}</span>
                <span className="text-sm text-gray-500 mb-1">Total w/ Tax</span>
           </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MdBuild className="text-indigo-600" size={18} />
                Assigned Garage
            </h3>
            <p className="font-medium text-gray-900">{data.garage}</p>
            <p className="text-sm text-gray-500">{data.garageContact}</p>
        </div>

        <div className="border-t border-gray-100 pt-4">
             <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MdNotes className="text-gray-400" size={18} />
                Admin Notes
            </h3>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800 italic">
                "{data.description}"
            </div>
            <button className="flex items-center gap-1 text-indigo-600 text-xs font-bold mt-2 hover:underline">
                <MdEdit size={14} /> Edit Notes
            </button>
        </div>
    </div>
  );
};

export default DamageNotes;
