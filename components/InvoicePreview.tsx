import React, { useMemo } from 'react';
import { InvoiceData, Currency } from '../types';
import { Ship, Anchor } from 'lucide-react';

interface InvoicePreviewProps {
  data: InvoiceData;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data }) => {
  const currencySymbol = data.currency === Currency.GHS ? '₵' : '$';

  const subtotal = useMemo(() => {
    return data.items.reduce((acc, item) => acc + item.amount, 0);
  }, [data.items]);

  const totalCbm = useMemo(() => {
    return data.items.reduce((acc, item) => acc + (item.cbm || 0), 0);
  }, [data.items]);

  const total = subtotal;

  return (
    <div className="bg-white shadow-2xl print:shadow-none max-w-[210mm] mx-auto min-h-[297mm] relative text-sm print:text-base print:w-full print:max-w-none">
      
      {/* Decorative Top Bar */}
      <div className="h-4 bg-sky-600 w-full top-0 left-0 absolute print:block"></div>

      <div className="p-10 print:p-12 space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-start mt-4">
          <div className="flex gap-4 items-start">
             {data.company.logoUrl ? (
               <img src={data.company.logoUrl} alt="Company Logo" className="w-24 h-24 object-contain rounded" />
             ) : (
               <div className="w-24 h-24 bg-sky-50 flex items-center justify-center rounded text-sky-600">
                 <Ship size={48} />
               </div>
             )}
             <div>
               <h1 className="text-2xl font-bold text-slate-900">{data.company.name || 'Your Company Name'}</h1>
               <div className="text-slate-500 mt-1 space-y-0.5">
                  <p>{data.company.address || '123 Ocean Drive, Port City'}</p>
                  <p>{data.company.email || 'contact@logistics.com'}</p>
                  <p>{data.company.phone || '+233 20 000 0000'}</p>
               </div>
             </div>
          </div>
          <div className="text-right">
             <h2 className="text-4xl font-light text-sky-600 uppercase tracking-widest">Invoice</h2>
             <div className="mt-4 space-y-1">
               <p className="text-slate-600">Invoice #: <span className="font-semibold text-slate-900">{data.invoiceNumber}</span></p>
               <p className="text-slate-600">Date: <span className="font-semibold text-slate-900">{data.date}</span></p>
               <p className="text-slate-600">Due Date: <span className="font-semibold text-slate-900">{data.dueDate}</span></p>
             </div>
          </div>
        </div>

        {/* Bill To & Details */}
        <div className="grid grid-cols-2 gap-12 mt-12">
           <div>
             <h3 className="text-sky-600 font-bold uppercase text-xs tracking-wider mb-2">Bill To</h3>
             <div className="text-slate-700 space-y-1">
               <p className="font-bold text-lg text-slate-900">{data.customer.companyName || data.customer.name || 'Customer Name'}</p>
               {data.customer.companyName && <p>{data.customer.name}</p>}
               <p>{data.customer.address}</p>
               <p>{data.customer.email}</p>
             </div>
           </div>
           <div>
              <h3 className="text-sky-600 font-bold uppercase text-xs tracking-wider mb-2">Shipment Details</h3>
              <div className="bg-slate-50 p-4 rounded border border-slate-100">
                <p className="text-slate-500 text-xs uppercase mb-1">Reference / Booking No.</p>
                <p className="font-mono font-bold text-slate-800 text-lg">{data.customer.referenceId || 'N/A'}</p>
                
                <div className="mt-3 flex items-center gap-2 text-slate-500 text-sm">
                   <Anchor size={16} />
                   <span>Sea Freight Service</span>
                </div>
              </div>
           </div>
        </div>

        {/* Table */}
        <div className="mt-12">
          <table className="w-full text-left table-auto">
             <thead className="bg-sky-600 text-white">
                <tr>
                   <th className="p-3 font-semibold text-sm rounded-l w-[30%]">Description</th>
                   <th className="p-3 font-semibold text-sm text-center">Unit</th>
                   <th className="p-3 font-semibold text-sm text-center">Qty</th>
                   <th className="p-3 font-semibold text-sm text-center">Weight</th>
                   <th className="p-3 font-semibold text-sm text-center">CBM</th>
                   <th className="p-3 font-semibold text-sm text-right">Rate</th>
                   <th className="p-3 font-semibold text-sm text-right rounded-r">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {data.items.map((item) => (
                   <tr key={item.id}>
                      <td className="p-3">
                        <div className="text-slate-800 font-medium">{item.description}</div>
                        {item.dimensions && <div className="text-xs text-slate-500 mt-1">Dims: {item.dimensions}</div>}
                      </td>
                      <td className="p-3 text-slate-600 text-center text-xs uppercase">{item.unit}</td>
                      <td className="p-3 text-slate-600 text-center">{item.qty}</td>
                      <td className="p-3 text-slate-600 text-center">{item.weight > 0 ? `${item.weight} kg` : '-'}</td>
                      <td className="p-3 text-slate-600 text-center">{item.cbm.toFixed(2)}</td>
                      <td className="p-3 text-slate-600 text-right">{currencySymbol}{item.rate.toFixed(2)}</td>
                      <td className="p-3 text-slate-900 font-bold text-right">{currencySymbol}{item.amount.toFixed(2)}</td>
                   </tr>
                ))}
                {data.items.length === 0 && (
                   <tr>
                     <td colSpan={7} className="p-8 text-center text-slate-400 italic">No items added yet.</td>
                   </tr>
                )}
             </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-8">
           <div className="w-64 space-y-3">
              <div className="flex justify-between text-slate-600">
                 <span>Subtotal</span>
                 <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                 <span>Total CBM</span>
                 <span>{currencySymbol}{totalCbm.toFixed(4)}</span>
              </div>
              <div className="pt-3 border-t-2 border-slate-200 flex justify-between items-center">
                 <span className="font-bold text-xl text-slate-900">Total</span>
                 <span className="font-bold text-2xl text-sky-600">{currencySymbol}{total.toFixed(2)}</span>
              </div>
           </div>
        </div>

        {/* Notes */}
        <div className="mt-12 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-bold text-slate-800 mb-2">Notes & Instructions</h4>
          <p className="text-slate-600 text-sm whitespace-pre-wrap">{data.notes}</p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-10 left-10 right-10 text-center text-slate-400 text-xs">
           <p>Generated by InvoiceGen</p>
        </div>
      </div>
    </div>
  );
};