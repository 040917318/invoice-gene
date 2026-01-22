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
  dimensions: string; // e.g., 120x80x100 cm
  weight: number; // e.g., kg
  unit: string; // e.g., Pcs, Pallets, Boxes
  cbm: number; // Cubic Meters
  qty: number;
  rate: number;
  amount: number;
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
