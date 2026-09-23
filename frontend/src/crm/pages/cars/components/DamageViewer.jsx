import React from 'react';
import Viewer from 'react-viewer'; 

// Wrapper for react-viewer to handle image gallery
const DamageViewer = ({ visible, onClose, images, activeIndex = 0 }) => {
  if (!images || images.length === 0) return null;

  // Transform simple url strings to objects required by react-viewer if needed
  // react-viewer expects array of { src: string, alt?: string, downloadUrl?: string }
  const viewerImages = images.map(img => (
      typeof img === 'string' ? { src: img, alt: 'Damage Photo' } : img
  ));

  return (
    <Viewer
      visible={visible}
      onClose={onClose}
      images={viewerImages}
      activeIndex={activeIndex}
      zoomSpeed={0.1}
      drag={true}
      rotatable={true}
      scalable={true}
      downloadable={true}
      attribute={false} // Hide attributes
    />
  );
};

export default DamageViewer;
