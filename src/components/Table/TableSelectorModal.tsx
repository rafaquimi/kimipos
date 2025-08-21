import React, { useState } from 'react';
import { X, Search, Filter, MapPin } from 'lucide-react';
import TableComponent, { TableData } from './TableComponent';
import DecorItem from '../Decor/DecorItem';
import TableConnections from './TableConnections';
import { useTables } from '../../contexts/TableContext';

interface TableSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (table: TableData) => void;
  selectedTableId?: string;
}

const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectTable,
  selectedTableId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { salons, activeSalonId, setActiveSalon, tables, decor } = useTables();

  const filteredTables = tables.filter(table => {
    const matchesSearch = !searchTerm || 
      table.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTableClick = (table: TableData) => {
    if (table.status === 'available' || table.status === 'occupied') {
      onSelectTable(table);
      onClose();
    }
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

        {/* Modal fullscreen */}
        <div className="inline-block w-full h-screen max-w-none my-0 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-none">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <MapPin className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Seleccionar Mesa</h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filtros */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              {/* Salón */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Salón</label>
                <select value={activeSalonId} onChange={(e) => setActiveSalon(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  {salons.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              {/* Búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar mesa por número o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              {/* Estado */}
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todas</option>
                  <option value="available">Disponibles</option>
                  <option value="occupied">Ocupadas</option>
                  <option value="reserved">Reservadas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Salón visual */}
          <div className="p-4 h-[calc(100vh-140px)]">
            <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-100">
                <div className="salon-canvas relative w-full h-full">
                  {decor.map((item) => (
                    <DecorItem key={item.id} item={item} />
                  ))}
                  
                  {/* Conexiones entre mesas unidas */}
                  <TableConnections tables={filteredTables} scale={1} />
                  
                  {filteredTables.map((table) => (
                    <TableComponent
                      key={table.id}
                      table={table}
                      isSelected={selectedTableId === table.id}
                      onClick={handleTableClick}
                      scale={1}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-green-500 rounded-full"></div><span>Disponible</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-red-500 rounded-full"></div><span>Ocupada</span></div>
              <div className="flex items-center space-x-2"><div className="w-4 h-4 bg-yellow-500 rounded-full"></div><span>Reservada</span></div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-purple-600"></div>
                <span>Mesas Unidas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs">★</div>
                <span>Mesa Principal</span>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Haz clic en una mesa disponible u ocupada para seleccionarla</p>
              <button onClick={onClose} className="btn btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSelectorModal;
