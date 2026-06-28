'use client';

import { useEffect, useState } from 'react';
import { api, Product, DashboardStats } from '@/lib/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Image as ImageIcon,
  Check,
  Calendar,
  Layers,
  UploadCloud,
  X,
  LayoutGrid,
  List
} from 'lucide-react';

export default function ProductTrackerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    expiredProducts: 0,
    expiringSoonProducts: 0
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // Form states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formQty, setFormQty] = useState<number | ''>('');
  const [formMfg, setFormMfg] = useState('');
  const [formExp, setFormExp] = useState('');
  const [formArrival, setFormArrival] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');

  async function loadData() {
    try {
      const [prodList, productStats] = await Promise.all([
        api.getProducts(),
        api.getProductStats()
      ]);
      setProducts(prodList);
      setStats(productStats);
    } catch (err) {
      console.error('Failed to load products list', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormId('');
    setFormName('');
    setFormBrand('');
    setFormPrice('');
    setFormQty('');
    setFormMfg('');
    setFormExp('');
    setFormArrival('');
    setFormPhotoUrl('');
    setImageFile(null);
    setImagePreviewUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormId(p.id || '');
    setFormName(p.name);
    setFormBrand(p.brand);
    setFormPrice(p.price);
    setFormQty(p.quantity);
    setFormMfg(p.mfgDate);
    setFormExp(p.expDate);
    setFormArrival(p.arrivingDate);
    setFormPhotoUrl(p.photoUrl);
    setImageFile(null);
    setImagePreviewUrl(p.photoUrl.startsWith('/') ? `http://localhost:8080${p.photoUrl}` : p.photoUrl);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds the 50MB limit.');
        return;
      }
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formBrand || Number(formPrice) <= 0 || Number(formQty) < 0 || !formMfg || !formExp || !formArrival) {
      alert('Please fill out all product details correctly.');
      return;
    }

    setLoading(true);
    try {
      let finalPhotoUrl = formPhotoUrl;

      // Handle image upload first if a new file is selected
      if (imageFile) {
        setImageUploading(true);
        try {
          finalPhotoUrl = await api.uploadImage(imageFile);
        } catch (uploadErr) {
          alert('Failed to upload image. Using default placeholder.');
          finalPhotoUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300';
        } finally {
          setImageUploading(false);
        }
      }

      const productPayload: Product = {
        id: formId || undefined,
        name: formName,
        brand: formBrand,
        photoUrl: finalPhotoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
        mfgDate: formMfg,
        expDate: formExp,
        arrivingDate: formArrival,
        quantity: Number(formQty),
        price: Number(formPrice)
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id!, productPayload);
      } else {
        await api.createProduct(productPayload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to save product', err);
      alert('Error saving product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from database?')) {
      return;
    }

    setLoading(true);
    try {
      await api.deleteProduct(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Error deleting product.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine expiry color code
  const getExpiryStatus = (expDateStr: string) => {
    try {
      const expDate = new Date(expDateStr);
      const today = new Date();
      // Reset times to compare dates
      expDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { label: 'Expired', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', dot: 'bg-rose-500' };
      } else if (diffDays <= 30) {
        return { label: 'Near Expiry', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' };
      } else {
        return { label: 'Safe', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' };
      }
    } catch (e) {
      return { label: 'Unknown', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30', dot: 'bg-slate-500' };
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Products Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in text-slate-200">
      
      {/* Header section with Stats Cards */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-400" />
            Inventory Expiry Tracker
          </h1>
          <p className="text-sm text-slate-400">Track manufacture batches, audit expiration schedules, and upload product logs.</p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition-all hover:scale-[1.01]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Upload Product</span>
        </button>
      </div>

      {/* Expiry Dashboard Metric Panels */}
      <div className="grid gap-6 sm:grid-cols-3 mb-10">
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-sm font-medium text-slate-400 block">Total Goods Ledger</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">{stats.totalProducts}</span>
          </div>
          <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-sm font-medium text-slate-400 block">Expiring Soon (30d)</span>
            <span className="text-3xl font-extrabold text-amber-400 mt-1 block">{stats.expiringSoonProducts}</span>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-amber-400">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-sm font-medium text-rose-400 block">Expired Stock</span>
            <span className="text-3xl font-extrabold text-rose-400 mt-1 block">{stats.expiredProducts}</span>
          </div>
          <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Products Grid Board */}
      <div className="rounded-xl border border-white/5 bg-slate-900/20 overflow-hidden shadow-xl">
        <div className="bg-slate-900/80 px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-slate-200">Active Expiry Board</h2>
          <div className="flex items-center gap-2 border border-slate-700 bg-slate-950 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-emerald-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-emerald-500 text-slate-950 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
        
        {products.length > 0 ? (
          viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/20 text-slate-400">
                    <th className="px-6 py-3.5 font-semibold">Product Info</th>
                    <th className="px-6 py-3.5 font-semibold">Arriving Date</th>
                    <th className="px-6 py-3.5 font-semibold">MFG Date</th>
                    <th className="px-6 py-3.5 font-semibold">EXP Date</th>
                    <th className="px-6 py-3.5 font-semibold">Status Indicator</th>
                    <th className="px-6 py-3.5 font-semibold text-right">In Stock</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Price</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, idx) => {
                    const expiry = getExpiryStatus(p.expDate);
                    const isLow = p.quantity > 0 && p.quantity <= 5;
                    const isOut = p.quantity === 0;

                    return (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 flex items-center justify-center">
                              {p.photoUrl ? (
                                <img 
                                  src={p.photoUrl.startsWith('/') ? `http://localhost:8080${p.photoUrl}` : p.photoUrl} 
                                  alt={p.name} 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-200 block">{p.name}</span>
                              <span className="text-xs text-slate-400">{p.brand} • ID: {p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{p.arrivingDate}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{p.mfgDate}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono text-xs">{p.expDate}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${expiry.color}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${expiry.dot}`}></span>
                            {expiry.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-200'}`}>
                            {p.quantity} units
                          </span>
                          {isOut && <span className="block text-[10px] text-rose-500">Out of Stock</span>}
                          {isLow && <span className="block text-[10px] text-amber-500">Low Stock</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-200">
                          ${p.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id!)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p, idx) => {
                const expiry = getExpiryStatus(p.expDate);
                const isLow = p.quantity > 0 && p.quantity <= 5;
                const isOut = p.quantity === 0;
                
                // Represent stock meter (max 50 units for layout representation)
                const stockPercent = Math.min(100, (p.quantity / 50) * 100);

                return (
                  <div 
                    key={idx} 
                    className="group rounded-xl border border-white/5 bg-slate-900/40 overflow-hidden hover:border-white/10 hover:bg-slate-900/60 transition-all duration-300 flex flex-col justify-between shadow-lg"
                  >
                    {/* Image section with expiry badge overlay */}
                    <div className="h-48 w-full relative overflow-hidden bg-slate-950 flex items-center justify-center border-b border-white/5">
                      {p.photoUrl ? (
                        <img 
                          src={p.photoUrl.startsWith('/') ? `http://localhost:8080${p.photoUrl}` : p.photoUrl} 
                          alt={p.name} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-slate-700" />
                      )}
                      
                      {/* Badge overlay */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${expiry.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${expiry.dot}`}></span>
                          {expiry.label}
                        </span>
                      </div>

                      {/* Price badge overlay */}
                      <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 px-2.5 py-1 text-xs font-extrabold text-emerald-400 border border-emerald-500/20 backdrop-blur-sm">
                        ${p.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{p.brand}</span>
                        <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-emerald-400 transition-colors">{p.name}</h3>
                        <span className="text-xs text-slate-400 font-mono block">SKU: {p.id}</span>
                      </div>

                      {/* Dates section */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-b border-white/5 py-2.5 my-1">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">MFG Date</span>
                          <span className="font-semibold text-slate-300">{p.mfgDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">EXP Date</span>
                          <span className={`font-semibold ${expiry.label === 'Expired' ? 'text-rose-400' : expiry.label === 'Near Expiry' ? 'text-amber-400' : 'text-slate-300'}`}>{p.expDate}</span>
                        </div>
                      </div>

                      {/* Stock Visual Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Stock Available:</span>
                          <span className={`font-bold ${isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-200'}`}>
                            {p.quantity} units
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          ></div>
                        </div>
                        {isOut && <span className="block text-[10px] text-rose-500 font-medium">⚠️ Out of Stock</span>}
                        {isLow && <span className="block text-[10px] text-amber-500 font-medium">⚠️ Low Stock alert level</span>}
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="px-5 py-3 border-t border-white/5 bg-slate-950/40 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="rounded-lg border border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id!)}
                        className="rounded-lg border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-rose-500 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="font-bold text-slate-300 mb-1">No products registered</h3>
            <button 
              onClick={openAddModal}
              className="mt-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Add your first product now
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 text-slate-300 overflow-hidden shadow-2xl">
            
            {/* Modal Title */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
              <h2 className="font-bold text-white flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-emerald-400" />
                {editingProduct ? 'Edit Product Details' : 'Upload New Product Log'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Product Photo Upload Section */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Product Thumbnail Image (Up to 50MB)</label>
                <div className="flex gap-4 items-center">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 flex items-center justify-center relative">
                    {imagePreviewUrl ? (
                      <img src={imagePreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/5 px-4 py-2 text-xs font-semibold text-slate-200 cursor-pointer transition-colors">
                      <UploadCloud className="h-4 w-4" />
                      Select Local File
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange}
                      />
                    </label>
                    <span className="block text-[10px] text-slate-500 mt-1.5">Max size 50MB. Real-time base64 encoding fallback for dev.</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Product ID (SKU)</label>
                  <input
                    type="text"
                    placeholder="e.g. P112"
                    disabled={!!editingProduct}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-700 focus:border-emerald-500 focus:outline-none transition-all disabled:opacity-50"
                    value={formId}
                    onChange={e => setFormId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Chobani"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-700 focus:border-emerald-500 focus:outline-none transition-all"
                    value={formBrand}
                    onChange={e => setFormBrand(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Greek Yogurt Strawberry"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-700 focus:border-emerald-500 focus:outline-none transition-all"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4.99"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-700 focus:border-emerald-500 focus:outline-none transition-all"
                    value={formPrice}
                    onChange={e => {
                      const val = e.target.value;
                      setFormPrice(val === '' ? '' : Number(val));
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Quantity (Stock)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-700 focus:border-emerald-500 focus:outline-none transition-all"
                    value={formQty}
                    onChange={e => {
                      const val = e.target.value;
                      setFormQty(val === '' ? '' : Number(val));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Arriving Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      onClick={e => {
                        try { e.currentTarget.showPicker(); } catch (err) {}
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-8 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer transition-all [color-scheme:dark]"
                      value={formArrival}
                      onChange={e => setFormArrival(e.target.value)}
                    />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">MFG Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      onClick={e => {
                        try { e.currentTarget.showPicker(); } catch (err) {}
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-8 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer transition-all [color-scheme:dark]"
                      value={formMfg}
                      onChange={e => setFormMfg(e.target.value)}
                    />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">EXP Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      onClick={e => {
                        try { e.currentTarget.showPicker(); } catch (err) {}
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-8 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer transition-all [color-scheme:dark]"
                      value={formExp}
                      onChange={e => setFormExp(e.target.value)}
                    />
                    <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={imageUploading}
                  className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                >
                  <Check className="h-4 w-4" />
                  {imageUploading ? 'Uploading Image...' : editingProduct ? 'Save Edits' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
