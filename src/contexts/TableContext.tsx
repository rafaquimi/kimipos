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
	modifiers?: string[];
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
	addOrderToTable: (tableId: string, orderTotal: number, orderItems?: OrderItem[], assignedCustomer?: any) => void;
	clearTableOrder: (tableId: string) => void;
	getTableById: (tableId: string) => TableData | undefined;
	getTableOrderItems: (tableId: string) => OrderItem[];
	addTable: (table: TableData) => void;
	removeTable: (tableId: string) => boolean;
	updateTablePosition: (tableId: string, x: number, y: number) => void;
	updateTableRotation: (tableId: string, rotation: number) => void;
	// Unión de mesas
	mergeTables: (table1Id: string, table2Id: string) => void;
	unmergeTables: (tableId: string) => void;
	forceUnmergeTable: (tableId: string) => void;
	getTableMergeGroup: (tableId: string) => TableData[];
	// Nombres temporales
	updateTableTemporaryName: (tableId: string, temporaryName: string | null) => void;
	// Decoración
	addDecor: (item: DecorData) => void;
	updateDecorPosition: (id: string, x: number, y: number) => void;
	updateDecorRotation: (id: string, rotation: number) => void;
	// Cuentas por nombre
	addNamedAccount: (customerName: string) => string;
	removeNamedAccount: (accountId: string) => void;
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
						rotation: t.rotation || 0,
						occupiedSince: t.occupiedSince ? new Date(t.occupiedSince) : undefined
					})),
					// Migrar decoraciones antiguas (propiedad "type") a la nueva propiedad "kind"
					decor: (s.decor || []).map((d: any) => ({
						id: d.id,
						kind: (d.kind || d.type) ?? 'plant',
						x: d.x ?? 100,
						y: d.y ?? 100,
						rotation: d.rotation || 0,
						width: d.width,
						height: d.height,
					}))
				}));
				
				// Asegurar que el salón "Cuentas por nombre" siempre exista
				const hasNamedAccountsSalon = restored.some(s => s.id === 'named-accounts');
				if (!hasNamedAccountsSalon) {
					const namedAccountsSalon: SalonData = {
						id: 'named-accounts',
						name: 'Cuentas por nombre',
						width: 800,
						height: 600,
						tables: [],
						decor: []
					};
					restored.push(namedAccountsSalon);
				}
				
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
						{ id: '4', number: '4', name: 'Terraza', status: 'available', x: 350, y: 200, capacity: 4 },
						{ id: '5', number: '5', name: 'VIP', status: 'available', x: 120, y: 350, capacity: 8 },
						{ id: '6', number: '6', status: 'available', x: 300, y: 320, capacity: 2 }
					],
					decor: []
				};
				
				const namedAccountsSalon: SalonData = {
					id: 'named-accounts',
					name: 'Cuentas por nombre',
					width: 800,
					height: 600,
					tables: [],
					decor: []
				};
				
				setSalons([initialSalon, namedAccountsSalon]);
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
		// Determinar en qué salón está la mesa
		const isNamedAccount = tableId.startsWith('account-');
		const targetSalonId = isNamedAccount ? 'named-accounts' : activeSalonId;
		
		setSalons(prev => prev.map(s => s.id !== targetSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? ({
				...t,
				status,
				occupiedSince: status === 'occupied' ? new Date() : undefined,
				currentOrder: orderData || t.currentOrder
			}) : t)
		})));
	};

	const addOrderToTable = (tableId: string, orderTotal: number, orderItems?: OrderItem[], assignedCustomer?: any) => {
		console.log('Añadiendo pedido a mesa:', tableId, orderItems, assignedCustomer);
		
		// Determinar en qué salón está la mesa
		const isNamedAccount = tableId.startsWith('account-');
		const targetSalonId = isNamedAccount ? 'named-accounts' : activeSalonId;
		
		// Obtener los productos existentes en la mesa
		const existingItems = getTableOrderItems(tableId);
		const combinedItems = orderItems ? [...existingItems, ...orderItems] : existingItems;
		const combinedTotal = combinedItems.reduce((sum, item) => sum + item.totalPrice, 0);
		
		setSalons(prev => prev.map(s => s.id !== targetSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? ({
				...t,
				status: 'occupied',
				occupiedSince: new Date(),
				currentOrder: { id: `order-${Date.now()}`, total: combinedTotal, itemCount: combinedItems.length },
				assignedCustomer: assignedCustomer || t.assignedCustomer, // Mantener cliente existente si no se proporciona uno nuevo
				temporaryName: assignedCustomer ? undefined : t.temporaryName // Eliminar nombre temporal si se asigna un cliente
			}) : t)
		})));

		if (orderItems) {
			setTableOrderItems(prev => {
				const newItems = { ...prev, [tableId]: combinedItems };
				console.log('Guardando pedidos combinados:', newItems);
				return newItems;
			});
		}
	};

	const clearTableOrder = (tableId: string) => {
		const table = getTableById(tableId);
		let tablesToClear = [tableId];

		// Si la mesa está unida, obtener todas las mesas del grupo
		if (table && table.mergeGroup) {
			const mergeGroup = getTableMergeGroup(tableId);
			tablesToClear = mergeGroup.map(t => t.id);
		}

		// Si es una cuenta por nombre, eliminarla completamente del salón
		if (tableId.startsWith('account-')) {
			removeNamedAccount(tableId);
			return;
		}

		// Limpiar todas las mesas del grupo (o solo la mesa individual)
		// Determinar en qué salón está la mesa
		const isNamedAccount = tableId.startsWith('account-');
		const targetSalonId = isNamedAccount ? 'named-accounts' : activeSalonId;
		
		setSalons(prev => prev.map(s => s.id !== targetSalonId ? s : ({
			...s,
			tables: s.tables.map(t => tablesToClear.includes(t.id) ? ({
				...t,
				status: 'available',
				occupiedSince: undefined,
				currentOrder: undefined,
				temporaryName: undefined, // Limpiar nombre temporal al cobrar
				assignedCustomer: undefined, // Limpiar cliente asignado al cobrar
				// Al cobrar, automáticamente desunir las mesas
				mergedWith: undefined,
				isMaster: undefined,
				mergeGroup: undefined
			}) : t)
		})));

		// Limpiar los items de todas las mesas del grupo
		setTableOrderItems(prev => {
			const n = { ...prev };
			tablesToClear.forEach(tId => {
				delete n[tId];
			});
			return n;
		});
	};


	const getTableById = (tableId: string) => {
		// Buscar en todos los salones, no solo en el activo
		for (const salon of salons) {
			const table = salon.tables.find(t => t.id === tableId);
			if (table) return table;
		}
		return undefined;
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
		
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? { ...t, x: validX, y: validY } : t)
		})));
	};

	const updateTableRotation = (tableId: string, rotation: number) => {
		// Validar que la rotación sea un número válido
		const validRotation = isNaN(rotation) ? 0 : rotation;
		
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? { ...t, rotation: validRotation } : t)
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

	const updateDecorRotation = (id: string, rotation: number) => {
		// Validar que la rotación sea un número válido
		const validRotation = isNaN(rotation) ? 0 : rotation;
		
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			decor: s.decor.map(d => d.id === id ? { ...d, rotation: validRotation } : d)
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

	// Funciones de unión de mesas
	const mergeTables = (table1Id: string, table2Id: string) => {
		// Obtener el grupo de unión actual de la mesa principal
		const masterTable = getTableById(table1Id);
		let mergeGroupId = masterTable?.mergeGroup;
		
		// Si la mesa principal no tiene grupo, crear uno nuevo
		if (!mergeGroupId) {
			mergeGroupId = `merge-${table1Id}-${Date.now()}`;
		}

		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => {
				if (t.id === table1Id) {
					return {
						...t,
						mergedWith: table2Id,
						isMaster: true,
						mergeGroup: mergeGroupId
					};
				}
				if (t.id === table2Id) {
					return {
						...t,
						mergedWith: table1Id,
						isMaster: false,
						mergeGroup: mergeGroupId
					};
				}
				return t;
			})
		})));

		// Combinar los pedidos de la mesa 2 en la mesa 1
		const table1Items = getTableOrderItems(table1Id);
		const table2Items = getTableOrderItems(table2Id);
		const combinedItems = [...table1Items, ...table2Items];

		if (combinedItems.length > 0) {
			const totalCombined = combinedItems.reduce((sum, item) => sum + item.totalPrice, 0);
			
			// Actualizar la mesa principal con el pedido combinado
			setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
				...s,
				tables: s.tables.map(t => t.id === table1Id ? ({
					...t,
					status: 'occupied',
					currentOrder: { 
						id: `merged-order-${Date.now()}`, 
						total: totalCombined, 
						itemCount: combinedItems.length 
					}
				}) : t)
			})));

			// Guardar los items combinados en la mesa principal
			setTableOrderItems(prev => ({
				...prev,
				[table1Id]: combinedItems,
				[table2Id]: [] // Limpiar la mesa secundaria
			}));
		}
	};

	const unmergeTables = (tableId: string) => {
		const table = getTableById(tableId);
		if (!table || !table.mergedWith) return;

		const mergedTableId = table.mergedWith;
		
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => {
				if (t.id === tableId || t.id === mergedTableId) {
					return {
						...t,
						mergedWith: undefined,
						isMaster: undefined,
						mergeGroup: undefined
					};
				}
				return t;
			})
		})));

		// Si hay pedidos, mantenerlos solo en la mesa principal
		if (table.isMaster) {
			// La mesa principal mantiene todos los pedidos
		} else {
			// Si estamos desuniendo desde la mesa secundaria, limpiarla
			setTableOrderItems(prev => {
				const newItems = { ...prev };
				delete newItems[tableId];
				return newItems;
			});
		}
	};

	// Función para limpiar completamente el estado de unión de una mesa
	const forceUnmergeTable = (tableId: string) => {
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => {
				if (t.id === tableId) {
					return {
						...t,
						mergedWith: undefined,
						isMaster: undefined,
						mergeGroup: undefined
					};
				}
				return t;
			})
		})));
	};

	// Función para actualizar el nombre temporal de una mesa
	const updateTableTemporaryName = (tableId: string, temporaryName: string | null) => {
		setSalons(prev => prev.map(s => s.id !== activeSalonId ? s : ({
			...s,
			tables: s.tables.map(t => t.id === tableId ? {
				...t,
				temporaryName: temporaryName
			} : t)
		})));
	};

	const getTableMergeGroup = (tableId: string): TableData[] => {
		const table = getTableById(tableId);
		if (!table || !table.mergeGroup) return [table];

		return activeSalon?.tables.filter(t => t.mergeGroup === table.mergeGroup) || [];
	};

	// Funciones para cuentas por nombre
	const addNamedAccount = (customerName: string): string => {
		// Verificar si ya existe una cuenta con ese nombre
		const existingAccount = salons
			.find(s => s.id === 'named-accounts')
			?.tables.find(t => t.name === customerName);
		
		if (existingAccount) {
			throw new Error(`Ya existe una cuenta para ${customerName}`);
		}

		// Obtener las cuentas existentes para calcular la posición
		const existingAccounts = salons
			.find(s => s.id === 'named-accounts')
			?.tables || [];
		
		// Calcular posición en fila (4 cuentas por fila)
		const accountsPerRow = 4;
		const row = Math.floor(existingAccounts.length / accountsPerRow);
		const col = existingAccounts.length % accountsPerRow;
		
		// Posiciones base para las cuentas (ajustar según el tamaño del salón)
		const baseX = 120;
		const baseY = 120;
		const spacingX = 120; // Espacio horizontal entre cuentas
		const spacingY = 120; // Espacio vertical entre filas

		const accountId = `account-${Date.now()}`;
		const newAccount: TableData = {
			id: accountId,
			number: customerName,
			name: customerName,
			status: 'occupied',
			x: baseX + (col * spacingX),
			y: baseY + (row * spacingY),
			capacity: 1,
			occupiedSince: new Date(),
			temporaryName: customerName
		};

		setSalons(prev => prev.map(s => s.id !== 'named-accounts' ? s : ({
			...s,
			tables: [...s.tables, newAccount]
		})));

		return accountId;
	};

	const removeNamedAccount = (accountId: string) => {
		setSalons(prev => prev.map(s => s.id !== 'named-accounts' ? s : ({
			...s,
			tables: s.tables.filter(t => t.id !== accountId)
		})));

		// Limpiar pedidos asociados
		setTableOrderItems(prev => {
			const newItems = { ...prev };
			delete newItems[accountId];
			return newItems;
		});
	};

	const value: TableContextType = {
		salons,
		activeSalonId,
		setActiveSalon: setActiveSalonId,
		tables: activeSalon?.tables || [], // Solo mesas del salón activo
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
		updateTableRotation,
		mergeTables,
		unmergeTables,
		forceUnmergeTable,
		getTableMergeGroup,
		updateTableTemporaryName,
		addDecor,
		updateDecorPosition,
		updateDecorRotation,
		addNamedAccount,
		removeNamedAccount
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
