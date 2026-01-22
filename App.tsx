import React, { useState } from 'react';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceData, Currency } from './types';
import { Printer } from 'lucide-react';

const INITIAL_DATA: InvoiceData = {
  invoiceNumber: 'INV-2023-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  currency: Currency.USD,
  company: {
    name: 'Atlantic Sea Freight Ltd',
    address: 'Tema Harbour, Ghana',
    email: 'ops@atlanticfreight.gh',
    phone: '+233 55 123 4567',
    logoUrl: null
  },
  customer: {
    name: '',
    companyName: '',
    address: '',
    email: '',
    referenceId: ''
  },
  items: [
    {
      id: '1',
      description: '20ft Container - General Goods',
      dimensions: '6.06m x 2.44m x 2.59m',
      weight: 2200,
      unit: 'Container',
      cbm: 33.2,
      qty: 1,
      rate: 2500,
      amount: 2500
    }
  ],
  notes: 'Please make checks payable to Atlantic Sea Freight Ltd.\nPayment due within 14 days of invoice date.'
};

const STORAGE_KEY = 'seafreight_invoice_data';

export default function App() {
  const [data, setData] = useState<InvoiceData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          if (parsed && Array.isArray(parsed.items)) {
            // Sanitize items to ensure numeric fields are actually numbers
            // This prevents crashes if local storage has "null" or "string" in number fields
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sanitizedItems = parsed.items.map((item: any) => ({
              ...item,
              amount: Number(item.amount) || 0,
              rate: Number(item.rate) || 0,
              qty: Number(item.qty) || 0,
              cbm: Number(item.cbm) || 0,
              weight: Number(item.weight) || 0
            }));

            // Merge with initial structure to ensure new fields are present
            return {
              ...INITIAL_DATA,
              ...parsed,
              company: { ...INITIAL_DATA.company, ...parsed.company },
              customer: { ...INITIAL_DATA.customer, ...parsed.customer },
              items: sanitizedItems
            };
          }
        } catch (e) {
          console.error("Failed to parse saved invoice data", e);
          // If parsing fails, we fallback to INITIAL_DATA
        }
      }
    }
    return INITIAL_DATA;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header - Hidden on Print */}
      <header className="bg-slate-900 text-white p-4 shadow-md no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
              SeaFreight Pro
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">BETA</span>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-blue-500/20 text-sm sm:text-base"
          >
            <Printer size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Print / Save PDF</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Editor Side - Hidden on Print */}
        {/* Mobile: Natural height. Desktop: Fixed height with internal scroll. */}
        <div className="w-full lg:w-1/2 no-print h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
           <InvoiceEditor data={data} onChange={setData} />
        </div>

        {/* Preview Side - Full Width on Print */}
        <div className="w-full lg:w-1/2 print:w-full print:absolute print:top-0 print:left-0 print:m-0">
           {/* Wrapper for mobile horizontal scrolling */}
           <div className="w-full overflow-x-auto pb-6 lg:pb-0 scrollbar-hide">
             <div className="min-w-[210mm] lg:min-w-0 lg:scale-90 lg:origin-top-left transform transition-transform">
               <InvoicePreview data={data} />
             </div>
           </div>
           <p className="lg:hidden text-center text-xs text-slate-400 mt-1">
             Scroll horizontally to view full invoice
           </p>
        </div>
      </main>
    </div>
  );
}