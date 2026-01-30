import React, { useState, useRef } from 'react';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoiceData, Currency } from './types';
import { Printer, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [data, setData] = useState<InvoiceData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          if (parsed && Array.isArray(parsed.items)) {
            // No need to strictly cast to Number() here anymore as types allow string | number
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sanitizedItems = parsed.items.map((item: any) => ({
              ...item,
              // Ensure fields exist, but allow them to be whatever was saved
              amount: item.amount ?? 0,
              rate: item.rate ?? 0,
              qty: item.qty ?? 0,
              cbm: item.cbm ?? 0,
              weight: item.weight ?? 0
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

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);

    try {
      // Capture the invoice element
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // High resolution
        useCORS: true, // Handle cross-origin images
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      // Create PDF
      // If the content is longer than A4, we create a custom size PDF to avoid cutting content
      // or complex pagination logic which breaks layout.
      const isLongContent = imgHeight > pdfHeight;
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: isLongContent ? [pdfWidth, imgHeight] : 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${data.invoiceNumber || 'Invoice'}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try using the Print option.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header - Hidden on Print */}
      <header className="bg-slate-900 text-white p-4 shadow-md no-print sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500">
              InvoiceGen
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">BETA</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-emerald-500/20 text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="sm:w-5 sm:h-5" />}
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors shadow-lg text-sm sm:text-base"
            >
              <Printer size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Editor Side - Hidden on Print */}
        <div className="w-full lg:w-1/2 no-print h-auto lg:h-[calc(100vh-140px)] lg:sticky lg:top-24">
           <InvoiceEditor data={data} onChange={setData} />
        </div>

        {/* Preview Side - Full Width on Print */}
        <div className="w-full lg:w-1/2 print:w-full print:absolute print:top-0 print:left-0 print:m-0">
           {/* Wrapper for mobile horizontal scrolling */}
           <div className="w-full overflow-x-auto pb-6 lg:pb-0 scrollbar-hide">
             {/* Scale wrapper for desktop view */}
             <div className="min-w-[210mm] lg:min-w-0 lg:scale-90 lg:origin-top-left transform transition-transform">
               {/* 
                  Ref wrapper: This inner div captures the full size content for PDF generation 
                  without the parent CSS scaling affecting the canvas resolution.
               */}
               <div ref={invoiceRef} className="width-fit">
                 <InvoicePreview data={data} />
               </div>
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