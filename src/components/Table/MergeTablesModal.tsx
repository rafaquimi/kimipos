import React, { useState } from 'react';
import { X, Link2, AlertTriangle } from 'lucide-react';
import { TableData } from './TableComponent';
import { useTables } from '../../contexts/TableContext';
import toast from 'react-hot-toast';

interface MergeTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MergeTablesModal: React.FC<MergeTablesModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedTables, setSelectedTables] = useState<TableData[]>([]);
  
  const { tables, mergeTables, getTableOrderItems } = useTables();

  // Filtrar mesas que pueden ser unidas (disponibles u ocupadas, y no ya unidas)
  const availableTablesForMerge = tables.filter(table => 
    (table.status === 'available' || table.status === 'occupied') && !table.mergedWith
  );

  const handleMergeTables = () => {
    if (selectedTables.length < 2) {
      toast.error('Debes seleccionar al menos dos mesas para unir');
      return;
    }

    // Verificar que no haya duplicados
    const uniqueIds = new Set(selectedTables.map(t => t.id));
    if (uniqueIds.size !== selectedTables.length) {
      toast.error('No puedes seleccionar la misma mesa más de una vez');
      return;
    }

    // La primera mesa seleccionada será la principal
    const masterTable = selectedTables[0];
    const secondaryTables = selectedTables.slice(1);

    // Contar productos totales
    const totalItems = selectedTables.reduce((total, table) => {
      return total + getTableOrderItems(table.id).length;
    }, 0);

    const tableNumbers = selectedTables.map(t => t.number).join(', ');
    const secondaryNumbers = secondaryTables.map(t => t.number).join(', ');

    if (window.confirm(
      `¿Estás seguro de que quieres unir las mesas ${tableNumbers}?\n\n` +
      `Se combinarán ${totalItems} productos en total.\n` +
      `La mesa ${masterTable.number} será la mesa principal.`
    )) {
      // Unir todas las mesas secundarias con la principal
      secondaryTables.forEach(secondaryTable => {
        mergeTables(masterTable.id, secondaryTable.id);
      });
      
      toast.success(`Mesas ${tableNumbers} unidas exitosamente`);
      onClose();
      setSelectedTables([]);
    }
  };

  const resetSelection = () => {
    setSelectedTables([]);
  };

  const toggleTableSelection = (table: TableData) => {
    setSelectedTables(prev => {
      const isSelected = prev.some(t => t.id === table.id);
      if (isSelected) {
        return prev.filter(t => t.id !== table.id);
      } else {
        return [...prev, table];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Link2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Unir Mesas</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
                         {availableTablesForMerge.length < 2 ? (
               <div className="text-center py-8">
                 <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">
                   No hay suficientes mesas para unir
                 </h3>
                 <p className="text-gray-600">
                   Necesitas al menos 2 mesas disponibles u ocupadas (que no estén ya unidas) para poder unirlas.
                 </p>
               </div>
             ) : (
              <>
                                 <div className="mb-6">
                   <p className="text-gray-600 mb-4">
                     Selecciona las mesas que quieres unir. La primera mesa seleccionada será la principal. Puedes unir mesas disponibles u ocupadas.
                   </p>
                  
                                     {/* Información de advertencia */}
                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                     <div className="flex">
                       <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                       <div className="text-sm text-yellow-800">
                         <p className="font-medium mb-1">Importante:</p>
                         <ul className="list-disc list-inside space-y-1">
                           <li>Los pedidos se combinarán en la mesa principal</li>
                           <li>La primera mesa seleccionada será la principal</li>
                           <li>Puedes unir múltiples mesas a la vez</li>
                           <li>Las mesas mostrarán indicadores visuales de unión</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Selección de mesas */}
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 mb-3">
                     Mesas Seleccionadas ({selectedTables.length})
                   </h4>
                   <div className="space-y-2 max-h-64 overflow-y-auto">
                     {availableTablesForMerge.map((table) => {
                       const isSelected = selectedTables.some(t => t.id === table.id);
                       const isFirstSelected = selectedTables.length > 0 && selectedTables[0].id === table.id;
                       
                       return (
                         <div
                           key={table.id}
                           onClick={() => toggleTableSelection(table)}
                           className={`p-4 border rounded-lg cursor-pointer transition-all ${
                             isSelected
                               ? isFirstSelected 
                                 ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                 : 'border-green-500 bg-green-50 ring-2 ring-green-200'
                               : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                           }`}
                         >
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                               <div>
                                 <div className="font-medium">Mesa {table.number}</div>
                                 {table.name && (
                                   <div className="text-sm text-gray-600">{table.name}</div>
                                 )}
                                 <div className="text-xs text-gray-500">
                                   {getTableOrderItems(table.id).length} productos
                                 </div>
                               </div>
                               {isSelected && (
                                 <div className="text-sm font-medium">
                                   {isFirstSelected ? '⭐ Principal' : '🔗 Unir'}
                                 </div>
                               )}
                             </div>
                             <div className={`w-4 h-4 rounded-full ${
                               table.status === 'available' ? 'bg-green-500' : 'bg-red-500'
                             }`}></div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>

                                 {/* Resumen de la unión */}
                 {selectedTables.length >= 2 && (
                   <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                     <h4 className="text-sm font-medium text-blue-900 mb-2">Resumen de la Unión</h4>
                     <div className="text-sm text-blue-800">
                       <p>
                         <strong>Mesa Principal:</strong> Mesa {selectedTables[0].number} 
                         ({getTableOrderItems(selectedTables[0].id).length} productos)
                       </p>
                       <p>
                         <strong>Mesas a Unir:</strong> {selectedTables.slice(1).map(t => 
                           `Mesa ${t.number} (${getTableOrderItems(t.id).length} productos)`
                         ).join(', ')}
                       </p>
                       <p className="mt-2">
                         <strong>Total después de unir:</strong> {
                           selectedTables.reduce((total, table) => 
                             total + getTableOrderItems(table.id).length, 0
                           )
                         } productos
                       </p>
                     </div>
                   </div>
                 )}
              </>
            )}
          </div>

          {/* Footer */}
          {availableTablesForMerge.length >= 2 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex space-x-3">
              <button
                onClick={resetSelection}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar Selección
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
                             <button
                 onClick={handleMergeTables}
                 disabled={selectedTables.length < 2}
                 className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                 Unir {selectedTables.length} Mesa{selectedTables.length !== 1 ? 's' : ''}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergeTablesModal;
