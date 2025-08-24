import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, BalanceIncentive } from '../database/db';
import toast from 'react-hot-toast';

interface BalanceIncentiveContextType {
  incentives: BalanceIncentive[];
  allIncentives: BalanceIncentive[];
  isLoading: boolean;
  addIncentive: (incentive: Omit<BalanceIncentive, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<void>;
  updateIncentive: (id: number, incentive: Partial<BalanceIncentive>) => Promise<void>;
  deleteIncentive: (id: number) => Promise<void>;
  getIncentiveForPayment: (paymentAmount: number) => BalanceIncentive | null;
  refreshIncentives: () => void;
}

const BalanceIncentiveContext = createContext<BalanceIncentiveContextType | undefined>(undefined);

export const useBalanceIncentives = () => {
  const context = useContext(BalanceIncentiveContext);
  if (context === undefined) {
    throw new Error('useBalanceIncentives must be used within a BalanceIncentiveProvider');
  }
  return context;
};

export const BalanceIncentiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Cargar incentivos usando useLiveQuery para actualización automática
  const incentives = useLiveQuery(
    async () => {
      try {
        const allIncentives = await db.balanceIncentives.toArray();
        return allIncentives.filter(incentive => incentive.isActive === true);
      } catch (error) {
        console.error('Error cargando incentivos activos:', error);
        return [];
      }
    },
    []
  ) || [];

  // Cargar todos los incentivos (activos e inactivos) para la configuración
  const allIncentives = useLiveQuery(
    async () => {
      try {
        return await db.balanceIncentives.toArray();
      } catch (error) {
        console.error('Error cargando todos los incentivos:', error);
        return [];
      }
    },
    []
  ) || [];

  const addIncentive = async (incentiveData: Omit<BalanceIncentive, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    try {
      setIsLoading(true);
      
      // Calcular el bonus automáticamente
      const bonusAmount = incentiveData.totalBalance - incentiveData.customerPayment;
      
      const newIncentive: Omit<BalanceIncentive, 'id'> = {
        ...incentiveData,
        bonusAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'pending'
      };

      await db.balanceIncentives.add(newIncentive);
      toast.success('Incentivo agregado exitosamente');
    } catch (error) {
      console.error('Error agregando incentivo:', error);
      toast.error('Error al agregar el incentivo');
    } finally {
      setIsLoading(false);
    }
  };

  const updateIncentive = async (id: number, incentiveData: Partial<BalanceIncentive>) => {
    try {
      setIsLoading(true);
      
      // Si se actualizan los montos, recalcular el bonus
      if (incentiveData.customerPayment !== undefined || incentiveData.totalBalance !== undefined) {
        const currentIncentive = await db.balanceIncentives.get(id);
        if (currentIncentive) {
          const newCustomerPayment = incentiveData.customerPayment ?? currentIncentive.customerPayment;
          const newTotalBalance = incentiveData.totalBalance ?? currentIncentive.totalBalance;
          incentiveData.bonusAmount = newTotalBalance - newCustomerPayment;
        }
      }

      await db.balanceIncentives.update(id, {
        ...incentiveData,
        updatedAt: new Date(),
        syncStatus: 'pending'
      });
      toast.success('Incentivo actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando incentivo:', error);
      toast.error('Error al actualizar el incentivo');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteIncentive = async (id: number) => {
    try {
      setIsLoading(true);
      await db.balanceIncentives.delete(id);
      toast.success('Incentivo eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando incentivo:', error);
      toast.error('Error al eliminar el incentivo');
    } finally {
      setIsLoading(false);
    }
  };

  const getIncentiveForPayment = (paymentAmount: number): BalanceIncentive | null => {
    // Buscar el incentivo que coincida exactamente con el monto pagado
    return incentives.find(incentive => 
      incentive.customerPayment === paymentAmount
    ) || null;
  };

  const refreshIncentives = () => {
    // La función está vacía porque useLiveQuery se actualiza automáticamente
    // Pero la mantenemos por consistencia con otros contextos
  };

  // Función para inicializar incentivos de ejemplo (solo para desarrollo)
  const initializeSampleIncentives = async () => {
    try {
      // Verificar si la tabla existe
      await db.balanceIncentives.count();
      
      const existingIncentives = await db.balanceIncentives.count();
      if (existingIncentives === 0) {
        const sampleIncentives = [
          {
            customerPayment: 50,
            totalBalance: 65,
            bonusAmount: 15,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'pending' as const
          },
          {
            customerPayment: 100,
            totalBalance: 140,
            bonusAmount: 40,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'pending' as const
          },
          {
            customerPayment: 200,
            totalBalance: 300,
            bonusAmount: 100,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: 'pending' as const
          }
        ];

        for (const incentive of sampleIncentives) {
          await db.balanceIncentives.add(incentive);
        }
        console.log('Incentivos de ejemplo inicializados');
      }
    } catch (error) {
      console.error('Error inicializando incentivos de ejemplo:', error);
      // Si hay error, no hacer nada - la tabla puede no existir aún
    }
  };

  // Inicializar incentivos de ejemplo al cargar el contexto
  useEffect(() => {
    initializeSampleIncentives();
  }, []);

  const value: BalanceIncentiveContextType = {
    incentives,
    allIncentives,
    isLoading,
    addIncentive,
    updateIncentive,
    deleteIncentive,
    getIncentiveForPayment,
    refreshIncentives
  };

  return (
    <BalanceIncentiveContext.Provider value={value}>
      {children}
    </BalanceIncentiveContext.Provider>
  );
};
