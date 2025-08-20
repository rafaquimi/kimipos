import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Layout,
  Square,
  Circle
} from 'lucide-react';
import { db, Table, Salon } from '../database/db';
import toast from 'react-hot-toast';

const Tables: React.FC = () => {
  const [selectedSalon, setSelectedSalon] = useState<number | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isSalonModalOpen, setIsSalonModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form states
  const [tableFormData, setTableFormData] = useState({
    number: '',
    name: '',
    capacity: '',
    x: 100,
    y: 100,
    width: 80,
    height: 80
  });

  const [salonFormData, setSalonFormData] = useState({
    name: '',
    description: ''
  });

  // Queries
  const salons = useLiveQuery(() => 
    db.salons.where('isActive').equals(1).toArray()
  );

  const tables = useLiveQuery(() => {
    if (selectedSalon) {
      return db.tables.where('salonId').equals(selectedSalon).toArray();
    }
    return [];
  }, [selectedSalon]);

  const selectedSalonData = useLiveQuery(() => {
    if (selectedSalon) {
      return db.salons.get(selectedSalon);
    }
    return null;
  }, [selectedSalon]);

  // Initialize with first salon
  React.useEffect(() => {
    if (salons && salons.length > 0 && !selectedSalon) {
      setSelectedSalon(salons[0].id!);
    }
  }, [salons, selectedSalon]);

  // Table handlers
  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tableFormData.number || !tableFormData.name || !tableFormData.capacity || !selectedSalon) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      const tableData = {
        number: tableFormData.number,
        name: tableFormData.name,
        capacity: parseInt(tableFormData.capacity),
        salonId: selectedSalon,
        x: tableFormData.x,
        y: tableFormData.y,
        width: tableFormData.width,
        height: tableFormData.height,
        status: 'available' as const
      };

      if (editingTable) {
        await db.tables.update(editingTable.id!, tableData);
        toast.success('Mesa actualizada exitosamente');
      } else {
        await db.tables.add({
          ...tableData,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'pending'
        });
        toast.success('Mesa creada exitosamente');
      }

      closeTableModal();
    } catch (error) {
      console.error('Error saving table:', error);
      toast.error('Error al guardar la mesa');
    }
  };

  const openTableModal = () => {
    setEditingTable(null);
    setTableFormData({
      number: '',
      name: '',
      capacity: '',
      x: 50 + Math.random() * 200, // Posición aleatoria para evitar solapamiento
      y: 50 + Math.random() * 200,
      width: 80,
      height: 80
    });
    setIsTableModalOpen(true);
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setTableFormData({
      number: table.number,
      name: table.name,
      capacity: table.capacity.toString(),
      x: table.x,
      y: table.y,
      width: table.width,
      height: table.height
    });
    setIsTableModalOpen(true);
  };

  const handleDeleteTable = async (table: Table) => {
    if (table.status === 'occupied') {
      toast.error('No se puede eliminar una mesa que está ocupada');
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar la mesa "${table.name}"?`)) {
      try {
        await db.tables.delete(table.id!);
        toast.success('Mesa eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting table:', error);
        toast.error('Error al eliminar la mesa');
      }
    }
  };

  const closeTableModal = () => {
    setIsTableModalOpen(false);
    setEditingTable(null);
    setTableFormData({
      number: '',
      name: '',
      capacity: '',
      x: 100,
      y: 100,
      width: 80,
      height: 80
    });
  };

  // Salon handlers
  const handleSalonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!salonFormData.name) {
      toast.error('El nombre del salón es obligatorio');
      return;
    }

    try {
      const salonData = {
        name: salonFormData.name,
        description: salonFormData.description || undefined,
        isActive: true
      };

      if (editingSalon) {
        await db.salons.update(editingSalon.id!, salonData);
        toast.success('Salón actualizado exitosamente');
      } else {
        const salonId = await db.salons.add({
          ...salonData,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'pending'
        });
        setSelectedSalon(salonId as number);
        toast.success('Salón creado exitosamente');
      }

      closeSalonModal();
    } catch (error) {
      console.error('Error saving salon:', error);
      toast.error('Error al guardar el salón');
    }
  };

  const handleEditSalon = (salon: Salon) => {
    setEditingSalon(salon);
    setSalonFormData({
      name: salon.name,
      description: salon.description || ''
    });
    setIsSalonModalOpen(true);
  };

  const closeSalonModal = () => {
    setIsSalonModalOpen(false);
    setEditingSalon(null);
    setSalonFormData({
      name: '',
      description: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'border-green-300 bg-green-50 text-green-800';
      case 'occupied':
        return 'border-red-300 bg-red-50 text-red-800';
      case 'reserved':
        return 'border-yellow-300 bg-yellow-50 text-yellow-800';
      case 'maintenance':
        return 'border-gray-400 bg-gray-100 text-gray-600';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return status;
    }
  };

  // Funciones de arrastre
  const handleDragStart = (e: React.DragEvent, table: Table) => {
    setDraggedTable(table);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!draggedTable) return;

    try {
      // Obtener la posición relativa al contenedor
      const container = e.currentTarget as HTMLElement;
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - 40; // Centrar la mesa (40px es la mitad del ancho)
      const y = e.clientY - rect.top - 40;  // Centrar la mesa (40px es la mitad del alto)

      // Asegurar que la mesa no se salga del contenedor
      const maxX = rect.width - 80;  // Ancho del contenedor menos el ancho de la mesa
      const maxY = rect.height - 80; // Alto del contenedor menos el alto de la mesa
      
      const finalX = Math.max(0, Math.min(x, maxX));
      const finalY = Math.max(0, Math.min(y, maxY));

      // Actualizar la posición en la base de datos
      await db.tables.update(draggedTable.id!, {
        x: finalX,
        y: finalY,
        updatedAt: new Date(),
        syncStatus: 'pending'
      });

      toast.success('Posición de mesa actualizada');
    } catch (error) {
      console.error('Error updating table position:', error);
      toast.error('Error al actualizar la posición de la mesa');
    } finally {
      setDraggedTable(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Layout className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Editor de Salones y Mesas</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSalonModalOpen(true)}
              className="btn btn-secondary flex items-center space-x-2 px-6 py-4 min-h-[48px] text-base font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Salón</span>
            </button>
            <button
              onClick={openTableModal}
              disabled={!selectedSalon}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-4 min-h-[48px] text-base font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Mesa</span>
            </button>
          </div>
        </div>

        {/* Selector de salón */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Salón:</label>
          <select
            value={selectedSalon || ''}
            onChange={(e) => setSelectedSalon(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Seleccionar salón...</option>
            {salons?.map((salon) => (
              <option key={salon.id} value={salon.id}>
                {salon.name}
              </option>
            ))}
          </select>
          {selectedSalonData && (
            <button
              onClick={() => handleEditSalon(selectedSalonData)}
              className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Editar salón"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-hidden">
        {selectedSalon && selectedSalonData ? (
          <div className="h-full flex">
            {/* Editor visual */}
            <div className="flex-1 bg-white m-4 rounded-lg border border-gray-200 relative overflow-auto">
              <div className="absolute inset-0 p-4">
                <div 
                  className={`w-full h-full relative bg-gray-50 rounded border-2 border-dashed border-gray-300 ${isDragging ? 'bg-blue-50 border-blue-300' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {tables?.map((table) => (
                    <div
                      key={table.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, table)}
                      className={`absolute rounded-lg border-2 cursor-move transition-all duration-200 flex items-center justify-center text-xs font-medium select-none ${getStatusColor(table.status)} ${draggedTable?.id === table.id ? 'opacity-50' : ''} hover:shadow-lg hover:scale-105`}
                      style={{
                        left: table.x,
                        top: table.y,
                        width: table.width || 80,
                        height: table.height || 80
                      }}
                      onDoubleClick={() => handleEditTable(table)}
                      title={`Mesa ${table.number} - ${table.name} (${getStatusText(table.status)}) - Arrastra para mover, doble clic para editar`}
                    >
                      <div className="text-center pointer-events-none">
                        <div className="font-semibold">{table.number}</div>
                        <div className="text-xs opacity-75">{table.name}</div>
                      </div>
                      
                      {/* Botón de eliminar */}
                      <div className="absolute -top-2 -right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTable(table);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center bg-white shadow-sm border border-gray-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {tables?.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Square className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">Sin mesas en este salón</p>
                        <p className="text-sm">Haz clic en "Nueva Mesa" para agregar una</p>
                      </div>
                    </div>
                  )}
                  
                  {tables && tables.length > 0 && (
                    <div className="absolute top-2 left-2 bg-blue-100 border border-blue-300 rounded-lg p-3 text-blue-800 text-sm max-w-xs">
                      <div className="font-medium mb-1">💡 Cómo usar el editor:</div>
                      <ul className="text-xs space-y-1">
                        <li>• <strong>Arrastra</strong> las mesas para moverlas</li>
                        <li>• <strong>Doble clic</strong> para editar una mesa</li>
                        <li>• <strong>Clic en ❌</strong> para eliminar</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel lateral con información */}
            <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedSalonData.name}
                </h3>
                
                {selectedSalonData.description && (
                  <p className="text-gray-600 mb-4">{selectedSalonData.description}</p>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Estadísticas</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">Total Mesas</div>
                        <div className="text-lg font-bold text-primary-600">
                          {tables?.length || 0}
                        </div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-medium">Disponibles</div>
                        <div className="text-lg font-bold text-green-600">
                          {tables?.filter(t => t.status === 'available').length || 0}
                        </div>
                      </div>
                      <div className="bg-red-50 p-2 rounded">
                        <div className="font-medium">Ocupadas</div>
                        <div className="text-lg font-bold text-red-600">
                          {tables?.filter(t => t.status === 'occupied').length || 0}
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <div className="font-medium">Reservadas</div>
                        <div className="text-lg font-bold text-yellow-600">
                          {tables?.filter(t => t.status === 'reserved').length || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Lista de Mesas</h4>
                    <div className="space-y-2 max-h-96 overflow-auto">
                      {tables?.map((table) => (
                        <div
                          key={table.id}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleEditTable(table)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Mesa {table.number}</div>
                              <div className="text-sm text-gray-600">{table.name}</div>
                              <div className="text-xs text-gray-500">
                                Capacidad: {table.capacity} personas
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(table.status)}`}>
                                {getStatusText(table.status)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTable(table);
                                }}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un salón</h3>
              <p className="text-gray-500 mb-4">
                {salons?.length === 0 
                  ? 'No hay salones creados. Crea tu primer salón para comenzar.'
                  : 'Selecciona un salón de la lista para ver y editar sus mesas.'
                }
              </p>
              {salons?.length === 0 && (
                <button
                  onClick={() => setIsSalonModalOpen(true)}
                  className="btn btn-primary px-6 py-4 min-h-[48px] text-base font-medium"
                >
                  Crear Primer Salón
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Mesa */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
              </h2>
              <button
                onClick={closeTableModal}
                className="text-gray-400 hover:text-gray-600 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>

            <form onSubmit={handleTableSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={tableFormData.number}
                    onChange={(e) => setTableFormData({ ...tableFormData, number: e.target.value })}
                    className="input"
                    placeholder="1, 2, A1..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tableFormData.capacity}
                    onChange={(e) => setTableFormData({ ...tableFormData, capacity: e.target.value })}
                    className="input"
                    placeholder="4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={tableFormData.name}
                  onChange={(e) => setTableFormData({ ...tableFormData, name: e.target.value })}
                  className="input"
                  placeholder="Mesa junto a la ventana"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ancho (px)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="200"
                    value={tableFormData.width}
                    onChange={(e) => setTableFormData({ ...tableFormData, width: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alto (px)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="200"
                    value={tableFormData.height}
                    onChange={(e) => setTableFormData({ ...tableFormData, height: parseInt(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeTableModal}
                  className="flex-1 btn btn-secondary px-6 py-4 min-h-[48px] text-base font-medium"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn btn-primary px-6 py-4 min-h-[48px] text-base font-medium">
                  {editingTable ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Salón */}
      {isSalonModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingSalon ? 'Editar Salón' : 'Nuevo Salón'}
              </h2>
              <button
                onClick={closeSalonModal}
                className="text-gray-400 hover:text-gray-600 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSalonSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={salonFormData.name}
                  onChange={(e) => setSalonFormData({ ...salonFormData, name: e.target.value })}
                  className="input"
                  placeholder="Salón principal, Terraza..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={salonFormData.description}
                  onChange={(e) => setSalonFormData({ ...salonFormData, description: e.target.value })}
                  className="input resize-none"
                  placeholder="Descripción del salón (opcional)"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeSalonModal}
                  className="flex-1 btn btn-secondary px-6 py-4 min-h-[48px] text-base font-medium"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn btn-primary px-6 py-4 min-h-[48px] text-base font-medium">
                  {editingSalon ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;

