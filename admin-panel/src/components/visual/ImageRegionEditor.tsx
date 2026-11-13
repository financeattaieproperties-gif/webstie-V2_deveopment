import React, { useState, useRef, useCallback } from 'react';
import type { NormalizedPoint } from '../../../../shared/visual-config';

export interface ImageRegionEditorProps {
  imageUrl: string;
  points: NormalizedPoint[];
  onChangePoints: (points: NormalizedPoint[]) => void;
  labelAnchor?: NormalizedPoint;
  onChangeLabelAnchor?: (anchor: NormalizedPoint) => void;
  title?: string;
  instructions?: string;
}

export const ImageRegionEditor: React.FC<ImageRegionEditorProps> = ({
  imageUrl,
  points,
  onChangePoints,
  labelAnchor,
  onChangeLabelAnchor,
  title = 'Polygon Region Editor',
  instructions = 'Click on the image to add polygon vertices. Drag vertices to fine-tune coordinates.',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [isSettingAnchor, setIsSettingAnchor] = useState<boolean>(false);

  const getNormalizedPoint = useCallback((e: React.MouseEvent<HTMLDivElement>): NormalizedPoint | null => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return {
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    };
  }, []);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeDragIndex !== null) return;
    const pt = getNormalizedPoint(e);
    if (!pt) return;

    if (isSettingAnchor && onChangeLabelAnchor) {
      onChangeLabelAnchor(pt);
      setIsSettingAnchor(false);
      return;
    }

    // Add point to polygon
    onChangePoints([...points, pt]);
  };

  const handlePointerDownVertex = (index: number, e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveDragIndex(index);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragIndex === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const updated = [...points];
    updated[activeDragIndex] = {
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    };
    onChangePoints(updated);
  };

  const handlePointerUp = () => {
    setActiveDragIndex(null);
  };

  const clearPoints = () => {
    onChangePoints([]);
  };

  const removeLastPoint = () => {
    if (points.length > 0) {
      onChangePoints(points.slice(0, -1));
    }
  };

  const svgPolygonString = points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ');

  return (
    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 10, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', fontWeight: 700 }}>{title}</h4>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{instructions}</p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {onChangeLabelAnchor && (
            <button
              type="button"
              onClick={() => setIsSettingAnchor(!isSettingAnchor)}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                borderRadius: 6,
                border: isSettingAnchor ? '1px solid #0F172A' : '1px solid #CBD5E1',
                background: isSettingAnchor ? '#0F172A' : '#FFFFFF',
                color: isSettingAnchor ? '#FFFFFF' : '#334155',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {isSettingAnchor ? 'Click to Set Anchor' : 'Set Label Anchor'}
            </button>
          )}

          <button
            type="button"
            onClick={removeLastPoint}
            disabled={points.length === 0}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#334155',
              cursor: points.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Undo Point
          </button>

          <button
            type="button"
            onClick={clearPoints}
            disabled={points.length === 0}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.75rem',
              borderRadius: 6,
              border: '1px solid #fca5a5',
              background: '#fff',
              color: '#dc2626',
              cursor: points.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Interactive Canvas Stage */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: 450,
          background: '#090d16',
          borderRadius: 8,
          overflow: 'hidden',
          cursor: isSettingAnchor ? 'crosshair' : 'copy',
          userSelect: 'none',
        }}
      >
        <img
          src={imageUrl}
          alt="Calibration Reference"
          style={{ width: '100%', maxHeight: 450, objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
        />

        {/* SVG Drawing Layer */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {points.length >= 3 && (
            <polygon
              points={svgPolygonString}
              fill="rgba(1, 69, 242, 0.25)"
              stroke="#0145F2"
              strokeWidth="0.5"
            />
          )}

          {points.length === 2 && (
            <line
              x1={`${points[0].x * 100}`}
              y1={`${points[0].y * 100}`}
              x2={`${points[1].x * 100}`}
              y2={`${points[1].y * 100}`}
              stroke="#0145F2"
              strokeWidth="0.5"
            />
          )}
        </svg>

        {/* Draggable Vertices */}
        {points.map((pt, i) => (
          <div
            key={i}
            onPointerDown={(e) => handlePointerDownVertex(i, e)}
            style={{
              position: 'absolute',
              left: `${pt.x * 100}%`,
              top: `${pt.y * 100}%`,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i === 0 ? '#22c55e' : '#0145F2',
              border: '2px solid #fff',
              transform: 'translate(-50%, -50%)',
              cursor: 'grab',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
            title={`Vertex ${i + 1} (${pt.x}, ${pt.y})`}
          />
        ))}

        {/* Label Anchor Pin */}
        {labelAnchor && (
          <div
            style={{
              position: 'absolute',
              left: `${labelAnchor.x * 100}%`,
              top: `${labelAnchor.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              padding: '0.15rem 0.4rem',
              borderRadius: 4,
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 700,
              zIndex: 12,
              pointerEvents: 'none',
            }}
          >
            Label Anchor
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.72rem', color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>
        <span>Points: {points.length} {points.length < 3 ? '(min 3 required for a closed polygon)' : '• Closed shape'}</span>
        {labelAnchor && <span>Anchor: ({labelAnchor.x}, {labelAnchor.y})</span>}
      </div>
    </div>
  );
};

export default ImageRegionEditor;
