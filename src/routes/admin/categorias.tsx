import { createFileRoute } from '@tanstack/react-router';
import { Plus, Search, Edit2, Trash2, GripVertical, X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/lib/api/categories';

export const Route = createFileRoute('/admin/categorias')({
  component: CategoriasPage,
});

function CategoriasPage() {
  const [search, setSearch] = useState('');
  const [categoryList, setCategoryList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories().then(cats => {
      setCategoryList(cats);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filtered = categoryList.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  const handleOpenModal = (cat: string | null = null) => {
    setEditingCategory(cat);
    setCategoryName(cat || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingCategory(null); setCategoryName(''); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory, categoryName.trim());
        setCategoryList(categoryList.map(c => c === editingCategory ? categoryName.trim() : c));
      } else {
        await createCategory(categoryName.trim());
        setCategoryList([...categoryList, categoryName.trim()]);
      }
      handleCloseModal();
    } catch (e) {
      console.error(e);
      alert('Error al guardar la categoría.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${cat}"?`)) return;
    try {
      await deleteCategory(cat);
      setCategoryList(categoryList.filter(c => c !== cat));
    } catch (e) {
      console.error(e);
      alert('Error al eliminar la categoría.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categorías</h2>
          <p className="text-muted-foreground">Administra y ordena las categorías de tu menú.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar categoría..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4 bg-muted/30">
          <h3 className="font-medium text-sm text-muted-foreground">Listado de Categorías ({categoryList.length})</h3>
        </div>
        <div className="divide-y">
          {filtered.map((cat, index) => (
            <div key={cat} className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50 group">
              <div className="flex items-center gap-4">
                <button className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
                  <GripVertical className="h-5 w-5" />
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">{index + 1}</div>
                <div>
                  <p className="font-semibold">{cat}</p>
                  <p className="text-xs text-muted-foreground">Categoría activa</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleOpenModal(cat)} className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 text-xs font-medium transition-colors hover:bg-muted">
                  <Edit2 className="mr-1.5 h-3 w-3" /> Editar
                </button>
                <button onClick={() => handleDelete(cat)} className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 h-8 w-8 text-red-600 transition-colors hover:bg-red-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No se encontraron categorías.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button onClick={handleCloseModal} className="rounded-full p-1 hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <form id="category-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nombre de la Categoría</label>
                  <input required type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Ej. Postres"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
              </form>
            </div>
            <div className="border-t bg-muted/50 px-6 py-4 flex justify-end gap-2">
              <button type="button" onClick={handleCloseModal} className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">Cancelar</button>
              <button type="submit" form="category-form" disabled={saving} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-60">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
