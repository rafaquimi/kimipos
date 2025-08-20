import React, { useRef, useEffect, useState } from 'react';
import { Clock, Users } from 'lucide-react';

export interface TableData {
  id: string;
  number: string;
  name?: string;
  status: 'available' | 'occupied' | 'reserved';
  x: number;
  y: number;
  occupiedSince?: Date;
  capacity?: number;
  currentOrder?: {
    id: string;
    total: number;
    itemCount: number;
  };
}

interface TableComponentProps {
  table: TableData;
  isSelected?: boolean;
  onClick?: (table: TableData) => void;
  onDragStart?: (table: TableData) => void;
  onDragEnd?: (table: TableData, x: number, y: number) => void;
  isDraggable?: boolean;
  scale?: number;
}

const TableComponent: React.FC<TableComponentProps> = ({
  table,
  isSelected = false,
  onClick,
  onDragStart,
  onDragEnd,
  isDraggable = false,
  scale = 1
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState({ 
    x: isNaN(table.x) ? 100 : table.x, 
    y: isNaN(table.y) ? 100 : table.y 
  });
  const tableRef = useRef<HTMLDivElement>(null);

  // Actualizar posición cuando cambia la prop table
  useEffect(() => {
    setCurrentPosition({ 
      x: isNaN(table.x) ? 100 : table.x, 
      y: isNaN(table.y) ? 100 : table.y 
    });
  }, [table.x, table.y]);

  const getStatusColor = () => {
    switch (table.status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTimeElapsed = () => {
    if (!table.occupiedSince) return null;
    
    const now = new Date();
    const elapsed = now.getTime() - table.occupiedSince.getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - currentPosition.x * scale,
      y: e.clientY - currentPosition.y * scale
    });
    onDragStart?.(table);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !isDraggable) return;
    e.preventDefault();
    
    const container = document.querySelector('.relative') as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Calcular nueva posición basada en el mouse
    const newX = (e.clientX - dragStart.x) / scale;
    const newY = (e.clientY - dragStart.y) / scale;
    
    // Aplicar límites para mantener la mesa dentro del contenedor
    const maxX = (containerWidth - size) / scale;
    const maxY = (containerHeight - size) / scale;
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    // Validar que no sean NaN antes de actualizar
    if (!isNaN(clampedX) && !isNaN(clampedY)) {
      setCurrentPosition({ x: clampedX, y: clampedY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Validar coordenadas antes de enviar al componente padre
      const finalX = isNaN(currentPosition.x) ? 100 : currentPosition.x;
      const finalY = isNaN(currentPosition.y) ? 100 : currentPosition.y;
      console.log('TableComponent onDragEnd:', { tableId: table.id, finalX, finalY });
      onDragEnd?.(table, finalX, finalY);
    }
  };

  const size = 80 * scale;

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, scale, size, currentPosition]);

  return (
    <div
      ref={tableRef}
      className={`absolute transition-all duration-200 ${
        isSelected ? 'ring-4 ring-primary-500' : ''
      }`}
      style={{
        left: isNaN(currentPosition.x) ? 100 : currentPosition.x * scale,
        top: isNaN(currentPosition.y) ? 100 : currentPosition.y * scale,
        width: size,
        height: size,
        cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        zIndex: isDragging ? 1000 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(table);
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Mesa circular */}
      <div
        className={`w-full h-full rounded-full border-2 shadow-lg flex flex-col items-center justify-center relative ${getStatusColor()} hover:shadow-xl transition-shadow`}
      >
        {/* Número de mesa */}
        <div className="text-lg font-bold">
          {table.number}
        </div>
        
        {/* Nombre de mesa (si existe) */}
        {table.name && (
          <div className="text-xs opacity-75 text-center">
            {table.name}
          </div>
        )}

        {/* Información adicional para mesas ocupadas */}
        {table.status === 'occupied' && (
          <>
            {/* Tiempo transcurrido */}
            {table.occupiedSince && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{getTimeElapsed()}</span>
              </div>
            )}
            
            {/* Total del pedido */}
            {table.currentOrder && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                ${table.currentOrder.total.toFixed(2)}
              </div>
            )}
          </>
        )}

        {/* Capacidad */}
        {table.capacity && (
          <div className="absolute -right-2 -top-2 bg-gray-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
            <Users className="w-3 h-3" />
          </div>
        )}

        {/* Indicador de estado */}
        <div
          className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-white ${
            table.status === 'available' ? 'bg-green-500' :
            table.status === 'occupied' ? 'bg-red-500' :
            'bg-yellow-500'
          }`}
        />
      </div>
    </div>
  );
};

export default TableComponent;
