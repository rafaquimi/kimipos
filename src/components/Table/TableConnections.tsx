import React from 'react';
import { TableData } from './TableComponent';

interface TableConnectionsProps {
  tables: TableData[];
  scale?: number;
}

const TableConnections: React.FC<TableConnectionsProps> = ({ tables, scale = 1 }) => {
  // Función para generar colores únicos basados en mergeGroup
  const getMergeGroupColor = (mergeGroup: string) => {
    const colors = [
      '#8b5cf6', // purple
      '#6366f1', // indigo
      '#ec4899', // pink
      '#f97316', // orange
      '#06b6d4', // cyan
      '#10b981', // emerald
    ];
    
    const hash = mergeGroup.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Agrupar mesas por mergeGroup
  const mergeGroups = tables.reduce((groups, table) => {
    if (table.mergeGroup) {
      if (!groups[table.mergeGroup]) {
        groups[table.mergeGroup] = [];
      }
      groups[table.mergeGroup].push(table);
    }
    return groups;
  }, {} as Record<string, TableData[]>);

  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      style={{ zIndex: 5 }}
      width="100%" 
      height="100%"
    >
      {Object.entries(mergeGroups).map(([mergeGroup, groupTables]) => {
        if (groupTables.length < 2) return null;

        const color = getMergeGroupColor(mergeGroup);
        const masterTable = groupTables.find(t => t.isMaster);
        const secondaryTables = groupTables.filter(t => !t.isMaster);

        if (!masterTable) return null;

        const masterCenterX = (masterTable.x + 40) * scale; // 40 es la mitad del ancho de la mesa
        const masterCenterY = (masterTable.y + 40) * scale;

        return secondaryTables.map((secondaryTable, index) => {
          const secondaryCenterX = (secondaryTable.x + 40) * scale;
          const secondaryCenterY = (secondaryTable.y + 40) * scale;

          // Crear una línea curvada entre las mesas
          const midX = (masterCenterX + secondaryCenterX) / 2;
          const midY = (masterCenterY + secondaryCenterY) / 2;
          
          // Agregar curvatura para que no sea una línea recta
          const controlX = midX + (masterCenterY - secondaryCenterY) * 0.2;
          const controlY = midY + (secondaryCenterX - masterCenterX) * 0.2;

          return (
            <g key={`${mergeGroup}-${index}`}>
              {/* Línea de conexión */}
              <path
                d={`M ${masterCenterX} ${masterCenterY} Q ${controlX} ${controlY} ${secondaryCenterX} ${secondaryCenterY}`}
                stroke={color}
                strokeWidth="3"
                fill="none"
                strokeDasharray="6,4"
                opacity="0.8"
              />
              
              {/* Flecha en el extremo secundario */}
              <circle
                cx={secondaryCenterX}
                cy={secondaryCenterY}
                r="4"
                fill={color}
                opacity="0.9"
              />
              
              {/* Estrella en la mesa principal */}
              <circle
                cx={masterCenterX}
                cy={masterCenterY}
                r="6"
                fill="#fbbf24"
                opacity="0.9"
              />
              <text
                x={masterCenterX}
                y={masterCenterY + 2}
                textAnchor="middle"
                fontSize="8"
                fill="white"
                fontWeight="bold"
              >
                ★
              </text>
            </g>
          );
        });
      })}
    </svg>
  );
};

export default TableConnections;

