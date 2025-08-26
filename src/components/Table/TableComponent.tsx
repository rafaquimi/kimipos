import React, { useRef, useEffect, useState } from 'react';
import { Clock, Users } from 'lucide-react';
import RotationHandle from '../RotationHandle';
import { useTables } from '../../contexts/TableContext';

export interface TableData {
  id: string;
  number: string;
  name?: string;
  temporaryName?: string; // Nombre temporal asignado por el usuario
  status: 'available' | 'occupied' | 'reserved';
  x: number;
  y: number;
  rotation?: number; // Ángulo de rotación en grados
  occupiedSince?: Date;
  capacity?: number;
  currentOrder?: {
    id: string;
    total: number;
    itemCount: number;
  };
  // Propiedades para unión de mesas
  mergedWith?: string; // ID de la mesa con la que está unida
  mergeGroup?: string; // ID del grupo de unión para mesas múltiples
  isMaster?: boolean; // Si es la mesa principal en una unión
  // Propiedades para cliente asignado
  assignedCustomer?: {
    id: string;
    name: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

interface TableComponentProps {
  table: TableData;
  isSelected?: boolean;
  isSelectedForMerge?: boolean; // Nueva prop para indicar si está seleccionada para unir
  isMergeSelectionMode?: boolean; // Nueva prop para indicar si estamos en modo de selección para unir
  onClick?: (table: TableData) => void;
  onLongPress?: (table: TableData) => void; // Nueva prop para pulsación sostenida
  onDragStart?: (table: TableData) => void;
  onDragEnd?: (table: TableData, x: number, y: number) => void;
  onRotationChange?: (table: TableData, rotation: number) => void;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  isDraggable?: boolean;
  scale?: number;
}

const TableComponent: React.FC<TableComponentProps> = ({
  table,
  isSelected = false,
  isSelectedForMerge = false,
  isMergeSelectionMode = false,
  onClick,
  onLongPress,
  onDragStart,
  onDragEnd,
  onRotationChange,
  onDelete,
  showDeleteButton = false,
  isDraggable = false,
  scale = 1
}) => {
  const { getTotalPartialPayments } = useTables();
  
  // Calcular el importe pendiente considerando cobros parciales
  const getPendingAmount = () => {
    if (!table.currentOrder) return 0;
    const totalPartialPayments = getTotalPartialPayments(table.id);
    return Math.max(0, table.currentOrder.total - totalPartialPayments);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState({ 
    x: isNaN(table.x) ? 100 : table.x, 
    y: isNaN(table.y) ? 100 : table.y 
  });
  const [currentRotation, setCurrentRotation] = useState(table.rotation || 0);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Estados para pulsación sostenida
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  // Estado para tooltip
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTimer, setTooltipTimer] = useState<NodeJS.Timeout | null>(null);

  // Actualizar posición y rotación cuando cambia la prop table
  useEffect(() => {
    setCurrentPosition({ 
      x: isNaN(table.x) ? 100 : table.x, 
      y: isNaN(table.y) ? 100 : table.y 
    });
    setCurrentRotation(table.rotation || 0);
  }, [table.x, table.y, table.rotation]);

  // Función para generar colores únicos basados en mergeGroup
  const getMergeGroupColor = (mergeGroup: string) => {
    const colors = [
      'border-purple-400 bg-purple-100 text-purple-800',
      'border-indigo-400 bg-indigo-100 text-indigo-800', 
      'border-pink-400 bg-pink-100 text-pink-800',
      'border-orange-400 bg-orange-100 text-orange-800',
      'border-cyan-400 bg-cyan-100 text-cyan-800',
      'border-emerald-400 bg-emerald-100 text-emerald-800'
    ];
    
    // Generar hash simple del mergeGroup para obtener color consistente
    const hash = mergeGroup.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusColor = () => {
    // Si es una cuenta por nombre, usar tema amarillo
    if (table.id.startsWith('account-')) {
      return 'bg-yellow-100 border-yellow-400 text-yellow-800';
    }
    
    // Si la mesa está unida, usar color del grupo
    if (table.mergeGroup) {
      return getMergeGroupColor(table.mergeGroup);
    }
    
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

  // Función para iniciar temporizador de pulsación sostenida
  const startLongPressTimer = (e: React.MouseEvent | React.TouchEvent) => {
    // Verificar si se puede hacer long press
    if (!canLongPress()) {
      return;
    }
    
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
    
    const timer = setTimeout(() => {
      setIsLongPressing(true);
      onLongPress?.(table);
    }, 1000); // 1 segundo
    
    setLongPressTimer(timer);
  };

  // Función para cancelar temporizador de pulsación sostenida
  const cancelLongPressTimer = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPressing(false);
  };

  // Función para determinar si se puede hacer long press
  const canLongPress = () => {
    // No permitir long press en cuentas por nombre que tienen cliente asociado
    if (table.id.startsWith('account-') && table.assignedCustomer) {
      return false;
    }
    return true;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) {
      // Si no es arrastrable, iniciar temporizador de pulsación sostenida
      startLongPressTimer(e);
      return;
    }
    
    // No activar arrastre si se hizo clic en el manejador de rotación
    const target = e.target as HTMLElement;
    if (target.closest('.rotation-handle')) return;
    
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
      onDragEnd?.(table, finalX, finalY);
    } else {
      // Cancelar pulsación sostenida si no se estaba arrastrando
      cancelLongPressTimer();
    }
  };

  // Manejadores para touch events (móvil)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isDraggable) {
      startLongPressTimer(e);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) {
      cancelLongPressTimer();
    }
  };

  // Tamaño base: 80px para mesas físicas, 100px para cuentas por nombre
  const baseSize = table.id.startsWith('account-') ? 100 : 80;
  const size = baseSize * scale;

  // Manejar cambio de rotación
  const handleRotationChange = (newRotation: number) => {
    setCurrentRotation(newRotation);
    onRotationChange?.(table, newRotation);
  };

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

  // Limpiar temporizadores cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [longPressTimer, tooltipTimer]);

  return (
    <div
      ref={tableRef}
      className={`absolute transition-all duration-200 ${
        isSelected ? 'ring-4 ring-primary-500' : ''
      } ${
        isSelectedForMerge ? 'ring-4 ring-blue-500 animate-pulse' : ''
      } ${
        table.mergeGroup && !table.isMaster ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
      }`}
      style={{
        left: isNaN(currentPosition.x) ? 100 : currentPosition.x * scale,
        top: isNaN(currentPosition.y) ? 100 : currentPosition.y * scale,
        width: size,
        height: size,
        cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : 
                (table.id.startsWith('account-') && table.assignedCustomer) ? 'default' : 'pointer',
        zIndex: isDragging ? 1000 : 1,
        transform: `rotate(${currentRotation}deg)`,
        transformOrigin: 'center'
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isLongPressing) {
          onClick?.(table);
        }
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => {
        setIsHovered(true);
        if (canLongPress()) {
          // Limpiar timer existente
          if (tooltipTimer) {
            clearTimeout(tooltipTimer);
          }
          // Mostrar tooltip después de 500ms
          const timer = setTimeout(() => {
            setShowTooltip(true);
          }, 500);
          setTooltipTimer(timer);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
        // Limpiar timer al salir
        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          setTooltipTimer(null);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.(table);
      }}
    >
      {/* Mesa circular o cuadrada (cuadrada para cuentas por nombre) */}
      <div
        className={`w-full h-full border-2 shadow-lg flex flex-col items-center justify-center relative ${getStatusColor()} hover:shadow-xl transition-shadow ${
          table.id.startsWith('account-') ? 'rounded-lg' : 'rounded-full'
        }`}
        style={{ pointerEvents: 'none' }}
      >
        {/* Número de mesa - solo para mesas físicas, no para cuentas por nombre */}
        {!table.id.startsWith('account-') && (
          <div className="text-lg font-bold">
            {table.number}
          </div>
        )}
        
        {/* Nombre para cuentas por nombre - diseño optimizado */}
        {table.id.startsWith('account-') && (table.temporaryName || table.name) && (
          <div className="text-xs font-bold text-center text-gray-800 px-1 py-1 leading-tight max-w-full overflow-hidden flex items-center justify-center min-h-0">
            <div className="break-words hyphens-auto" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
              {table.temporaryName || table.name}
            </div>
          </div>
        )}
        
        {/* Nombre temporal para mesas físicas (prioridad sobre el nombre permanente) */}
        {!table.id.startsWith('account-') && table.temporaryName && (
          <div className="text-sm font-bold text-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {table.temporaryName}
          </div>
        )}
        
        {/* Nombre permanente para mesas físicas */}
        {!table.id.startsWith('account-') && !table.temporaryName && table.name && (
          <div className="text-sm font-bold opacity-75 text-center">
            {table.name}
          </div>
        )}

        {/* Cliente asignado - solo para mesas físicas, no para cuentas por nombre */}
        {!table.id.startsWith('account-') && table.assignedCustomer && (
          <div className="text-xs font-medium text-center bg-green-100 text-green-800 px-2 py-1 rounded mt-1">
            👤 {table.assignedCustomer.name} {table.assignedCustomer.lastName}
          </div>
        )}

        {/* Etiqueta de unión de mesas - solo mostrar icono, no el ID */}
        {table.mergedWith && (
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full border-2 border-white shadow-lg">
            🔗
          </div>
        )}

        {/* Indicador de mesa principal */}
        {table.mergeGroup && table.isMaster && (
          <div className="absolute -left-2 -top-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full border border-white shadow-sm">
            ★
          </div>
        )}

        {/* Información adicional para mesas ocupadas */}
        {table.status === 'occupied' && (
          <>
            {/* Tiempo transcurrido - solo en mesa principal o mesas no unidas */}
            {table.occupiedSince && (!table.mergeGroup || table.isMaster) && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md border border-white flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{getTimeElapsed()}</span>
              </div>
            )}
            
            {/* Importe pendiente del pedido - solo en mesa principal o mesas no unidas */}
            {table.currentOrder && (!table.mergeGroup || table.isMaster) && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs font-bold px-2 py-1 rounded-md shadow-md border border-white">
                €{getPendingAmount().toFixed(2)}
              </div>
            )}

            {/* Etiqueta para mesa secundaria unida - indicador más prominente */}
            {table.mergeGroup && !table.isMaster && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md shadow-md border border-white">
                🔗 Mesa Secundaria
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

        {/* Indicador de selección para unir */}
        {isSelectedForMerge && (
          <div className="absolute -left-1 -bottom-1 w-4 h-4 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}

        {/* Indicador de modo de selección para unir */}
        {isMergeSelectionMode && !isSelectedForMerge && !table.mergedWith && !table.mergeGroup && (
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg bg-blue-50 bg-opacity-30 flex items-center justify-center">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              🔗
            </div>
          </div>
        )}
        
        {/* Overlay para mesas secundarias no seleccionables */}
        {table.mergeGroup && !table.isMaster && (
          <div className="absolute inset-0 bg-gray-400 bg-opacity-20 rounded-lg flex items-center justify-center">
            <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              🔒
            </div>
          </div>
        )}
      </div>

      {/* Manejador de rotación */}
      {isDraggable && isHovered && !isDragging && onRotationChange && (
        <RotationHandle
          visible={true}
          currentRotation={currentRotation}
          onRotationChange={handleRotationChange}
          elementRect={{
            x: 0,
            y: 0,
            width: size,
            height: size
          }}
        />
      )}

      {/* Tooltip para edición de nombre */}
      {showTooltip && canLongPress() && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
          <div className="flex items-center space-x-1">
            <span>✏️ Pulsa sostenido para cambiar nombre</span>
          </div>
          {/* Flecha del tooltip */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default TableComponent;
