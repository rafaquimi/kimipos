import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Copy } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';
import { useProducts } from '../contexts/ProductContext';
import toast from 'react-hot-toast';

const TagInput: React.FC<{ value: string[]; onChange: (tags: string[]) => void; placeholder?: string }>= ({ value, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t) return;
    const next = Array.from(new Set([...value, t]));
    onChange(next);
    setInput('');
  };
  const removeTag = (tag: string) => {
    onChange(value.filter(v => v !== tag));
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            {tag}
            <button onClick={() => removeTag(tag)} className="ml-1 text-blue-500 hover:text-blue-700">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag(input);
          }
        }}
        placeholder={placeholder || 'Añadir...'}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <div className="text-xs text-gray-500 mt-1">Pulsa Enter para agregar</div>
    </div>
  );
};

const ModifiersPage: React.FC = () => {
  const { config, updateConfig, getModifiersForCategory } = useConfig();
  const { categories } = useProducts();
  const [localModifiers, setLocalModifiers] = useState(config.modifiers || { global: [], byCategory: {} });
  const [cloneFromCategory, setCloneFromCategory] = useState<string>('');

  useEffect(() => {
    setLocalModifiers(config.modifiers || { global: [], byCategory: {} });
  }, [config.modifiers]);

  const saveAll = () => {
    updateConfig({ modifiers: localModifiers });
    toast.success('Modificadores guardados');
  };

  const cloneToCategory = (targetCategoryId: string) => {
    if (!cloneFromCategory) {
      toast.error('Selecciona una categoría origen para clonar');
      return;
    }
    if (cloneFromCategory === targetCategoryId) {
      toast.error('El origen y destino no pueden ser iguales');
      return;
    }
    const source = localModifiers.byCategory[cloneFromCategory] || [];
    setLocalModifiers({
      ...localModifiers,
      byCategory: {
        ...localModifiers.byCategory,
        [targetCategoryId]: Array.from(new Set([...(localModifiers.byCategory[targetCategoryId] || []), ...source]))
      }
    });
    toast.success('Modificadores clonados');
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <SlidersHorizontal className="w-6 h-6 mr-2" /> Modificadores
          </h1>
          <button onClick={saveAll} className="btn btn-primary">Guardar</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Globales</h3>
            <TagInput
              value={localModifiers.global || []}
              onChange={(tags) => setLocalModifiers({ ...localModifiers, global: tags })}
              placeholder="Añade modificadores globales"
            />
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clonar entre categorías</h3>
            <div className="flex items-center gap-2">
              <select
                value={cloneFromCategory}
                onChange={(e) => setCloneFromCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Selecciona categoría origen</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="text-sm text-gray-500">Selecciona una categoría para copiar sus modificadores</div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Categoría</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium" style={{ color: cat.color }}>{cat.name}</div>
                  <button
                    onClick={() => cloneToCategory(cat.id)}
                    className="text-xs inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    title="Clonar modificadores desde la categoría seleccionada arriba"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Clonar de origen
                  </button>
                </div>
                <TagInput
                  value={localModifiers.byCategory?.[cat.id] || []}
                  onChange={(tags) => setLocalModifiers({
                    ...localModifiers,
                    byCategory: {
                      ...localModifiers.byCategory,
                      [cat.id]: tags
                    }
                  })}
                  placeholder={`Añadir modificadores para ${cat.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifiersPage;


