export enum Currency {
  GHS = 'GHS',
  USD = 'USD'
}

export interface CompanyDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
  logoUrl: string | null;
}

export interface CustomerDetails {
  name: string;
  companyName: string;
  address: string;
  email: string;
  referenceId: string; // e.g., Container Number or Booking Ref
}

export interface InvoiceItem {
  id: string;
  description: string;
  weight: number | string; // e.g., kg
  unit: string; // e.g., Pcs, Pallets, Boxes
  cbm: number | string; // Cubic Meters
  qty: number | string;
  rate: number | string;
  amount: number | string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: Currency;
  company: CompanyDetails;
  customer: CustomerDetails;
  items: InvoiceItem[];
  notes: string;
}