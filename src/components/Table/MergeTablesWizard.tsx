import React, { useState } from 'react';
import { X, ArrowLeft, ArrowRight, Link2, Check } from 'lucide-react';
import { TableData } from './TableComponent';
import { useTables } from '../../contexts/TableContext';
import toast from 'react-hot-toast';

interface MergeTablesWizardProps {
  isOpen: boolean;
  onClose: () => void;
  step: number;
  selectedTables: TableData[];
  onStepChange: (step: number) => void;
  onTablesChange: (tables: TableData[]) => void;
  onSelectionModeChange: (isSelectionMode: boolean) => void;
  isSelectionMode: boolean;
}

const MergeTablesWizard: React.FC<MergeTablesWizardProps> = ({
  isOpen,
  onClose,
  step,
  selectedTables,
  onStepChange,
  onTablesChange,
  onSelectionModeChange,
  isSelectionMode
}) => {

  
  const { tables, mergeTables } = useTables();

  if (!isOpen) return null;

  // Debug: log en cada render del wizard
  console.log('🎨 RENDERIZANDO MergeTablesWizard - isOpen:', isOpen, 'isSelectionMode:', isSelectionMode, 'selectedTables:', selectedTables.length);





  const handleSelectFirstTable = () => {
    console.log('🔧 WIZARD: handleSelectFirstTable llamado');
    onStepChange(1);
    onTablesChange([]);
    console.log('🔧 WIZARD: Activando modo de selección...');
    onSelectionModeChange(true);
    console.log('🔧 WIZARD: Cerrando wizard para permitir selección...');
    // Cerrar el wizard para permitir selección directa
    onClose();
  };

  const handleSelectNextTable = () => {
    console.log('🔧 WIZARD: handleSelectNextTable llamado');
    onStepChange(2);
    console.log('🔧 WIZARD: Activando modo de selección para paso 2...');
    onSelectionModeChange(true);
    console.log('🔧 WIZARD: Cerrando wizard para permitir selección...');
    // Cerrar el wizard para permitir selección directa
    onClose();
  };



  const handleRemoveTable = (tableId: string) => {
    onTablesChange(selectedTables.filter(t => t.id !== tableId));
    toast.success('Mesa removida de la unión');
  };

  const handleFinishMerge = () => {
    if (selectedTables.length < 2) {
      toast.error('Debes seleccionar al menos 2 mesas para unir');
      return;
    }

    try {
      const masterTable = selectedTables[0];
      
      // Unir todas las mesas restantes con la principal
      for (let i = 1; i < selectedTables.length; i++) {
        const secondaryTable = selectedTables[i];
        mergeTables(masterTable.id, secondaryTable.id);
      }
      
      toast.success(`${selectedTables.length} mesas unidas exitosamente`);
      
      // Limpiar y cerrar
      onTablesChange([]);
      onStepChange(1);
      onSelectionModeChange(false);
      onClose();
    } catch (error) {
      console.error('Error al unir mesas:', error);
      toast.error('Error al unir las mesas');
    }
  };

  const handleCancel = () => {
    onTablesChange([]);
    onStepChange(1);
    onSelectionModeChange(false);
    onClose();
  };



  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          <div 
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={handleCancel}
          />

          {/* Modal */}
          <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Unir Mesas</h2>
                  <p className="text-sm text-gray-500">Paso {step} de 2</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="space-y-6">
              {/* Paso 1: Seleccionar mesa principal */}
              {step === 1 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Selecciona la mesa principal
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Esta será la mesa donde se concentrarán todos los productos de la unión
                  </p>
                  
                  {selectedTables.length === 0 ? (
                    <button
                      onClick={handleSelectFirstTable}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center space-x-2 mx-auto"
                    >
                      <ArrowRight className="w-5 h-5" />
                      <span>Seleccionar Mesa Principal</span>
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">Mesa principal seleccionada</span>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{selectedTables[0].number}</span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{selectedTables[0].name || `Mesa ${selectedTables[0].number}`}</p>
                              <p className="text-sm text-gray-500">Mesa principal</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveTable(selectedTables[0].id)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 2: Agregar mesas adicionales */}
              {step === 2 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Agregar mesas a la unión
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Selecciona las mesas que quieres unir con la mesa principal
                  </p>

                  {/* Mesa principal (solo mostrar) */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <p className="text-sm font-medium text-blue-800 mb-2">Mesa Principal:</p>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{selectedTables[0].number}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedTables[0].name || `Mesa ${selectedTables[0].number}`}</p>
                          <p className="text-sm text-gray-500">Mesa principal</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mesas adicionales */}
                  {selectedTables.slice(1).map((table, index) => (
                    <div key={table.id} className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{table.number}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{table.name || `Mesa ${table.number}`}</p>
                            <p className="text-sm text-gray-500">Mesa adicional {index + 1}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTable(table.id)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Botón para agregar más mesas */}
                  <button
                    onClick={handleSelectNextTable}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center space-x-2 mx-auto"
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span>Agregar Siguiente Mesa</span>
                  </button>
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                                 <button
                   onClick={() => {
                     if (step === 2) {
                       onStepChange(1);
                     } else {
                       handleCancel();
                     }
                   }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{step === 2 ? 'Anterior' : 'Cancelar'}</span>
                </button>

                <div className="flex space-x-3">
                                     {step === 1 && selectedTables.length > 0 && (
                     <button
                       onClick={() => onStepChange(2)}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                    >
                      <span>Siguiente</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {step === 2 && selectedTables.length >= 2 && (
                    <button
                      onClick={handleFinishMerge}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>Unir Mesas</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </>
  );
};

export default MergeTablesWizard;
