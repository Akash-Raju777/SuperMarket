'use client';

import { useEffect, useState } from 'react';
import { api, Product, Offer } from '@/lib/api';
import { useSync } from '@/context/SyncContext';
import { 
  Plus, 
  Tag, 
  ToggleLeft, 
  ToggleRight, 
  AlertTriangle, 
  Percent, 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Edit,
  Trash2,
  X
} from 'lucide-react';

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const triggerSync = useSync('offers', loadData);
  useSync('products', loadData);
  
  // Searchable Product Combobox states
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Form states
  const [formProductId, setFormProductId] = useState('');
  const [formOfferType, setFormOfferType] = useState('PERCENTAGE');
  const [formDiscount, setFormDiscount] = useState(0);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleEdit = (o: Offer) => {
    setEditingOffer(o);
    setFormProductId(o.productId);
    setFormOfferType(o.offerType);
    setFormDiscount(o.discount);
    setFormStart(o.startDate);
    setFormEnd(o.endDate);
  };

  const handleCancelEdit = () => {
    setEditingOffer(null);
    setFormProductId('');
    setFormOfferType('PERCENTAGE');
    setFormDiscount(0);
    setFormStart('');
    setFormEnd('');
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer campaign?')) {
      return;
    }
    try {
      await api.deleteOffer(offerId);
      triggerSync('offers');
    } catch (err) {
      console.error('Failed to delete offer', err);
      alert('Error deleting campaign.');
    }
  };

  async function loadData() {
    try {
      const [prodList, offerList] = await Promise.all([
        api.getProducts(),
        api.getOffers()
      ]);
      setProducts(prodList);
      setOffers(offerList);
    } catch (err) {
      console.error('Failed to load campaigns data', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Pre-fill if productId search parameter is passed (e.g. from alerts recommendation)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const qProduct = new URLSearchParams(window.location.search).get('productId');
      if (qProduct) {
        setFormProductId(qProduct);
        const matched = products.find(p => p.id === qProduct);
        if (matched) {
          setFormEnd(matched.expDate);
          setFormStart(new Date().toISOString().split('T')[0]);
        }
      }
    }
  }, [products]);

  // Filter products that are "Near Expiry" (Yellow) or "Expired" (Red)
  const nearExpiryProducts = products.filter(p => {
    if (!p.expDate) return false;
    try {
      const exp = new Date(p.expDate);
      const today = new Date();
      exp.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diff = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return diffDays <= 30; // approaches expiry or expired
    } catch (e) {
      return false;
    }
  });

  const selectTargetProduct = (prod: Product) => {
    setFormProductId(prod.id || '');
    // Pre-fill date fields: start = today, end = product exp date!
    const today = new Date().toISOString().split('T')[0];
    setFormStart(today);
    setFormEnd(prod.expDate);
  };

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId || !formOfferType || !formStart || !formEnd) {
      alert('Please fill out all offer details.');
      return;
    }

    const matchedProduct = products.find(p => p.id === formProductId);
    if (!matchedProduct) {
      alert('Invalid Product ID selected.');
      return;
    }

    try {
      const offerPayload: Offer = {
        productId: formProductId,
        offerType: formOfferType,
        discount: Number(formDiscount),
        active: editingOffer ? editingOffer.active : true,
        startDate: formStart,
        endDate: formEnd
      };

      if (editingOffer) {
        await api.updateOffer(editingOffer.offerId!, offerPayload);
        setEditingOffer(null);
      } else {
        await api.createOffer(offerPayload);
      }

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      
      // Clear form
      setFormProductId('');
      setFormDiscount(0);
      setFormStart('');
      setFormEnd('');

      triggerSync('offers');
    } catch (err) {
      console.error('Failed to save offer campaign', err);
      alert('Error saving campaign.');
    }
  };

  const handleToggle = async (offerId: string) => {
    try {
      await api.toggleOffer(offerId);
      triggerSync('offers');
    } catch (err) {
      console.error('Failed to toggle campaign state', err);
      alert('Error changing campaign state.');
    }
  };

  if (loading && offers.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm font-medium">Loading Campaigns Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in text-slate-200">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Tag className="h-6 w-6 text-emerald-400" />
          Offers & Campaigns Management
        </h1>
        <p className="text-sm text-slate-400">Deploy custom checkout promotions to target near-expiry batches and increase sales velocity.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mb-10">
        
        {/* Left Side: Near-Expiry targeting alerts */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Targeting Opportunities (Near-Expiry Stock)
          </h2>
          
          {nearExpiryProducts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {nearExpiryProducts.map((p, idx) => {
                const isExpired = new Date(p.expDate) < new Date();
                return (
                  <div 
                    key={idx} 
                    className={`rounded-xl border p-4 bg-slate-900/30 backdrop-blur-sm shadow-md flex flex-col justify-between ${
                      isExpired ? 'border-rose-500/20' : 'border-amber-500/20'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="font-bold text-slate-200 block text-sm">{p.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isExpired ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        }`}>
                          {isExpired ? 'Expired' : 'Near Expiry'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-1">Brand: {p.brand} • SKU: {p.id}</p>
                      <p className="text-xs text-slate-400 mb-1">In Stock: <strong className="text-slate-200">{p.quantity} units</strong></p>
                      <p className="text-xs text-rose-400 mb-3 font-mono">Expires: {p.expDate}</p>
                    </div>
                    <button
                      onClick={() => selectTargetProduct(p)}
                      className="w-full text-xs font-semibold py-2.5 rounded-lg border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Create Promo Campaign</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-slate-900/10 py-12 text-center text-slate-500">
              <CheckCircle className="h-10 w-10 text-emerald-500/30 mx-auto mb-3" />
              <p className="text-sm font-medium">All products shelf life is safe.</p>
              <p className="text-xs text-slate-600 mt-1">No items approaching expiry within 30 days.</p>
            </div>
          )}
        </div>

        {/* Right Side: Create Offer form */}
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide border-b border-white/5 pb-3 mb-6">
              {editingOffer ? 'Edit Offer Campaign' : 'Create New Offer'}
            </h2>
            <form onSubmit={handleCreateOffer} className="space-y-4">
              
              <div className="space-y-1.5 relative">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Select Product (Searchable)</label>
                
                {/* Custom searchable dropdown trigger */}
                <div 
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus-within:border-emerald-500 transition-all cursor-pointer flex justify-between items-center"
                >
                  <span className="truncate">
                    {(() => {
                      const matched = products.find(p => p.id === formProductId);
                      return matched ? `${matched.name} (SKU: ${matched.id})` : '-- Choose Product --';
                    })()}
                  </span>
                  <span className="text-slate-500 text-xs font-semibold uppercase shrink-0">Search 🔍</span>
                </div>

                {/* Dropdown Overlay */}
                {showProductDropdown && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-2.5 shadow-2xl space-y-2">
                    <input
                      type="text"
                      placeholder="Type to filter products..."
                      className="w-full rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      value={productSearchTerm}
                      onChange={e => setProductSearchTerm(e.target.value)}
                      onClick={e => e.stopPropagation()} // Prevent closing dropdown on input click
                    />
                    
                    <div className="max-h-40 overflow-y-auto divide-y divide-white/5 pr-1">
                      {(() => {
                        const filtered = products.filter(p => 
                          p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                          (p.id && p.id.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
                          p.brand.toLowerCase().includes(productSearchTerm.toLowerCase())
                        );

                        if (filtered.length > 0) {
                          return filtered.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setFormProductId(p.id || '');
                                // Pre-fill dates if creating a new campaign
                                if (!editingOffer) {
                                  const today = new Date().toISOString().split('T')[0];
                                  setFormStart(today);
                                  setFormEnd(p.expDate);
                                }
                                setShowProductDropdown(false);
                                setProductSearchTerm('');
                              }}
                              className="w-full text-left p-2 hover:bg-white/5 transition-all text-xs flex justify-between items-center rounded-md cursor-pointer"
                            >
                              <div className="truncate pr-2">
                                <span className="font-bold text-slate-200 block truncate">{p.name}</span>
                                <span className="text-[10px] text-slate-400 block truncate">{p.brand} • SKU: {p.id}</span>
                              </div>
                              <span className="text-emerald-400 font-semibold shrink-0">${p.price.toFixed(2)}</span>
                            </button>
                          ));
                        }
                        return (
                          <p className="text-center text-slate-500 text-xs py-3">No products found</p>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Campaign Offer Type</label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                  value={formOfferType}
                  onChange={e => setFormOfferType(e.target.value)}
                >
                  <option value="PERCENTAGE">Percentage Discount (%)</option>
                  <option value="BOGO">Buy One Get One (BOGO)</option>
                  <option value="B2G1">Buy 2 Get 1 Free (B2G1)</option>
                  <option value="FIXED">Fixed Amount Discount ($)</option>
                </select>
              </div>

              {formOfferType !== 'BOGO' && formOfferType !== 'B2G1' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    {formOfferType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Fixed Discount Value ($)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={formOfferType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 5.00'}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-3 pr-8 text-sm text-white placeholder-slate-700 focus:border-emerald-500 focus:outline-none transition-all"
                      value={formDiscount || ''}
                      onChange={e => setFormDiscount(Number(e.target.value))}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                      {formOfferType === 'PERCENTAGE' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Start Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    value={formStart}
                    onChange={e => setFormStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">End Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    value={formEnd}
                    onChange={e => setFormEnd(e.target.value)}
                  />
                </div>
              </div>

              {submitSuccess && (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  Offer campaign activated successfully!
                </p>
              )}

              <div className="flex gap-4">
                {editingOffer && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {editingOffer ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{editingOffer ? 'Save Edits' : 'Activate Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Campaigns Table & Performance Indicators */}
      <div className="rounded-xl border border-white/5 bg-slate-900/20 overflow-hidden shadow-xl">
        <div className="bg-slate-900/80 px-6 py-4 border-b border-white/5">
          <h2 className="font-bold text-slate-200">Offers Registry & Performance</h2>
        </div>
        
        {offers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/20 text-slate-400">
                  <th className="px-6 py-3.5 font-semibold">Offer ID</th>
                  <th className="px-6 py-3.5 font-semibold">Product Name</th>
                  <th className="px-6 py-3.5 font-semibold">Offer Type</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Discount</th>
                  <th className="px-6 py-3.5 font-semibold">Validity Window</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Active Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Usage Count</th>
                  <th className="px-6 py-3.5 font-semibold text-right">
                    <span className="flex items-center justify-end gap-1">
                      Revenue Generated
                      <span title="Calculated from bills processed under active range">
                        <HelpCircle className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                      </span>
                    </span>
                  </th>
                  <th className="px-6 py-3.5 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o, idx) => {
                  const product = products.find(p => p.id === o.productId);
                  return (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-slate-300">{o.offerId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-slate-200 block">{product ? product.name : 'Unknown Product'}</span>
                          <span className="text-xs text-slate-400">SKU: {o.productId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{o.offerType}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-300">
                        {o.offerType === 'BOGO' ? 'Buy 1 Get 1' : o.offerType === 'B2G1' ? 'Buy 2 Get 1 Free' : o.offerType === 'PERCENTAGE' ? `${o.discount}%` : `$${o.discount.toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        {o.startDate} to {o.endDate}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5 justify-center">
                          <button
                            onClick={() => handleToggle(o.offerId!)}
                            className="focus:outline-none"
                          >
                            {o.active ? (
                              <ToggleRight className="h-8 w-8 text-emerald-500 cursor-pointer" />
                            ) : (
                              <ToggleLeft className="h-8 w-8 text-slate-600 cursor-pointer" />
                            )}
                          </button>
                          {o.active ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider animate-pulse">
                              Active Offer
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-200">
                        {o.usageCount || 0} times
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-emerald-400">
                        ${o.revenue?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(o)}
                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Edit Campaign"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(o.offerId!)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Campaign"
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tag className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="font-bold text-slate-300 mb-1">No offers registered</h3>
            <p className="text-xs text-slate-500 mt-1">Use the builder form above to select a product and run a sales campaign.</p>
          </div>
        )}
      </div>
    </div>
  );
}
