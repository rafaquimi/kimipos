import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClosedTicket } from '../types/Ticket';

interface ClosedTicketsContextType {
  closedTickets: ClosedTicket[];
  addClosedTicket: (ticket: ClosedTicket) => void;
  getClosedTicket: (id: string) => ClosedTicket | undefined;
  searchClosedTickets: (query: string) => ClosedTicket[];
  clearClosedTickets: () => void;
}

const ClosedTicketsContext = createContext<ClosedTicketsContextType | undefined>(undefined);

export const useClosedTickets = () => {
  const context = useContext(ClosedTicketsContext);
  if (!context) {
    throw new Error('useClosedTickets must be used within a ClosedTicketsProvider');
  }
  return context;
};

interface ClosedTicketsProviderProps {
  children: React.ReactNode;
}

export const ClosedTicketsProvider: React.FC<ClosedTicketsProviderProps> = ({ children }) => {
  const [closedTickets, setClosedTickets] = useState<ClosedTicket[]>([]);

  // Cargar tickets cerrados del localStorage al inicializar
  useEffect(() => {
    const savedTickets = localStorage.getItem('closedTickets');
    if (savedTickets) {
      try {
        const parsedTickets = JSON.parse(savedTickets);
        // Convertir las fechas de string a Date
        const ticketsWithDates = parsedTickets.map((ticket: any) => ({
          ...ticket,
          closedAt: new Date(ticket.closedAt)
        }));
        setClosedTickets(ticketsWithDates);
      } catch (error) {
        console.error('Error loading closed tickets:', error);
      }
    }
  }, []);

  // Guardar tickets en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('closedTickets', JSON.stringify(closedTickets));
  }, [closedTickets]);

  const addClosedTicket = (ticket: ClosedTicket) => {
    setClosedTickets(prev => [ticket, ...prev]);
  };

  const getClosedTicket = (id: string) => {
    return closedTickets.find(ticket => ticket.id === id);
  };

  const searchClosedTickets = (query: string) => {
    if (!query.trim()) return closedTickets;
    
    const lowerQuery = query.toLowerCase();
    return closedTickets.filter(ticket => 
      ticket.ticketId.toLowerCase().includes(lowerQuery) ||
      ticket.tableNumber.toLowerCase().includes(lowerQuery) ||
      (ticket.customerName && ticket.customerName.toLowerCase().includes(lowerQuery)) ||
      ticket.orderItems.some(item => item.productName.toLowerCase().includes(lowerQuery))
    );
  };

  const clearClosedTickets = () => {
    setClosedTickets([]);
    localStorage.removeItem('closedTickets');
  };

  const value: ClosedTicketsContextType = {
    closedTickets,
    addClosedTicket,
    getClosedTicket,
    searchClosedTickets,
    clearClosedTickets
  };

  return (
    <ClosedTicketsContext.Provider value={value}>
      {children}
    </ClosedTicketsContext.Provider>
  );
};
