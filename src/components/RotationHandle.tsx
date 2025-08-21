import React, { useState, useRef } from 'react';
import { RotateCw } from 'lucide-react';

interface RotationHandleProps {
  visible: boolean;
  currentRotation: number;
  onRotationChange: (rotation: number) => void;
  elementRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const RotationHandle: React.FC<RotationHandleProps> = ({
  visible,
  currentRotation,
  onRotationChange,
  elementRect
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    let lastX = e.clientX;
    let localRotation = currentRotation;
    
    // Función para manejar el movimiento
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - lastX;
      const rotationSpeed = 1; // 1 pixel = 1 grado
      
      localRotation += deltaX * rotationSpeed;
      
      // Normalizar entre 0-360
      const normalizedRotation = ((localRotation % 360) + 360) % 360;
      onRotationChange(normalizedRotation);
      
      lastX = moveEvent.clientX;
    };
    
    // Función para terminar el arrastre
    const handleMouseUp = () => {
      setIsDragging(false);
      
      // Snap a intervalos de 15 grados
      const snapInterval = 15;
      const snappedRotation = Math.round(localRotation / snapInterval) * snapInterval;
      const normalizedSnap = ((snappedRotation % 360) + 360) % 360;
      onRotationChange(normalizedSnap);
      
      // Remover eventos
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Agregar eventos al documento
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!visible) return null;

  return (
    <div
      ref={handleRef}
      className={`rotation-handle absolute z-50 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center cursor-grab shadow-xl border-2 border-white transition-all duration-200 ${
        isDragging ? 'cursor-grabbing scale-125 bg-blue-600' : 'hover:scale-110'
      }`}
      style={{
        left: elementRect.width - 10,
        top: -10,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseDown={handleMouseDown}
      title={`Rotar elemento (${Math.round(currentRotation)}°)`}
    >
      <RotateCw className="w-4 h-4 text-white" />
    </div>
  );
};

export default RotationHandle;