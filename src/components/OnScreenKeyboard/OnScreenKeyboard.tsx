import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOnScreenKeyboard } from '../../contexts/OnScreenKeyboardContext';
import { useConfig } from '../../contexts/ConfigContext';

const keyRows = [
  ['1','2','3','4','5','6','7','8','9','0'],
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

const OnScreenKeyboard: React.FC = () => {
  const { isOpen, currentValue, insertText, backspace, moveCaret, commit, cancel } = useOnScreenKeyboard();
  const { config } = useConfig();
  
  // Si el teclado en pantalla está deshabilitado, no mostrar nada
  if (!config.enableOnScreenKeyboard) {
    return null;
  }
  const [isShift, setIsShift] = useState(false);

  const rows = useMemo(() => (
    keyRows.map(r => r.map(k => isShift ? k.toUpperCase() : k))
  ), [isShift]);

  // posición y tamaño persistentes
  const LS_KEY = 'osk:possize:v1';
  const [pos, setPos] = useState<{x:number;y:number}>(() => ({ x: 20, y: window.innerHeight - 400 }));
  const [size, setSize] = useState<{w:number;h:number}>(() => ({ w: 980, h: 360 }));
  const dragRef = useRef<{dragging:boolean;dx:number;dy:number}>({ dragging: false, dx: 0, dy: 0 });
  const resizeRef = useRef<{dir:null|"right"|"bottom"|"corner";startX:number;startY:number;startW:number;startH:number}>({ dir: null, startX: 0, startY: 0, startW: 0, startH: 0 });

  // Calcular altura dinámica de los botones
  const headerHeight = 48; // altura del header
  const padding = 24; // padding total (12px arriba + 12px abajo)
  const gap = 8; // gap entre filas
  const numRows = 5; // número total de filas (4 filas de teclas + 1 fila de botones especiales)
  const availableHeight = size.h - headerHeight - padding - (gap * (numRows - 1));
  // Usar un factor de reducción para asegurar que quepan todos los botones
  const buttonHeight = Math.max(28, Math.min(60, Math.floor(availableHeight / numRows * 0.9))); // altura mínima 28px, máxima 60px, con 10% de margen

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const { x, y, w, h } = JSON.parse(raw);
        if (Number.isFinite(x) && Number.isFinite(y)) setPos({ x, y });
        if (Number.isFinite(w) && Number.isFinite(h)) setSize({ w, h });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ x: pos.x, y: pos.y, w: size.w, h: size.h }));
    } catch {}
  }, [pos, size]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current.dragging) {
        const nextX = e.clientX - dragRef.current.dx;
        const nextY = e.clientY - dragRef.current.dy;
        const maxX = window.innerWidth - size.w - 10;
        const maxY = window.innerHeight - size.h - 10;
        setPos({ x: Math.max(10, Math.min(nextX, maxX)), y: Math.max(10, Math.min(nextY, maxY)) });
      } else if (resizeRef.current.dir) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        const minW = 600;
        const minH = 320; // Aumentar altura mínima para asegurar que quepan todos los botones
        if (resizeRef.current.dir === 'right') {
          setSize(s => ({ w: Math.max(minW, resizeRef.current.startW + dx), h: s.h }));
        } else if (resizeRef.current.dir === 'bottom') {
          setSize(s => ({ w: s.w, h: Math.max(minH, resizeRef.current.startH + dy) }));
        } else if (resizeRef.current.dir === 'corner') {
          setSize({
            w: Math.max(minW, resizeRef.current.startW + dx),
            h: Math.max(minH, resizeRef.current.startH + dy),
          });
        }
      }
    };
    const onUp = () => {
      dragRef.current.dragging = false;
      resizeRef.current.dir = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [size.w, size.h]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[2000]">
      <div
        className="absolute bg-white rounded-2xl shadow-2xl border pointer-events-auto select-none"
        style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      >
        <div
          className="px-4 py-2 border-b flex items-center justify-between cursor-move rounded-t-2xl bg-gray-50"
          onMouseDown={(e) => {
            dragRef.current = { dragging: true, dx: e.clientX - pos.x, dy: e.clientY - pos.y };
          }}
        >
          <div className="text-sm text-gray-700 font-medium">Entrada de texto</div>
          <div className="flex items-center gap-2">
            <div className="text-gray-400 text-xs max-w-[420px] truncate">{currentValue}</div>
            <button className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1" onClick={cancel}>Cerrar</button>
          </div>
        </div>
        <div className="p-3 h-[calc(100%-48px)] overflow-auto">
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
            {rows[0].map(key => (
              <button 
                key={key} 
                className="rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg flex items-center justify-center" 
                style={{ height: buttonHeight }}
                onClick={() => insertText(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
            {rows[1].map(key => (
              <button 
                key={key} 
                className="rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg flex items-center justify-center" 
                style={{ height: buttonHeight }}
                onClick={() => insertText(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>
            <button 
              className={`rounded ${isShift ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'} text-sm col-span-2 flex items-center justify-center`} 
              style={{ height: buttonHeight }}
              onClick={() => setIsShift(v => !v)}
            >
              Shift
            </button>
            {rows[2].map(key => (
              <button 
                key={key} 
                className="rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg flex items-center justify-center" 
                style={{ height: buttonHeight }}
                onClick={() => insertText(key)}
              >
                {key}
              </button>
            ))}
            <button 
              className="rounded bg-gray-100 hover:bg-gray-200 text-sm col-span-2 flex items-center justify-center" 
              style={{ height: buttonHeight }}
              onClick={backspace}
            >
              ⌫
            </button>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(11, minmax(0, 1fr))' }}>
            <button 
              className="rounded bg-gray-100 hover:bg-gray-200 text-sm col-span-2 flex items-center justify-center" 
              style={{ height: buttonHeight }}
              onClick={() => moveCaret(-1)}
            >
              ◀
            </button>
            {rows[3].map(key => (
              <button 
                key={key} 
                className="rounded bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg flex items-center justify-center" 
                style={{ height: buttonHeight }}
                onClick={() => insertText(key)}
              >
                {key}
              </button>
            ))}
            <button 
              className="rounded bg-gray-100 hover:bg-gray-200 text-sm col-span-2 flex items-center justify-center" 
              style={{ height: buttonHeight }}
              onClick={() => moveCaret(1)}
            >
              ▶
            </button>
          </div>
          <div className="grid gap-2 mt-2 items-stretch" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}>
            <div className="col-span-2" />
            <button 
              className="col-span-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center" 
              style={{ height: buttonHeight }}
              onClick={() => insertText(' ')}
            >
              Espacio
            </button>
            <button 
              className="col-span-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center" 
              style={{ height: buttonHeight }}
              onClick={() => insertText('\n')}
            >
              Enter
            </button>
            <button 
              className="col-span-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center" 
              style={{ height: buttonHeight }}
              onClick={commit}
            >
              Aceptar
            </button>
          </div>
        </div>

        {/* manejadores de redimensión */}
        <div className="absolute right-0 top-0 h-full w-2 cursor-ew-resize" onMouseDown={(e) => {
          resizeRef.current = { dir: 'right', startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
        }} />
        <div className="absolute left-0 bottom-0 w-full h-2 cursor-ns-resize" onMouseDown={(e) => {
          resizeRef.current = { dir: 'bottom', startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
        }} />
        <div className="absolute right-0 bottom-0 w-3 h-3 cursor-nwse-resize" onMouseDown={(e) => {
          resizeRef.current = { dir: 'corner', startX: e.clientX, startY: e.clientY, startW: size.w, startH: size.h };
        }} />
      </div>
    </div>
  );
};

export default OnScreenKeyboard;


