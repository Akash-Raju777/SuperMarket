'use client';

import { useEffect, useState, useRef } from 'react';
import { api, Product, Offer, CheckoutResponse } from '@/lib/api';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Phone, 
  Tag, 
  Printer, 
  X, 
  CheckCircle,
  FileText,
  Calendar
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  selectedOffer?: Offer;
}

export default function BillingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [pointsBalance, setPointsBalance] = useState(0);
  const [customerExists, setCustomerExists] = useState(false);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<CheckoutResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Bills History States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [billsList, setBillsList] = useState<CheckoutResponse[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  const openHistoryModal = async () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setLoadingHistory(true);
    setIsHistoryOpen(true);
    try {
      const data = await api.getBills();
      setBillsList(data);
    } catch (err) {
      console.error('Failed to load bills history', err);
      alert('Failed to load billing history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const months = [
    { value: '', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYearVal = new Date().getFullYear();
  const years = [{ value: '', label: 'All Years' }];
  for (let y = currentYearVal; y >= 2024; y--) {
    years.push({ value: String(y), label: String(y) });
  }

  const filteredBills = billsList.filter(bill => {
    if (!bill.saleDate) return false;
    const [year, month, day] = bill.saleDate.split('-');
    
    if (filterDate && bill.saleDate !== filterDate) {
      return false;
    }
    if (filterMonth && month !== filterMonth) {
      return false;
    }
    if (filterYear && year !== filterYear) {
      return false;
    }
    if (historySearchTerm) {
      const term = historySearchTerm.toLowerCase();
      const matchId = bill.billId.toLowerCase().includes(term);
      const matchMobile = bill.customerMobile && bill.customerMobile.includes(term);
      const matchName = bill.customerName && bill.customerName.toLowerCase().includes(term);
      return matchId || matchMobile || matchName;
    }
    return true;
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debounceSearch = (query: string, searchType: 'mobile' | 'name') => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.getCustomer(query);
        if (res.exists) {
          setPointsBalance(res.points);
          setCustomerExists(true);
          if (searchType === 'mobile') {
            setCustomerName(res.name);
          } else {
            setCustomerMobile(res.mobile);
          }
        } else {
          setCustomerExists(false);
        }
      } catch (err) {
        console.error('Error searching customer', err);
        setCustomerExists(false);
      }
    }, 500);
  };

  const handleMobileChange = (val: string) => {
    setCustomerMobile(val);
    const clean = val.trim();
    if (clean.length >= 3) {
      debounceSearch(clean, 'mobile');
    } else {
      setPointsBalance(0);
      setCustomerExists(false);
      setRedeemPoints(false);
    }
  };

  const handleNameChange = (val: string) => {
    setCustomerName(val);
    const clean = val.trim();
    if (clean.length >= 3) {
      debounceSearch(clean, 'name');
    } else {
      setPointsBalance(0);
      setCustomerExists(false);
      setRedeemPoints(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [prodList, offerList] = await Promise.all([
          api.getProducts(),
          api.getOffers()
        ]);
        setProducts(prodList);
        setOffers(offerList);

        // Keep cart products, prices, and offer status in sync with latest db state
        setCart(prevCart => {
          return prevCart.map(item => {
            const latestProd = prodList.find(p => p.id === item.product.id);
            if (!latestProd) return item;
            
            let latestOffer = item.selectedOffer;
            if (item.selectedOffer) {
              const matchedOffer = offerList.find(o => o.offerId === item.selectedOffer?.offerId);
              latestOffer = matchedOffer && matchedOffer.active ? matchedOffer : undefined;
            } else {
              // Auto-apply if a new active offer has been created for this product
              const matchedOffer = offerList.find(o => o.productId === latestProd.id && o.active);
              if (matchedOffer) {
                latestOffer = matchedOffer;
              }
            }
            return {
              ...item,
              product: latestProd,
              selectedOffer: latestOffer
            };
          });
        });
      } catch (err) {
        console.error('Failed to load POS catalog', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 3000); // Poll every 3 seconds for real-time synchronization
    return () => clearInterval(interval);
  }, []);

  // Filter products by name or brand
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      alert('Product is out of stock!');
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.quantity) {
        alert(`Cannot add more. Only ${product.quantity} units available.`);
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      // Find active offers for this product
      const productOffer = offers.find(o => o.productId === product.id && o.active);
      setCart([...cart, { product, quantity: 1, selectedOffer: productOffer }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const updatedCart = cart.map(item => {
      if (item.product.id === productId) {
        const currentQty = Number(item.quantity) || 1;
        const newQty = currentQty + delta;
        if (newQty < 1) return item;
        if (newQty > item.product.quantity) {
          alert(`Cannot select more. Only ${item.product.quantity} units in stock.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const selectOffer = (productId: string, offerId: string) => {
    const updatedCart = cart.map(item => {
      if (item.product.id === productId) {
        const selected = offers.find(o => o.offerId === offerId);
        return { ...item, selectedOffer: selected };
      }
      return item;
    });
    setCart(updatedCart);
  };

  // Calculations
  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.product.price * (Number(item.quantity) || 0)), 0);
  };

  const calculateDiscount = () => {
    return cart.reduce((acc, item) => {
      if (!item.selectedOffer) return acc;
      const qty = Number(item.quantity) || 0;
      const originalLineTotal = item.product.price * qty;
      switch (item.selectedOffer.offerType.toUpperCase()) {
        case 'BOGO':
          const freeQty = Math.floor(qty / 2);
          return acc + (freeQty * item.product.price);
        case 'B2G1':
          const freeQtyB2G1 = Math.floor(qty / 3);
          return acc + (freeQtyB2G1 * item.product.price);
        case 'PERCENTAGE':
          return acc + (originalLineTotal * (item.selectedOffer.discount / 100));
        case 'FIXED':
          const discountVal = item.selectedOffer.discount * qty;
          return acc + (discountVal > originalLineTotal ? originalLineTotal : discountVal);
        default:
          return acc;
      }
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const productDiscount = calculateDiscount();
  const redemptionDiscount = redeemPoints ? (subtotal * 0.15) : 0;
  const discount = productDiscount + redemptionDiscount;
  const tax = Math.max(0, subtotal - discount) * 0.05;
  const grandTotal = Math.max(0, subtotal - discount) + tax;
  const getOfferSuggestions = () => {
    const suggestions: Array<{
      offer: Offer;
      product: Product;
      savings: number;
      type: 'eligible' | 'upsell';
      message: string;
    }> = [];

    cart.forEach(item => {
      const productOffers = offers.filter(o => o.productId === item.product.id && o.active);
      const qty = Number(item.quantity) || 0;
      
      productOffers.forEach(offer => {
        const isApplied = item.selectedOffer?.offerId === offer.offerId;
        
        if (offer.offerType === 'BOGO') {
          if (qty % 2 !== 0 && item.product.quantity > qty) {
            suggestions.push({
              offer,
              product: item.product,
              savings: item.product.price,
              type: 'upsell',
              message: `Add 1 more '${item.product.name}' to unlock Buy One Get One Free deal!`
            });
          }
          
          if (!isApplied && qty >= 2) {
            const freeQty = Math.floor(qty / 2);
            const savings = freeQty * item.product.price;
            suggestions.push({
              offer,
              product: item.product,
              savings,
              type: 'eligible',
              message: `BOGO available on '${item.product.name}'. Customer can save $${savings.toFixed(2)}.`
            });
          }
        } else if (offer.offerType === 'B2G1') {
          if (qty % 3 === 2 && item.product.quantity > qty) {
            suggestions.push({
              offer,
              product: item.product,
              savings: item.product.price,
              type: 'upsell',
              message: `Add 1 more '${item.product.name}' to unlock Buy 2 Get 1 Free deal!`
            });
          }
          
          if (!isApplied && qty >= 3) {
            const freeQty = Math.floor(qty / 3);
            const savings = freeQty * item.product.price;
            suggestions.push({
              offer,
              product: item.product,
              savings,
              type: 'eligible',
              message: `Buy 2 Get 1 Free available on '${item.product.name}'. Customer can save $${savings.toFixed(2)}.`
            });
          }
        } else if (offer.offerType === 'PERCENTAGE') {
          if (!isApplied) {
            const savings = (item.product.price * qty) * (offer.discount / 100);
            suggestions.push({
              offer,
              product: item.product,
              savings,
              type: 'eligible',
              message: `${offer.discount}% Off available on '${item.product.name}'. Customer can save $${savings.toFixed(2)}.`
            });
          }
        } else if (offer.offerType === 'FIXED') {
          if (!isApplied) {
            const lineTotal = item.product.price * qty;
            const savings = Math.min(offer.discount * qty, lineTotal);
            suggestions.push({
              offer,
              product: item.product,
              savings,
              type: 'eligible',
              message: `Flat $${offer.discount.toFixed(2)} Off per unit on '${item.product.name}'. Customer can save $${savings.toFixed(2)}.`
            });
          }
        }
      });
    });

    return suggestions;
  };

  const applyOfferToCartItem = (productId: string, offer: Offer) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return { ...item, selectedOffer: offer };
      }
      return item;
    }));
  };

  const handleUpsell = (productId: string) => {
    updateQuantity(productId, 1);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your POS cart is empty.');
      return;
    }
    const hasEmptyQty = cart.some(item => !item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0);
    if (hasEmptyQty) {
      alert('Please enter valid quantities for all items in the cart.');
      return;
    }
    if (!customerMobile || customerMobile.trim().length < 10) {
      alert('Please enter a valid customer mobile number.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const items = cart.map(item => ({
        productId: item.product.id!,
        quantity: item.quantity,
        offerId: item.selectedOffer?.offerId || ''
      }));

      const res = await api.checkout({
        customerMobile,
        customerName: customerName.trim() || undefined,
        redeemPoints: redeemPoints,
        items
      });
      setReceipt(res);
      
      // Update local product catalog quantities
      const updatedProducts = products.map(p => {
        const cartItem = cart.find(c => c.product.id === p.id);
        if (cartItem) {
          return { ...p, quantity: p.quantity - cartItem.quantity };
        }
        return p;
      });
      setProducts(updatedProducts);
      setCart([]);
      setCustomerMobile('');
      setCustomerName('');
      setPointsBalance(0);
      setCustomerExists(false);
      setRedeemPoints(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      // Create a print window
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>Receipt - FreshMart</title>
            <style>
              body { font-family: monospace; padding: 20px; color: #000; }
              .center { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { text-align: left; padding: 5px 0; }
              .text-right { text-align: right; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
            </style>
          </head>
          <body onload="window.print();window.close();">
            ${printContent}
          </body>
        </html>
      `);
      printWindow?.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-400 text-sm font-medium">Loading POS Catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-400" />
            POS Billing Terminal
          </h1>
          <p className="text-sm text-slate-400">Search products, apply discount campaigns, and generate customer receipts.</p>
        </div>
        <button
          onClick={openHistoryModal}
          className="rounded-xl border border-slate-700 hover:border-emerald-500 bg-slate-900/50 hover:bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:text-emerald-400 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
        >
          <FileText className="h-4 w-4" />
          <span>See All Bills</span>
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side: Search, Products catalog, and Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search bar */}
          <div className="relative rounded-xl border border-white/10 bg-slate-900/50 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by Name, Brand, or ID..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onClick={() => setIsSearchFocused(true)}
              />
            </div>
            {(searchTerm || isSearchFocused) && (
              <div className="absolute left-4 right-4 z-40 mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-2 shadow-2xl animate-fade-in">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => {
                    const activeOffer = offers.find(o => o.productId === p.id && o.active);
                    return (
                      <button
                        key={p.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addToCart(p);
                          setSearchTerm('');
                          setIsSearchFocused(false);
                          (document.activeElement as HTMLElement)?.blur();
                        }}
                        className="flex w-full items-center justify-between p-3 rounded-md hover:bg-white/5 transition-colors text-left"
                      >
                        <div>
                          <span className="font-bold text-slate-200 block">{p.name}</span>
                          <span className="text-xs text-slate-400">{p.brand} • Qty: {p.quantity} left</span>
                        </div>
                        <div className="flex items-center gap-4">
                          {activeOffer && (
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              ⚡ Promo: {activeOffer.offerType === 'BOGO' ? 'BOGO' : activeOffer.offerType === 'B2G1' ? 'B2G1' : activeOffer.offerType === 'PERCENTAGE' ? `${activeOffer.discount}% Off` : `$${activeOffer.discount} Off`}
                            </span>
                          )}
                          <span className="font-bold text-emerald-400">${p.price.toFixed(2)}</span>
                          <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 border border-emerald-500/20">Add</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="p-3 text-slate-500 text-sm text-center">No products found matching "{searchTerm}"</p>
                )}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="rounded-xl border border-white/5 bg-slate-900/20 overflow-hidden shadow-xl">
            <div className="bg-slate-900/80 px-6 py-4 border-b border-white/5">
              <h2 className="font-bold text-slate-200 flex items-center gap-2">
                <span>Cashier Cart List</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-500/20">{cart.length} items</span>
              </h2>
            </div>
            
            {cart.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-950/20 text-slate-400 text-left">
                      <th className="px-6 py-3 font-semibold">Item Details</th>
                      <th className="px-6 py-3 font-semibold text-center">Quantity</th>
                      <th className="px-6 py-3 font-semibold">Offers Available</th>
                      <th className="px-6 py-3 font-semibold text-right">Price</th>
                      <th className="px-6 py-3 font-semibold text-right">Total</th>
                      <th className="px-6 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, idx) => {
                      // Find offers matching this product
                      const productOffers = offers.filter(o => o.productId === item.product.id && o.active);
                      const currentOffer = offers.find(o => o.offerId === item.selectedOffer?.offerId);
                      const hasActiveOffer = currentOffer && currentOffer.active;
                      
                      let offerAppliedText = '';
                      let finalUnitPrice = item.product.price;
                      let lineDiscount = 0.0;
                      const qty = Number(item.quantity) || 0;
                      const originalLineTotal = item.product.price * qty;
                      
                      if (hasActiveOffer) {
                        switch (currentOffer.offerType.toUpperCase()) {
                          case 'BOGO':
                            offerAppliedText = 'Buy 1 Get 1 Free (BOGO)';
                            lineDiscount = Math.floor(qty / 2) * item.product.price;
                            finalUnitPrice = qty >= 2 ? (originalLineTotal - lineDiscount) / qty : item.product.price;
                            break;
                          case 'B2G1':
                            offerAppliedText = 'Buy 2 Get 1 Free (B2G1)';
                            lineDiscount = Math.floor(qty / 3) * item.product.price;
                            finalUnitPrice = qty >= 3 ? (originalLineTotal - lineDiscount) / qty : item.product.price;
                            break;
                          case 'PERCENTAGE':
                            offerAppliedText = `${currentOffer.discount}% Off`;
                            finalUnitPrice = item.product.price * (1 - currentOffer.discount / 100);
                            lineDiscount = originalLineTotal * (currentOffer.discount / 100);
                            break;
                          case 'FIXED':
                            offerAppliedText = `$${currentOffer.discount.toFixed(2)} Off per unit`;
                            finalUnitPrice = Math.max(0, item.product.price - currentOffer.discount);
                            lineDiscount = Math.min(originalLineTotal, currentOffer.discount * qty);
                            break;
                        }
                      }
                      
                      const finalLineTotal = originalLineTotal - lineDiscount;

                      return (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-slate-200 block">{item.product.name}</span>
                              <span className="text-xs text-slate-400 block">ID: {item.product.id} • Brand: {item.product.brand}</span>
                              {hasActiveOffer && (
                                <div className="mt-1.5 space-y-0.5 animate-fade-in">
                                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                    <Tag className="h-3 w-3" /> Offer Applied: {offerAppliedText}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block">
                                    MRP: ${item.product.price.toFixed(2)} | Effective Unit Price: <span className="text-emerald-400 font-semibold">${finalUnitPrice.toFixed(2)}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-2 border border-slate-700 bg-slate-950 rounded-lg p-1">
                              <button 
                                onClick={() => updateQuantity(item.product.id!, -1)}
                                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input 
                                type="number"
                                min="1"
                                max={item.product.quantity}
                                className="w-10 text-center text-sm font-semibold text-slate-200 bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={item.quantity}
                                onChange={e => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    const updatedCart = cart.map(c => {
                                      if (c.product.id === item.product.id) {
                                        return { ...c, quantity: '' as unknown as number };
                                      }
                                      return c;
                                    });
                                    setCart(updatedCart);
                                    return;
                                  }
                                  
                                  const qtyInput = Number(val);
                                  if (isNaN(qtyInput) || qtyInput < 1) return;
                                  if (qtyInput > item.product.quantity) {
                                    alert(`Cannot select more. Only ${item.product.quantity} units in stock.`);
                                    const updatedCart = cart.map(c => {
                                      if (c.product.id === item.product.id) {
                                        return { ...c, quantity: item.product.quantity };
                                      }
                                      return c;
                                    });
                                    setCart(updatedCart);
                                    return;
                                  }
                                  
                                  const updatedCart = cart.map(c => {
                                    if (c.product.id === item.product.id) {
                                      return { ...c, quantity: qtyInput };
                                    }
                                    return c;
                                  });
                                  setCart(updatedCart);
                                }}
                                onBlur={() => {
                                  const updatedCart = cart.map(c => {
                                    if (c.product.id === item.product.id && (!c.quantity || isNaN(c.quantity))) {
                                      return { ...c, quantity: 1 };
                                    }
                                    return c;
                                  });
                                  setCart(updatedCart);
                                }}
                              />
                              <button 
                                onClick={() => updateQuantity(item.product.id!, 1)}
                                className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {productOffers.length > 0 ? (
                              <select
                                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                                value={item.selectedOffer?.offerId || ''}
                                onChange={e => selectOffer(item.product.id!, e.target.value)}
                              >
                                <option value="">No Offer applied</option>
                                {productOffers.map(o => (
                                  <option key={o.offerId} value={o.offerId}>
                                    {o.offerType} ({o.offerType === 'PERCENTAGE' ? `${o.discount}%` : `$${o.discount}`})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-slate-500">No active offers</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-300">
                            ${item.product.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-200">
                            {hasActiveOffer ? (
                              <div className="space-y-0.5">
                                <span className="text-xs text-slate-400 line-through block">${originalLineTotal.toFixed(2)}</span>
                                <span className="text-emerald-400 block">${finalLineTotal.toFixed(2)}</span>
                              </div>
                            ) : (
                              <span>${originalLineTotal.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => removeFromCart(item.product.id!)}
                              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <ShoppingCart className="h-12 w-12 text-slate-600 stroke-[1.5] mb-4" />
                <h3 className="font-bold text-slate-300 mb-1">Your Cart is Empty</h3>
                <p className="text-sm text-slate-500 max-w-sm">Use the search bar above to query items and add them to this billing sheet.</p>
              </div>
            )}
          </div>

          {/* Checkout Details Box moved here below Cart Table */}
          <div className="rounded-xl border border-white/5 bg-slate-900/30 p-6 space-y-6 shadow-xl">
            <h2 className="text-lg font-bold text-white tracking-wide border-b border-white/5 pb-3">Checkout Details</h2>
                   {/* Customer phone and name inputs */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Customer Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-all"
                  value={customerMobile}
                  onChange={e => handleMobileChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-all"
                  value={customerName}
                  onChange={e => handleNameChange(e.target.value)}
                />
              </div>
            </div>

            {/* Loyalty Points Status Info */}
            {(customerMobile.trim().length >= 3 || customerExists) && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 flex justify-between items-center text-xs text-emerald-400 animate-fade-in">
                <div>
                  <span className="font-semibold block">{customerExists ? `Returning Customer: ${customerName || 'Loyal Customer'}` : 'New Customer Profile (will register on checkout)'}</span>
                  <span>Loyalty Points: <strong className="text-white">{pointsBalance}</strong></span>
                </div>
                {customerExists && (
                  <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                    Profile Loaded
                  </span>
                )}
              </div>
            )}

            {/* Points Redemption Offer Section */}
            {customerExists && pointsBalance >= 50 && (
              <label className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 cursor-pointer hover:bg-amber-500/10 transition-colors animate-fade-in">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 mt-0.5"
                  checked={redeemPoints}
                  onChange={e => setRedeemPoints(e.target.checked)}
                />
                <div>
                  <span className="font-bold block text-white">🎁 Redeem 50 loyalty points for 15% discount!</span>
                  <span>This applies a 15% discount on the subtotal and deducts 50 points from balance.</span>
                </div>
              </label>
            )}

            {/* Receipt calculation summary */}
            <div className="space-y-3 pt-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Offer Discounts</span>
                <span>-${productDiscount.toFixed(2)}</span>
              </div>
              {redeemPoints && (
                <div className="flex justify-between text-amber-400 font-semibold animate-fade-in">
                  <span>Points Redemption Discount (15%)</span>
                  <span>-${redemptionDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Sales Tax (5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-slate-700 my-2"></div>
              <div className="flex justify-between text-lg font-bold text-white">
                <span>Grand Total</span>
                <span className="text-emerald-400">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">{errorMsg}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
              className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                  <span>Processing bill...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Generate Bill & Checkout</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Invoice details, Customer Mobile, checkout actions */}
        <div className="space-y-6">
          {/* Real-time Offers suggestions */}
          {cart.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-slate-900/40 p-6 space-y-4 shadow-xl animate-fade-in">
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
                <Tag className="h-5 w-5 text-emerald-400" />
                💡 Available Offers Suggestions
              </h2>
              
              {getOfferSuggestions().length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {getOfferSuggestions().map((suggestion, idx) => {
                    const isUpsell = suggestion.type === 'upsell';
                    return (
                      <div 
                        key={idx} 
                        className={`rounded-lg border p-3 flex flex-col justify-between gap-3 text-xs animate-fade-in ${
                          isUpsell ? 'border-amber-500/20 bg-amber-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider mb-1.5 ${
                              isUpsell ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              ⚡ {isUpsell ? 'Upsell Offer' : 'Available Offer'}
                            </span>
                            <p className="text-slate-200 leading-relaxed font-semibold">{suggestion.message}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] shrink-0 ${
                            isUpsell ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {isUpsell ? 'Combo' : 'Eligible'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                          <span className="text-slate-400 text-[11px]">
                            Est. Savings: <strong className={isUpsell ? 'text-amber-400' : 'text-emerald-400'}>${suggestion.savings.toFixed(2)}</strong>
                          </span>
                          <button
                            onClick={() => {
                              if (isUpsell) {
                                handleUpsell(suggestion.product.id!);
                              } else {
                                applyOfferToCartItem(suggestion.product.id!, suggestion.offer);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md font-bold text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                              isUpsell 
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/10' 
                                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/10'
                            }`}
                          >
                            {isUpsell ? 'Add 1 More' : 'Apply Offer'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center py-2">
                  ✓ No unapplied offers detected. All eligible discounts applied.
                </div>
              )}
            </div>
          )}

          {/* Dedicated Section: Live Store Promotions */}
          <div className="rounded-xl border border-emerald-500/20 bg-slate-900/40 p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2 border-b border-white/5 pb-3">
              <Tag className="h-5 w-5 text-emerald-400" />
              📢 Live Store Promotions
            </h2>
            {(() => {
              const activeOffers = offers.filter(o => o.active);
              if (activeOffers.length > 0) {
                return (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {activeOffers.map((offer, idx) => {
                      const product = products.find(p => p.id === offer.productId);
                      let promoText = '';
                      switch (offer.offerType.toUpperCase()) {
                        case 'BOGO':
                          promoText = 'Buy 1 Get 1 Free (BOGO)';
                          break;
                        case 'B2G1':
                          promoText = 'Buy 2 Get 1 Free (B2G1)';
                          break;
                        case 'PERCENTAGE':
                          promoText = `${offer.discount}% Off`;
                          break;
                        case 'FIXED':
                          promoText = `$${offer.discount.toFixed(2)} Off per unit`;
                          break;
                      }
                      return (
                        <div 
                          key={idx} 
                          className="rounded-lg border border-slate-700 bg-slate-950 p-3 flex justify-between items-center gap-2 text-xs hover:border-emerald-500/30 hover:bg-slate-900/10 transition-all duration-200"
                        >
                          <div className="space-y-1">
                            <span className="font-bold text-slate-200 block">
                              {product ? product.name : 'Unknown Product'}
                            </span>
                            <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[9px] uppercase border border-emerald-500/20">
                              {promoText}
                            </span>
                            <span className="text-slate-500 block text-[9px] font-mono">
                              Ends: {offer.endDate}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (product) {
                                addToCart(product);
                                applyOfferToCartItem(product.id!, offer);
                              }
                            }}
                            className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer shadow-md shadow-emerald-500/10"
                          >
                            Quick Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              return (
                <p className="text-xs text-slate-500 text-center py-4">No active store campaigns registered.</p>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Invoice receipt modal popup */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-10 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 text-slate-300 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
              <h2 className="font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                Transaction Success
              </h2>
              <button 
                onClick={() => setReceipt(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt details */}
            <div className="p-6">
              <div ref={printAreaRef} className="bg-white text-slate-950 p-6 rounded-lg font-mono text-xs border shadow-inner">
                <div className="text-center mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider">FreshMart Supermarket</h3>
                  <p>123 Tech Park Road, Silicon Valley</p>
                  <p>Ph: +91 98765 43210</p>
                  <div className="border-t border-dashed border-slate-950 my-2"></div>
                  <p className="font-bold uppercase">Tax Invoice / Receipt</p>
                </div>
                
                <div className="space-y-1 mb-4">
                  <p><strong>Receipt ID:</strong> {receipt.billId}</p>
                  <p><strong>Date:</strong> {receipt.saleDate}</p>
                  {receipt.customerName && <p><strong>Customer Name:</strong> {receipt.customerName}</p>}
                  <p><strong>Customer Mobile:</strong> {receipt.customerMobile}</p>
                </div>

                <table className="w-full text-[11px] mb-4">
                  <thead>
                    <tr className="border-b border-dashed border-slate-950">
                      <th className="pb-1 text-left">Item Name</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Price</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1">
                          {item.productName}
                          {item.discountApplied > 0 && <span className="block text-[9px] text-slate-600">- Discount Applied</span>}
                        </td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">${item.price.toFixed(2)}</td>
                        <td className="py-1 text-right">
                          ${item.finalLineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-950 pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${receipt.subtotal.toFixed(2)}</span>
                  </div>
                  {receipt.discount > 0 && (
                    <div className="flex justify-between text-slate-700">
                      <span>Discount:</span>
                      <span>-${receipt.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>CGST/SGST (5%):</span>
                    <span>${receipt.tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-dashed border-slate-950 my-1"></div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Net Amount:</span>
                    <span>${receipt.finalAmount.toFixed(2)}</span>
                  </div>
                  {receipt.customerMobile && (
                    <div className="border-t border-dashed border-slate-950 pt-2 space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span>Points Earned:</span>
                        <span>+{receipt.pointsEarned || 0}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total Points:</span>
                        <span>{receipt.totalPoints || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center mt-6 text-[10px]">
                  <p className="font-bold">Thank you for shopping with us!</p>
                  <p>Visit again. Powered by AWS DynamoDB</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 px-6 py-4 border-t border-white/5 bg-slate-900/30">
              <button
                onClick={() => setReceipt(null)}
                className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing History Modal Dialog */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-10 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950 text-slate-300 overflow-hidden shadow-2xl flex flex-col h-[80vh]">
            
            {/* Modal Title */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 shrink-0">
              <h2 className="font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                Store Billing History Ledger
              </h2>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter controls and Search */}
            <div className="p-6 border-b border-white/5 bg-slate-900/20 grid gap-4 sm:grid-cols-4 shrink-0">
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Select Date</label>
                <div className="relative">
                  <input
                    type="date"
                    onClick={e => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-3 pr-8 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none cursor-pointer [color-scheme:dark]"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  />
                  <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Month Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Select Month</label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Year Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Select Year</label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                >
                  {years.map(y => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>

              {/* General Search */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Search Ledger</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search Bill ID, Phone, Customer..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    value={historySearchTerm}
                    onChange={e => setHistorySearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Clear filters badge row */}
            {(filterDate || filterMonth || filterYear || historySearchTerm) && (
              <div className="px-6 py-2 bg-slate-900/10 border-b border-white/5 flex flex-wrap items-center gap-2 text-xs text-slate-400 shrink-0">
                <span>Active Filters:</span>
                {filterDate && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                    Date: {filterDate}
                    <button onClick={() => setFilterDate('')} className="hover:text-white cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filterMonth && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                    Month: {months.find(m => m.value === filterMonth)?.label}
                    <button onClick={() => setFilterMonth('')} className="hover:text-white cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filterYear && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                    Year: {filterYear}
                    <button onClick={() => setFilterYear('')} className="hover:text-white cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
                {historySearchTerm && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                    Query: "{historySearchTerm}"
                    <button onClick={() => setHistorySearchTerm('')} className="hover:text-white cursor-pointer"><X className="h-3 w-3" /></button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilterDate('');
                    setFilterMonth('');
                    setFilterYear('');
                    setHistorySearchTerm('');
                  }}
                  className="text-slate-400 hover:text-white underline cursor-pointer ml-auto text-[10px]"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* List/Table of bills */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                  <p className="text-slate-400 text-sm">Loading billing records...</p>
                </div>
              ) : filteredBills.length > 0 ? (
                <div className="border border-white/5 bg-slate-900/10 rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold">Bill Details</th>
                        <th className="px-6 py-3 font-semibold">Customer Info</th>
                        <th className="px-6 py-3 font-semibold text-center">Items</th>
                        <th className="px-6 py-3 font-semibold text-right">Net Amount</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBills.map((bill, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-200 block text-xs font-mono">{bill.billId}</span>
                            <span className="text-xs text-slate-400">{bill.saleDate}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-300 block">{bill.customerName || 'Walk-in Customer'}</span>
                            <span className="text-xs text-slate-500">{bill.customerMobile || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-300 font-medium">
                            {bill.items.reduce((sum, it) => sum + it.quantity, 0)} units
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-400">
                            ${bill.finalAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setReceipt(bill)}
                              className="rounded-lg border border-slate-700 hover:border-emerald-500 bg-slate-950 hover:bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-emerald-400 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>View Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <FileText className="h-12 w-12 text-slate-700 mb-3" />
                  <h3 className="font-bold text-slate-400 mb-1">No billing records found</h3>
                  <p className="text-xs text-slate-600 max-w-sm">No sales checkouts match the current active search query or date range filters.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/5 bg-slate-900/50 flex justify-end shrink-0">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
