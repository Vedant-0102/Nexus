import React, { useState, useEffect } from 'react';
import { SnapPreview } from './SnapPreview';
import { SnapZone } from '../hooks/useWindowSnap';

export const SnapPreviewGlobal: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewZone, setPreviewZone] = useState<SnapZone>(null);

  useEffect(() => {
    const handleSnapPreview = (event: CustomEvent) => {
      setShowPreview(event.detail.show);
      setPreviewZone(event.detail.zone);
    };

    window.addEventListener('snap-preview' as any, handleSnapPreview);

    return () => {
      window.removeEventListener('snap-preview' as any, handleSnapPreview);
    };
  }, []);

  return <SnapPreview show={showPreview} zone={previewZone} />;
};
