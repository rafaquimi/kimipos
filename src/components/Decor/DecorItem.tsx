import React, { useEffect, useRef, useState } from 'react';
import barSvg from '../../assets/decor/bar.svg';
import plantSvg from '../../assets/decor/plant.svg';
import RotationHandle from '../RotationHandle';

// Usar un PNG/SVG de planta si existe; de momento creamos un placeholder bonito

export type DecorKind = 'plant' | 'bar';

export interface DecorData {
  id: string;
  kind: DecorKind;
  x: number;
  y: number;
  rotation?: number; // Ángulo de rotación en grados
  width?: number;
  height?: number;
}

interface DecorItemProps {
  item: DecorData;
  isSelected?: boolean;
  isDraggable?: boolean;
  onDragEnd?: (item: DecorData, x: number, y: number) => void;
  onRotationChange?: (item: DecorData, rotation: number) => void;
}

const DecorItem: React.FC<DecorItemProps> = ({ item, isSelected, isDraggable = false, onDragEnd, onRotationChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentRotation, setCurrentRotation] = useState(item.rotation || 0);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    
    // No activar arrastre si se hizo clic en el manejador de rotación
    const target = e.target as HTMLElement;
    if (target.closest('.rotation-handle')) return;
    
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

  // Manejar cambio de rotación
  const handleRotationChange = (newRotation: number) => {
    setCurrentRotation(newRotation);
    onRotationChange?.(item, newRotation);
  };

  // Actualizar rotación cuando cambia la prop item
  useEffect(() => {
    setCurrentRotation(item.rotation || 0);
  }, [item.rotation]);

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
      style={{ 
        left: item.x, 
        top: item.y,
        transform: `rotate(${currentRotation}deg)`,
        transformOrigin: 'center'
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {item.kind === 'plant' ? (
        <img
          src={plantSvg}
          alt="Planta"
          style={{ width: item.width || 80, height: item.height || 110, pointerEvents: 'none' }}
          draggable={false}
          className="select-none drop-shadow"
        />
      ) : (
        <img
          src={barSvg}
          alt="Barra de bar"
          style={{ width: item.width || 240, height: item.height || 90, pointerEvents: 'none' }}
          draggable={false}
          className="select-none drop-shadow"
        />
      )}

      {/* Manejador de rotación */}
      {isDraggable && isHovered && !isDragging && onRotationChange && (
        <RotationHandle
          visible={true}
          currentRotation={currentRotation}
          onRotationChange={handleRotationChange}
          elementRect={{
            x: 0,
            y: 0,
            width: item.width || (item.kind === 'plant' ? 80 : 240),
            height: item.height || (item.kind === 'plant' ? 110 : 90)
          }}
        />
      )}
    </div>
  );
};

export default DecorItem;


