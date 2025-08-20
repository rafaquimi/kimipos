import React, { useEffect, useRef, useState } from 'react';
import barSvg from '../../assets/decor/bar.svg';
import plantSvg from '../../assets/decor/plant.svg';

// Usar un PNG/SVG de planta si existe; de momento creamos un placeholder bonito

export type DecorKind = 'plant' | 'bar';

export interface DecorData {
  id: string;
  kind: DecorKind;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface DecorItemProps {
  item: DecorData;
  isSelected?: boolean;
  isDraggable?: boolean;
  onDragEnd?: (item: DecorData, x: number, y: number) => void;
}

const DecorItem: React.FC<DecorItemProps> = ({ item, isSelected, isDraggable = false, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isDraggable) return;
    const canvas = document.querySelector('.salon-canvas') as HTMLElement;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - dragOffset.x);
      const y = Math.max(0, e.clientY - rect.top - dragOffset.y);
      onDragEnd?.(item, x, y);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, item, isDraggable]);

  return (
    <div
      ref={ref}
      className={`absolute ${isSelected ? 'ring-2 ring-primary-500' : ''} `}
      style={{ left: item.x, top: item.y }}
      onMouseDown={handleMouseDown}
    >
      {item.kind === 'plant' ? (
        <img
          src={plantSvg}
          alt="Planta"
          style={{ width: item.width || 80, height: item.height || 110 }}
          draggable={false}
          className="select-none drop-shadow"
        />
      ) : (
        <img
          src={barSvg}
          alt="Barra de bar"
          style={{ width: item.width || 240, height: item.height || 90 }}
          draggable={false}
          className="select-none drop-shadow"
        />
      )}
    </div>
  );
};

export default DecorItem;


