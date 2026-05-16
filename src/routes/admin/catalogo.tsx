import { createFileRoute } from '@tanstack/react-router';
import { Plus, Search, Edit2, Trash2, X, CloudUpload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api/products';
import { fetchCategories } from '@/lib/api/categories';

export const Route = createFileRoute('/admin/catalogo')({
  component: AdminCatalogoPage,
});

function AdminCatalogoPage() {
  const [search, setSearch] = useState('');
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '', category: '', price: '', description: '', image: '',
  });

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).then(([prods, cats]) => {
      setProductsList(prods);
      setCategories(cats);
      if (cats.length > 0) setFormData(f => ({ ...f, category: cats[0] }));
      setLoading(false);
    }).catch(console.error);
  }, []);

  const filtered = productsList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product: any = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, category: product.category, price: product.price.toString(), description: product.description, image: product.image });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: categories[0] || '', price: '', description: '', image: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      category: formData.category,
      image: formData.image || 'https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=600',
    };
    try {
      if (editingProduct) {
        const updated = await updateProduct(editingProduct.id, payload);
        setProductsList(productsList.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        const created = await createProduct(payload);
        setProductsList([created, ...productsList]);
      }
      handleCloseModal();
    } catch (e) {
      console.error(e);
      alert('Error al guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      setProductsList(productsList.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      alert('Error al eliminar el producto.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Catálogo</h2>
          <p className="text-muted-foreground">Administra los productos de tu tienda. ({productsList.length} productos)</p>
        </div>
        <button onClick={() => handleOpenModal()} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nombre o categoría..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => (
          <div key={p.id} className="group relative flex flex-row sm:flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
            <div className="w-32 shrink-0 sm:w-full sm:aspect-[4/3] overflow-hidden bg-muted">
              <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col p-3 sm:p-4 justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-primary mb-1 sm:mb-2">{p.category}</span>
                    <h3 className="font-semibold text-sm sm:text-base text-primary line-clamp-2 sm:line-clamp-1 leading-tight">{p.name}</h3>
                  </div>
                  <p className="font-serif text-sm sm:text-lg font-bold text-accent shrink-0">S/ {p.price}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2">{p.description}</p>
              </div>
              <div className="mt-3 sm:mt-4 flex gap-2 pt-3 sm:pt-4 border-t">
                <button onClick={() => handleOpenModal(p)} className="flex-1 inline-flex items-center justify-center rounded-md border bg-background h-8 px-3 text-xs font-medium transition-colors hover:bg-muted">
                  <Edit2 className="mr-1.5 h-3 w-3" /> Editar
                </button>
                <button onClick={() => handleDelete(p.id)} className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 h-8 w-8 text-red-600 transition-colors hover:bg-red-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No se encontraron productos.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-semibold">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={handleCloseModal} className="rounded-full p-1 hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="product-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nombre del producto</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Precio (S/)</label>
                    <input required type="number" step="0.1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Categoría</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Imagen (URL)</label>
                  <div className="flex items-center gap-4">
                    {formData.image
                      ? <div className="h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted border"><img src={formData.image} alt="Preview" className="h-full w-full object-cover" /></div>
                      : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted"><CloudUpload className="h-6 w-6 text-muted-foreground" /></div>
                    }
                    <input type="text" placeholder="https://..." value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                  </div>
                </div>
              </form>
            </div>
            <div className="border-t bg-muted/50 px-6 py-4 flex justify-end gap-2">
              <button type="button" onClick={handleCloseModal} className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">Cancelar</button>
              <button type="submit" form="product-form" disabled={saving} className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-60">
                {saving ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
