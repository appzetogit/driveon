import React from 'react';
import { motion } from 'framer-motion';

const DAMAGE_COLORS = {
  major: 'rgba(239, 68, 68, 0.6)', // Red-500
  medium: 'rgba(249, 115, 22, 0.6)', // Orange-500
  minor: 'rgba(234, 179, 8, 0.6)',   // Yellow-500
  normal: 'rgba(243, 244, 246, 0.5)' // Gray-100
};

const STROKE_COLORS = {
  major: '#ef4444',
  medium: '#f97316',
  minor: '#eab308',
  normal: '#6b7280' // Gray-500 for better visibility in line drawing style
};

const CarPart = ({ id, d, name, severity, onClick, transform }) => {
  const isDamaged = severity && severity !== 'normal';
  
  return (
    <motion.path
      d={d}
      id={id}
      transform={transform}
      stroke={STROKE_COLORS[severity] || STROKE_COLORS.normal}
      strokeWidth={isDamaged ? 3 : 2}
      fill={DAMAGE_COLORS[severity] || 'transparent'} // Transparent default to look like line drawing
      initial={{ opacity: 0, pathLength: 0 }}
      animate={{ 
        opacity: 1, 
        pathLength: 1,
        fill: DAMAGE_COLORS[severity] || (isDamaged ? DAMAGE_COLORS[severity] : 'rgba(255,255,255,0.1)') 
      }}
      transition={{ duration: 1 }}
      whileHover={{ 
        scale: 1.02,
        fill: isDamaged ? DAMAGE_COLORS[severity] : 'rgba(200, 200, 200, 0.2)',
        cursor: 'pointer',
        filter: "drop-shadow(0px 0px 4px rgba(0,0,0,0.3))"
      }}
      onClick={() => onClick(name)}
      style={{ originX: '50%', originY: '50%' }}
    >
        <title>{name} {severity ? `- ${severity}` : ''}</title>
    </motion.path>
  );
};

const CarDiagram = ({ damagedParts = [], onPartClick }) => {
  
  const getSeverity = (partName) => {
    // Helper to find partial matches e.g. "Front Bumper" matching "Bumper" if needed, 
    // but here we expect exact or close matches from mock data.
    const part = damagedParts.find(p => 
        p.name.toLowerCase().includes(partName.toLowerCase()) || 
        partName.toLowerCase().includes(p.name.toLowerCase())
    );
    return part ? part.severity.toLowerCase() : 'normal';
  };

  // Complex SVG Paths to mimic the reference top-down car line drawing
  // ViewBox 0 0 600 350. Car facing RIGHT.

  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-xl overflow-hidden relative select-none">
       {/* Reference Text */}
       <div className="absolute top-4 w-full flex justify-between px-10 text-xs font-bold text-gray-400 uppercase tracking-widest pointer-events-none opacity-50">
          <span>Rear</span>
          <span>Front</span>
       </div>

      <svg viewBox="0 0 600 320" className="w-[85%] h-auto drop-shadow-sm">
        
        {/* --- WHEELS (Protruding) --- */}
        {/* Rear Left */}
        <circle cx="140" cy="70" r="22" stroke="#374151" strokeWidth="2" fill="none" />
        <circle cx="140" cy="70" r="10" stroke="#374151" strokeWidth="2" fill="none" />
        
        {/* Rear Right */}
        <circle cx="140" cy="250" r="22" stroke="#374151" strokeWidth="2" fill="none" />
        <circle cx="140" cy="250" r="10" stroke="#374151" strokeWidth="2" fill="none" />

        {/* Front Left */}
        <circle cx="460" cy="70" r="22" stroke="#374151" strokeWidth="2" fill="none" />
        <circle cx="460" cy="70" r="10" stroke="#374151" strokeWidth="2" fill="none" />

        {/* Front Right */}
        <circle cx="460" cy="250" r="22" stroke="#374151" strokeWidth="2" fill="none" />
        <circle cx="460" cy="250" r="10" stroke="#374151" strokeWidth="2" fill="none" />


        {/* --- CENTRAL BODY (Stacking Order: Roof -> Windows -> Hood/Trunk) --- */}

        {/* FRONT BUMPER (Curved Cap) */}
        <CarPart
          name="Front Bumper"
          severity={getSeverity('Front Bumper')}
          onClick={onPartClick}
          d="M 520,110 C 550,110 560,130 560,160 C 560,190 550,210 520,210 C 515,210 515,110 520,110 Z"
        />

        {/* REAR BUMPER (Curved Cap) */}
        <CarPart
          name="Rear Bumper"
          severity={getSeverity('Rear Bumper')}
          onClick={onPartClick}
          d="M 80,110 C 50,110 40,130 40,160 C 40,190 50,210 80,210 C 85,210 85,110 80,110 Z"
        />

        {/* HOOD (Front Section) */}
        <CarPart
          name="Hood"
          severity={getSeverity('Hood')}
          onClick={onPartClick}
          d="M 380,100 L 515,110 C 525,160 525,160 515,210 L 380,220 C 390,160 390,160 380,100 Z"
        />

        {/* TRUNK (Rear Section) */}
        <CarPart
          name="Trunk"
          severity={getSeverity('Trunk')}
          onClick={onPartClick}
          d="M 220,100 L 85,110 C 75,160 75,160 85,210 L 220,220 C 210,160 210,160 220,100 Z"
        />

        {/* WINDSHIELD (Front Glass) */}
        <CarPart
          name="Windshield"
          severity={getSeverity('Windshield')}
          onClick={onPartClick}
          d="M 360,105 C 370,130 370,190 360,215 C 390,210 390,110 360,105 Z"
        />

        {/* REAR GLASS */}
        <CarPart
          name="Rear Glass"
          severity={getSeverity('Rear Glass')}
          onClick={onPartClick}
          d="M 240,105 C 230,130 230,190 240,215 C 210,210 210,110 240,105 Z"
        />

        {/* ROOF (Center) */}
        <CarPart
          name="Roof"
          severity={getSeverity('Roof')}
          onClick={onPartClick}
          d="M 245,100 L 355,100 C 345,160 345,160 355,220 L 245,220 C 255,160 255,160 245,100 Z"
        />

        {/* --- LEFT SIDE PANELS (Top) --- */}
        
        {/* Front Left Fender */}
        <CarPart
          name="Front Left Fender"
          severity={getSeverity('Front Left Fender')}
          onClick={onPartClick}
          d="M 410,102 Q 460,55 515,112 L 500,112 Q 450,85 410,102 Z"
        />

        {/* Rear Left Fender */}
        <CarPart
          name="Rear Left Fender"
          severity={getSeverity('Rear Left Fender')}
          onClick={onPartClick}
          d="M 190,102 Q 140,55 85,112 L 100,112 Q 150,85 190,102 Z"
        />

        {/* Front Left Door */}
        <CarPart
          name="Front Left Door"
          severity={getSeverity('Front Left Door')}
          onClick={onPartClick}
          d="M 305,98 L 405,98 L 400,65 L 315,65 Z"
        />

        {/* Rear Left Door */}
        <CarPart
          name="Rear Left Door"
          severity={getSeverity('Rear Left Door')}
          onClick={onPartClick}
          d="M 195,98 L 300,98 L 295,65 L 200,65 Z"
        />


        {/* --- RIGHT SIDE PANELS (Bottom) --- */}

        {/* Front Right Fender */}
        <CarPart
          name="Front Right Fender"
          severity={getSeverity('Front Right Fender')}
          onClick={onPartClick}
          d="M 410,218 Q 460,265 515,208 L 500,208 Q 450,235 410,218 Z"
        />

        {/* Rear Right Fender */}
        <CarPart
          name="Rear Right Fender"
          severity={getSeverity('Rear Right Fender')}
          onClick={onPartClick}
          d="M 190,218 Q 140,265 85,208 L 100,208 Q 150,235 190,218 Z"
        />

        {/* Front Right Door */}
        <CarPart
          name="Front Right Door"
          severity={getSeverity('Front Right Door')}
          onClick={onPartClick}
          d="M 305,222 L 405,222 L 400,255 L 315,255 Z"
        />

        {/* Rear Right Door */}
        <CarPart
          name="Rear Right Door"
          severity={getSeverity('Rear Right Door')}
          onClick={onPartClick}
          d="M 195,222 L 300,222 L 295,255 L 200,255 Z"
         />

      </svg>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-gray-100 shadow-sm text-xs pointer-events-none">
         <div className="flex items-center gap-2 mb-1">
             <span className="w-3 h-3 rounded-full bg-red-500 opacity-60 border border-red-500"></span> Major
         </div>
         <div className="flex items-center gap-2 mb-1">
             <span className="w-3 h-3 rounded-full bg-orange-500 opacity-60 border border-orange-500"></span> Medium
         </div>
         <div className="flex items-center gap-2">
             <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-60 border border-yellow-500"></span> Minor
         </div>
      </div>
    </div>
  );
};

export default CarDiagram;
