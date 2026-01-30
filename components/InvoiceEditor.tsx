import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Upload, Wand2, Loader2, Save, RefreshCw } from 'lucide-react';
import { InvoiceData, Currency, InvoiceItem } from '../types';
import { generateCargoDescription, generateNextInvoiceNumber } from '../services/geminiService';

interface InvoiceEditorProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
}

const STORAGE_KEY = 'seafreight_invoice_data';

// --- Predefined Options Constants ---
const SUGGESTED_DESCRIPTIONS = [
  "Ocean Freight Charges",
  "20' Standard Container Shipment",
  "40' Standard Container Shipment",
  "40' High Cube Container Shipment",
  "LCL Consolidated Cargo",
  "Terminal Handling Charges (THC)",
  "Documentation Fee",
  "Bill of Lading Fee",
  "Customs Clearance",
  "Inland Haulage / Transport",
  "Port Congestion Surcharge",
  "Bunker Adjustment Factor (BAF)",
  "Currency Adjustment Factor (CAF)",
  "Electronic Cargo Tracking Note (ECTN)"
];

const SUGGESTED_UNITS = [
  "Container", 
  "20' CNTR", 
  "40' CNTR", 
  "40' HC", 
  "CBM", 
  "Kgs", 
  "MT", 
  "Pcs", 
  "Pkgs", 
  "Pallets", 
  "Boxes", 
  "Lump Sum",
  "Shipment"
];

const SUGGESTED_CBM = [
  { val: "33.2", label: "20ft Std" },
  { val: "67.7", label: "40ft Std" },
  { val: "76.4", label: "40ft HC" },
  { val: "1.0", label: "Min LCL" }
];

const SUGGESTED_RATES = [
  "50.00", "100.00", "150.00", "250.00", "500.00", 
  "1200.00", "1800.00", "2500.00", "3500.00", "4500.00"
];

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ data, onChange }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isGeneratingInvNum, setIsGeneratingInvNum] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'modified'>('saved');

  // Auto-save Logic
  const saveToStorage = useCallback((currentData: InvoiceData) => {
    setSaveStatus('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
      setTimeout(() => {
        setSaveStatus('saved');
      }, 500);
    } catch (e) {
      console.error("Failed to save to localStorage", e);
      setSaveStatus('modified');
    }
  }, []);

  useEffect(() => {
    setSaveStatus('modified');
    
    const timer = setTimeout(() => {
      saveToStorage(data);
    }, 2000);

    return () => clearTimeout(timer);
  }, [data, saveToStorage]);

  const handleManualSave = () => {
    saveToStorage(data);
  };

  const handleCompanyChange = (field: string, value: string) => {
    onChange({
      ...data,
      company: { ...data.company, [field]: value }
    });
  };

  const handleCustomerChange = (field: string, value: string) => {
    onChange({
      ...data,
      customer: { ...data.customer, [field]: value }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({
          ...data,
          company: { ...data.company, logoUrl: reader.result as string }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const newItems = data.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate amount if cbm, qty or rate changes
        if (field === 'cbm' || field === 'qty' || field === 'rate') {
          const c = parseFloat(String(updatedItem.cbm)) || 0;
          const q = parseFloat(String(updatedItem.qty)) || 0;
          const r = parseFloat(String(updatedItem.rate)) || 0;
          
          // Formula: Amount = CBM * Qty * Rate
          // Fallback: If CBM is 0 (e.g., flat fees), treat it as 1 to ensure calculation works for non-volumetric items.
          const effectiveCbm = c === 0 ? 1 : c;
          
          updatedItem.amount = effectiveCbm * q * r;
        }
        return updatedItem;
      }
      return item;
    });
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      weight: 0,
      unit: 'pcs',
      cbm: 0,
      qty: 1,
      rate: 0,
      amount: 0
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, items: data.items.filter(i => i.id !== id) });
  };

  const enhanceDescription = async (id: string, currentText: string) => {
    if (!currentText) return;
    setLoadingId(id);
    try {
      const enhanced = await generateCargoDescription(currentText);
      updateItem(id, 'description', enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleGenerateNextInvoiceNumber = async () => {
    if (!data.invoiceNumber) return;
    setIsGeneratingInvNum(true);
    try {
      const nextNum = await generateNextInvoiceNumber(data.invoiceNumber);
      onChange({ ...data, invoiceNumber: nextNum });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingInvNum(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-8 h-full overflow-y-auto">
      
      {/* Datalists for Autocomplete Options */}
      <datalist id="list-descriptions">
        {SUGGESTED_DESCRIPTIONS.map((opt) => <option key={opt} value={opt} />)}
      </datalist>
      <datalist id="list-units">
        {SUGGESTED_UNITS.map((opt) => <option key={opt} value={opt} />)}
      </datalist>
      <datalist id="list-cbm">
        {SUGGESTED_CBM.map((opt) => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
      </datalist>
      <datalist id="list-rates">
        {SUGGESTED_RATES.map((opt) => <option key={opt} value={opt} />)}
      </datalist>
      <datalist id="list-qty">
         <option value="1" />
         <option value="2" />
         <option value="3" />
         <option value="10" />
         <option value="100" />
      </datalist>

      {/* Header Section */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            Invoice Details
          </h2>
          
          <div className="flex flex-col items-end gap-1">
             <div className="flex items-center gap-2">
                <span className={`text-[10px] sm:text-xs transition-colors ${saveStatus === 'saved' ? 'text-green-600' : 'text-slate-400'}`}>
                   {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'modified' ? 'Unsaved' : 'Saved'}
                </span>
                <button 
                  onClick={handleManualSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded transition-colors"
                  title="Save Invoice"
                >
                  <Save size={14} className="sm:w-4 sm:h-4" /> Save
                </button>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Invoice Number</label>
            <div className="relative">
              <input
                type="text"
                value={data.invoiceNumber}
                onChange={(e) => onChange({ ...data, invoiceNumber: e.target.value })}
                className="w-full p-2 pr-10 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. INV-001"
              />
              <button
                onClick={handleGenerateNextInvoiceNumber}
                disabled={isGeneratingInvNum}
                className="absolute right-1 top-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"
                title="Generate Next Sequence (AI)"
              >
                {isGeneratingInvNum ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Click icon to auto-generate next number</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
            <div className="flex bg-slate-100 p-1 rounded">
              <button
                onClick={() => onChange({ ...data, currency: Currency.GHS })}
                className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${data.currency === Currency.GHS ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
              >
                GHS (₵)
              </button>
              <button
                onClick={() => onChange({ ...data, currency: Currency.USD })}
                className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${data.currency === Currency.USD ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
              >
                USD ($)
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => onChange({ ...data, date: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Due Date</label>
            <input
              type="date"
              value={data.dueDate}
              onChange={(e) => onChange({ ...data, dueDate: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Company Details */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Your Company</h3>
        <div className="space-y-3">
          <div className="flex items-start sm:items-center gap-4">
             <div className="w-16 h-16 shrink-0 bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center overflow-hidden relative group cursor-pointer">
                {data.company.logoUrl ? (
                  <img src={data.company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-400" />
                )}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
             </div>
             <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={data.company.name}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded mb-2 focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                />
             </div>
          </div>
          <input
            type="text"
            placeholder="Address / Location"
            value={data.company.address}
            onChange={(e) => handleCompanyChange('address', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              placeholder="Email"
              value={data.company.email}
              onChange={(e) => handleCompanyChange('email', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Phone"
              value={data.company.phone}
              onChange={(e) => handleCompanyChange('phone', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Customer Details */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Bill To (Customer)</h3>
        <div className="space-y-3">
           <input
            type="text"
            placeholder="Customer / Contact Name"
            value={data.customer.name}
            onChange={(e) => handleCustomerChange('name', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Customer Company Name"
            value={data.customer.companyName}
            onChange={(e) => handleCustomerChange('companyName', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
           <input
            type="text"
            placeholder="Customer Address"
            value={data.customer.address}
            onChange={(e) => handleCustomerChange('address', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <input
              type="email"
              placeholder="Customer Email"
              value={data.customer.email}
              onChange={(e) => handleCustomerChange('email', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="text"
              placeholder="Ref ID / Booking / BL No"
              value={data.customer.referenceId}
              onChange={(e) => handleCustomerChange('referenceId', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
           </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Items */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-3">Freight & Service Items</h3>
        <div className="space-y-4">
          {data.items.map((item, index) => (
            <div key={item.id} className="bg-slate-50 p-3 sm:p-4 rounded border border-slate-200 relative group">
              <button
                onClick={() => removeItem(item.id)}
                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1"
              >
                <Trash2 size={18} />
              </button>
              
              <div className="grid grid-cols-12 gap-3 mb-3 pr-6 sm:pr-0">
                <div className="col-span-12">
                   <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                   <div className="flex gap-2">
                      <input
                        list="list-descriptions"
                        type="text"
                        placeholder="e.g. 20ft Container"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button 
                        onClick={() => enhanceDescription(item.id, item.description)}
                        disabled={loadingId === item.id}
                        className="bg-blue-100 text-blue-600 p-2 rounded hover:bg-blue-200 transition-colors shrink-0"
                        title="AI Enhance Description"
                      >
                         {loadingId === item.id ? <Loader2 className="animate-spin w-5 h-5"/> : <Wand2 className="w-5 h-5" />}
                      </button>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Weight</label>
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Unit</label>
                    <input
                      list="list-units"
                      type="text"
                      placeholder="e.g. Pcs"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">CBM (Vol)</label>
                    <input
                      list="list-cbm"
                      type="number"
                      step="0.0001"
                      value={item.cbm}
                      onChange={(e) => updateItem(item.id, 'cbm', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Qty</label>
                    <input
                      list="list-qty"
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Rate</label>
                    <input
                      list="list-rates"
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
                 <div>
                     <label className="text-xs font-semibold text-slate-500 uppercase">Amount</label>
                     <input
                       type="number"
                       step="0.01"
                       value={item.amount}
                       onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                       className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                     />
                 </div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={addItem}
          className="mt-4 flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
        >
          <Plus size={20} /> Add Line Item
        </button>
      </div>

       <div className="pb-10 lg:pb-0">
         <label className="block text-sm font-medium text-slate-600 mb-1">Notes / Payment Instructions</label>
         <textarea
           value={data.notes}
           onChange={(e) => onChange({...data, notes: e.target.value})}
           className="w-full p-2 border border-slate-300 rounded h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
           placeholder="Thank you for your business. Please pay via bank transfer to..."
         />
       </div>
    </div>
  );
};