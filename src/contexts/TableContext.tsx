import React, { createContext, useContext, useEffect, useState } from 'react';
import { TableData } from '../components/Table/TableComponent';
import { DecorData } from '../components/Decor/DecorItem';

interface OrderItem {
	productId: string;
	productName: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	status: string;
}

export interface SalonData {
	id: string;
	name: string;
	width: number;
	height: number;
	tables: TableData[];
	decor: DecorData[];
}

interface TableContextType {
	salons: SalonData[];
	activeSalonId: string;
	setActiveSalon: (salonId: string) => void;
	// Derivados del salón activo
	tables: TableData[];
	decor: DecorData[];
	// Gestión de salones
	addSalon: (name?: string) => string;
	removeSalon: (salonId: string) => void;
	renameSalon: (salonId: string, name: string) => void;
	// Mesas y pedidos
	updateTableStatus: (tableId: string, status: TableData['status'], orderData?: any) => void;
	addOrderToTable: (tableId: string, orderTotal: number, orderItems?: OrderItem[]) => void;
	clearTableOrder: (tableId: string) => void;
	getTableById: (tableId: string) => TableData | undefined;
	getTableOrderItems: (tableId: string) => OrderItem[];
	addTable: (table: TableData) => void;
	removeTable: (tableId: string) => boolean;
	updateTablePosition: (tableId: string, x: number, y: number) => void;
	// Decoración
	addDecor: (item: DecorData) => void;
	updateDecorPosition: (id: string, x: number, y: number) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [salons, setSalons] = useState<SalonData[]>([]);
	const [activeSalonId, setActiveSalonId] = useState<string>('salon-1');

	// Cargar desde localStorage
	useEffect(() => {
		try {
			const savedSalons = localStorage.getItem('kimipos_salons');
			const savedActive = localStorage.getItem('kimipos_active_salon');
			
			if (savedSalons) {
				const parsed: any[] = JSON.parse(savedSalons);
				const restored: SalonData[] = parsed.map((s: any) => ({
					...s,
					tables: (s.tables || []).map((t: any) => ({
						...t,
						occupiedSince: t.occupiedSince ? new Date(t.occupiedSince) : undefined
					})),
					decor: s.decor || []
				}));
				setSalons(restored);
			} else {
				// Datos iniciales solo si no hay nada guardado
				const initialSalon: SalonData = {
					id: 'salon-1',
					name: 'Salón Principal',
					width: 800,
					height: 600,
					tables: [
						{ id: '1', number: '1', name: 'Entrada', status: 'available', x: 100, y: 100, capacity: 4 },
						{ id: '2', number: '2', name: 'Ventana', status: 'available', x: 250, y: 120, capacity: 2 },
						{ id: '3', number: '3', name: 'Central', status: 'available', x: 180, y: 250, capacity: 6 },
						{ id: '4', number: '4', name: 'Terraza', status: 'reserved', x: 350, y: 200, capacity: 4 },
						{ id: '5', number: '5', name: 'VIP', status: 'available', x: 120, y: 350, capacity: 8 },
						{ id: '6', number: '6', status: 'available', x: 300, y: 320, capacity: 2 }
					],
					decor: []
				};
				setSalons([initialSalon]);
			}
			
			if (savedActive) {
				setActiveSalonId(savedActive);
			}
		} catch {}
	}, []);

	// Guardar en localStorage
	useEffect(() => {
		if (salons.length > 0) {
			try {
				localStorage.setItem('kimipos_salons', JSON.stringify(salons));
				localStorage.setItem('kimipos_active_salon', activeSalonId);
			} catch {}
		}
	}, [salons, activeSalonId]);

	// Pedidos por mesa (id mesa -> items)
	const [tableOrderItems, setTableOrderItems] = useState<Record<string, OrderItem[]>>({});

	// Cargar pedidos desde localStorage
	useEffect(() => {
		try {
			const savedOrders = localStorage.getItem('kimipos_table_orders');
			console.log('Cargando pedidos guardados:', savedOrders);
			if (savedOrders) {
				const parsed = JSON.parse(savedOrders);
				console.log('Pedidos parseados:', parsed);
				setTableOrderItems(parsed);
			} else {
				console.log('No hay pedidos guardados, usando datos demo');
				// Datos iniciales para demo
				setTableOrderItems({
					'2': [
						{ productId: '1', productName: 'Coca Cola', quantity: 2, unitPrice: 25.00, totalPrice: 50.00, status: 'pending' },
						{ productId: '3', productName: 'Corona', quantity: 1, unitPrice: 45.00, totalPrice: 45.00, status: 'pending' },
						{ productId: '5', productName: 'Jack Daniels', quantity: 1, unitPrice: 120.00, totalPrice: 120.00, status: 'pending' }
					]
				});
			}
		} catch {}
	}, []);

	// Guardar pedidos en localStorage
	useEffect(() => {
		if (Object.keys(tableOrderItems).length > 0) {
			try {
				localStorage.setItem('kimipos_table_orders', JSON.stringify(tableOrderItems));
			} catch {}
		}
	}, [tableOrderItems]);

	const activeSalon = salons.find(s => s.id === activeSalonId) || salons[0];

	const updateTableStatus = (tableId: string, status: TableData['status'], orderData?: any) => {
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? ({
				...t,
				status,
				occupiedSince: status === 'occupied' ? new Date() : undefined,
				currentOrder: orderData || t.currentOrder
			}) : t)
		})));
	};

	const addOrderToTable = (tableId: string, orderTotal: number, orderItems?: OrderItem[]) => {
		console.log('Añadiendo pedido a mesa:', tableId, orderItems);
		
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? ({
				...t,
				status: 'occupied',
				occupiedSince: new Date(),
				currentOrder: { id: `order-${Date.now()}`, total: orderTotal, itemCount: orderItems?.length || 1 }
			}) : t)
		})));

		if (orderItems) {
			setTableOrderItems(prev => {
				const newItems = { ...prev, [tableId]: orderItems };
				console.log('Guardando pedidos:', newItems);
				return newItems;
			});
		}
	};

	const clearTableOrder = (tableId: string) => {
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? ({
				...t,
				status: 'available',
				occupiedSince: undefined,
				currentOrder: undefined
			}) : t)
		})));

		setTableOrderItems(prev => {
			const n = { ...prev };
			delete n[tableId];
			return n;
		});
	};

	const getTableById = (tableId: string) => {
		return activeSalon?.tables.find(t => t.id === tableId);
	};

	const getTableOrderItems = (tableId: string) => tableOrderItems[tableId] || [];

	const addTable = (table: TableData) => {
		setSalons(prev => prev.map(s => {
			if (s.id !== activeSalonId) return s;
			const used = new Set(s.tables.map(t => parseInt(t.number)).filter(n => !Number.isNaN(n)));
			let next = Number.isNaN(parseInt(table.number)) ? 1 : parseInt(table.number);
			while (used.has(next)) next += 1;
			const id = table.id || `table-${Date.now()}`;
			return { ...s, tables: [...s.tables, { ...table, id, number: String(next) }] };
		}));
	};

	const removeTable = (tableId: string): boolean => {
		const table = getTableById(tableId);
		if (table && table.status === 'occupied') return false;
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({ ...s, tables: s.tables.filter(t => t.id !== tableId) })));
		setTableOrderItems(prev => { const n = { ...prev }; delete n[tableId]; return n; });
		return true;
	};

	const updateTablePosition = (tableId: string, x: number, y: number) => {
		// Validar que las coordenadas sean números válidos
		const validX = isNaN(x) ? 100 : x;
		const validY = isNaN(y) ? 100 : y;
		
		console.log('updateTablePosition called:', { tableId, x, y, validX, validY });
		
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? { ...t, x: validX, y: validY } : t)
		})));
	};

	const addDecor = (item: DecorData) => {
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({ ...s, decor: [...s.decor, item] })));
	};
	const updateDecorPosition = (id: string, x: number, y: number) => {
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			decor: s.decor.map(d => d.id === id ? { ...d, x, y } : d)
		})));
	};

	const addSalon = (name: string = `Salón ${salons.length + 1}`) => {
		const id = `salon-${Date.now()}`;
		setSalons(prev => [...prev, { id, name, width: 800, height: 600, tables: [], decor: [] }]);
		setActiveSalonId(id);
		return id;
	};
	const removeSalon = (salonId: string) => {
		setSalons(prev => prev.filter(s => s.id !== salonId));
		if (activeSalonId === salonId && salons.length > 1) setActiveSalonId(salons[0].id);
	};
	const renameSalon = (salonId: string, name: string) => {
		setSalons(prev => prev.map(s => s.id === salonId ? { ...s, name } : s));
	};

	const value: TableContextType = {
		salons,
		activeSalonId,
		setActiveSalon: setActiveSalonId,
		tables: activeSalon?.tables || [],
		decor: activeSalon?.decor || [],
		addSalon,
		removeSalon,
		renameSalon,
		updateTableStatus,
		addOrderToTable,
		clearTableOrder,
		getTableById,
		getTableOrderItems,
		addTable,
		removeTable,
		updateTablePosition,
		addDecor,
		updateDecorPosition
	};

	return (
		<TableContext.Provider value={value}>
			{children}
		</TableContext.Provider>
	);
};

export const useTables = () => {
	const context = useContext(TableContext);
	if (context === undefined) {
		throw new Error('useTables must be used within a TableProvider');
	}
	return context;
};
