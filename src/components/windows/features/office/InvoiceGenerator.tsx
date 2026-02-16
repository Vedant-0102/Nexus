import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Plus, Trash2, Printer, Copy, Settings, Eye, Receipt, Building2, User, Calendar, DollarSign, Percent, CreditCard, FileDown } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
}

interface InvoiceData {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  taxRate: number;
  notes: string;
  paymentTerms: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
}

const CURRENCIES = [
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '\u20AC', code: 'EUR', name: 'Euro' },
  { symbol: '\u00A3', code: 'GBP', name: 'British Pound' },
  { symbol: '\u20B9', code: 'INR', name: 'Indian Rupee' },
  { symbol: '\u00A5', code: 'JPY', name: 'Japanese Yen' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const getToday = () => new Date().toISOString().split('T')[0];
const getNextMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
};

export const InvoiceGenerator = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([
    {
      companyName: 'Your Company',
      companyAddress: '123 Business Ave, Suite 100\nNew York, NY 10001',
      companyEmail: 'billing@company.com',
      companyPhone: '(555) 123-4567',
      clientName: 'Client Name',
      clientAddress: '456 Client St\nSan Francisco, CA 94102',
      clientEmail: 'client@example.com',
      invoiceNumber: 'INV-001',
      invoiceDate: getToday(),
      dueDate: getNextMonth(),
      currency: '$',
      taxRate: 10,
      notes: 'Thank you for your business!',
      paymentTerms: 'Payment due within 30 days of invoice date.',
      status: 'draft',
      items: [
        { id: '1', description: 'Web Development Service', quantity: 1, price: 2500, discount: 0 },
        { id: '2', description: 'UI/UX Design', quantity: 1, price: 1200, discount: 0 },
      ],
    }
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('edit');
  const printRef = useRef<HTMLDivElement>(null);

  const invoice = invoices[activeIdx];

  const updateInvoice = (updates: Partial<InvoiceData>) => {
    setInvoices(prev => prev.map((inv, i) => i === activeIdx ? { ...inv, ...updates } : inv));
  };

  const addItem = () => {
    updateInvoice({
      items: [...invoice.items, {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        price: 0,
        discount: 0,
      }]
    });
  };

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) return;
    updateInvoice({ items: invoice.items.filter(item => item.id !== id) });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    updateInvoice({
      items: invoice.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    });
  };

  const duplicateItem = (id: string) => {
    const item = invoice.items.find(i => i.id === id);
    if (!item) return;
    const newItem = { ...item, id: Date.now().toString() };
    const idx = invoice.items.findIndex(i => i.id === id);
    const newItems = [...invoice.items];
    newItems.splice(idx + 1, 0, newItem);
    updateInvoice({ items: newItems });
  };

  const createNewInvoice = () => {
    const num = invoices.length + 1;
    const newInv: InvoiceData = {
      companyName: invoice.companyName,
      companyAddress: invoice.companyAddress,
      companyEmail: invoice.companyEmail,
      companyPhone: invoice.companyPhone,
      clientName: '',
      clientAddress: '',
      clientEmail: '',
      invoiceNumber: `INV-${String(num).padStart(3, '0')}`,
      invoiceDate: getToday(),
      dueDate: getNextMonth(),
      currency: invoice.currency,
      taxRate: invoice.taxRate,
      notes: invoice.notes,
      paymentTerms: invoice.paymentTerms,
      status: 'draft',
      items: [{ id: '1', description: '', quantity: 1, price: 0, discount: 0 }],
    };
    setInvoices([...invoices, newInv]);
    setActiveIdx(invoices.length);
  };

  const deleteInvoice = () => {
    if (invoices.length <= 1) return;
    const newInvoices = invoices.filter((_, i) => i !== activeIdx);
    setInvoices(newInvoices);
    setActiveIdx(Math.min(activeIdx, newInvoices.length - 1));
  };

  // Calculations
  const getItemTotal = (item: InvoiceItem) => {
    const gross = item.quantity * item.price;
    return gross - (gross * item.discount / 100);
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + getItemTotal(item), 0);
  const totalDiscount = invoice.items.reduce((sum, item) => {
    const gross = item.quantity * item.price;
    return sum + (gross * item.discount / 100);
  }, 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax;

  const formatCurrency = (amount: number) => `${invoice.currency}${amount.toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const exportCSV = () => {
    const headers = ['Description', 'Quantity', 'Unit Price', 'Discount %', 'Amount'];
    const rows = invoice.items.map(item => [
      `"${item.description}"`,
      item.quantity,
      item.price.toFixed(2),
      item.discount,
      getItemTotal(item).toFixed(2)
    ]);
    rows.push(['', '', '', 'Subtotal:', subtotal.toFixed(2)]);
    if (totalDiscount > 0) rows.push(['', '', '', 'Total Discount:', totalDiscount.toFixed(2)]);
    rows.push(['', '', '', `Tax (${invoice.taxRate}%):`, tax.toFixed(2)]);
    rows.push(['', '', '', 'TOTAL:', total.toFixed(2)]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const json = JSON.stringify(invoice, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    setActiveTab('preview');
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-green-600" />
          <h1 className="font-bold text-sm dark:text-white">Invoice Generator</h1>
          <select
            value={activeIdx}
            onChange={(e) => setActiveIdx(parseInt(e.target.value))}
            className="ml-1 px-2 py-1 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            {invoices.map((inv, i) => (
              <option key={i} value={i}>{inv.invoiceNumber} - {inv.clientName || 'New Client'}</option>
            ))}
          </select>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${STATUS_COLORS[invoice.status]}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button onClick={createNewInvoice} size="sm" variant="outline" className="h-7 text-xs px-2">
            <Plus className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
          <Button onClick={handlePrint} size="sm" variant="outline" className="h-7 text-xs px-2">
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print
          </Button>
          <Button onClick={exportCSV} size="sm" variant="outline" className="h-7 text-xs px-2">
            <FileDown className="h-3.5 w-3.5 mr-1" />
            CSV
          </Button>
          <Button onClick={exportJSON} size="sm" variant="outline" className="h-7 text-xs px-2">
            <Download className="h-3.5 w-3.5 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-1.5 h-8">
          <TabsTrigger value="edit" className="text-xs px-4 py-1">
            <Settings className="h-3 w-3 mr-1.5" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs px-4 py-1">
            <Eye className="h-3 w-3 mr-1.5" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Edit Tab */}
        <TabsContent value="edit" className="flex-1 overflow-auto mt-0 p-4 data-[state=inactive]:hidden">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Status & Dates Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Invoice Number</Label>
                <Input value={invoice.invoiceNumber} onChange={(e) => updateInvoice({ invoiceNumber: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Status</Label>
                <select
                  value={invoice.status}
                  onChange={(e) => updateInvoice({ status: e.target.value as InvoiceData['status'] })}
                  className="w-full h-8 px-2 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Invoice Date</Label>
                <Input type="date" value={invoice.invoiceDate} onChange={(e) => updateInvoice({ invoiceDate: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Due Date</Label>
                <Input type="date" value={invoice.dueDate} onChange={(e) => updateInvoice({ dueDate: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>

            {/* Company & Client */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-sm dark:text-white">From (Your Company)</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Company Name</Label>
                    <Input value={invoice.companyName} onChange={(e) => updateInvoice({ companyName: e.target.value })} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Address</Label>
                    <textarea
                      value={invoice.companyAddress}
                      onChange={(e) => updateInvoice({ companyAddress: e.target.value })}
                      className="w-full px-3 py-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input value={invoice.companyEmail} onChange={(e) => updateInvoice({ companyEmail: e.target.value })} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input value={invoice.companyPhone} onChange={(e) => updateInvoice({ companyPhone: e.target.value })} className="h-8 text-xs" />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-sm dark:text-white">Bill To (Client)</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Client Name</Label>
                    <Input value={invoice.clientName} onChange={(e) => updateInvoice({ clientName: e.target.value })} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Address</Label>
                    <textarea
                      value={invoice.clientAddress}
                      onChange={(e) => updateInvoice({ clientAddress: e.target.value })}
                      className="w-full px-3 py-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input value={invoice.clientEmail} onChange={(e) => updateInvoice({ clientEmail: e.target.value })} className="h-8 text-xs" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Currency & Tax */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Currency</Label>
                <select
                  value={invoice.currency}
                  onChange={(e) => updateInvoice({ currency: e.target.value })}
                  className="w-full h-8 px-2 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.symbol}>{c.symbol} {c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Tax Rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={invoice.taxRate}
                  onChange={(e) => updateInvoice({ taxRate: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Line Items */}
            <Card className="p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold text-sm dark:text-white">Line Items</h3>
                </div>
                <Button onClick={addItem} size="sm" variant="outline" className="h-7 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b dark:border-gray-600">
                      <th className="text-left py-2 font-semibold dark:text-gray-300 pl-1">Description</th>
                      <th className="text-center py-2 font-semibold dark:text-gray-300 w-20">Qty</th>
                      <th className="text-center py-2 font-semibold dark:text-gray-300 w-28">Unit Price</th>
                      <th className="text-center py-2 font-semibold dark:text-gray-300 w-20">Disc %</th>
                      <th className="text-right py-2 font-semibold dark:text-gray-300 w-28">Amount</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b dark:border-gray-700 group">
                        <td className="py-1.5 pr-2">
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="h-7 text-xs"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="py-1.5 px-1">
                          <Input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="h-7 text-xs text-center"
                          />
                        </td>
                        <td className="py-1.5 px-1">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-center"
                          />
                        </td>
                        <td className="py-1.5 px-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-center"
                          />
                        </td>
                        <td className="py-1.5 text-right font-semibold dark:text-white pr-2">
                          {formatCurrency(getItemTotal(item))}
                        </td>
                        <td className="py-1.5">
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => duplicateItem(item.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded" title="Duplicate">
                              <Copy className="h-3 w-3 text-gray-500" />
                            </button>
                            <button onClick={() => removeItem(item.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mt-4">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between dark:text-gray-300">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(subtotal + totalDiscount)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount:</span>
                      <span>-{formatCurrency(totalDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between dark:text-gray-300">
                    <span>After Discount:</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between dark:text-gray-300">
                    <span>Tax ({invoice.taxRate}%):</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t dark:border-gray-600 pt-2 dark:text-white">
                    <span>Total:</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Notes & Payment */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Notes</Label>
                <textarea
                  value={invoice.notes}
                  onChange={(e) => updateInvoice({ notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-xs dark:bg-gray-800 dark:text-white dark:border-gray-600 resize-none"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Payment Terms</Label>
                <textarea
                  value={invoice.paymentTerms}
                  onChange={(e) => updateInvoice({ paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border rounded text-xs dark:bg-gray-800 dark:text-white dark:border-gray-600 resize-none"
                  rows={3}
                  placeholder="Payment terms..."
                />
              </div>
            </div>

            {/* Delete Invoice */}
            {invoices.length > 1 && (
              <div className="flex justify-end">
                <Button onClick={deleteInvoice} size="sm" variant="outline" className="text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Invoice
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="flex-1 overflow-auto mt-0 data-[state=inactive]:hidden">
          <div className="max-w-3xl mx-auto p-6">
            <div ref={printRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">INVOICE</h1>
                    <p className="text-green-100 mt-1 font-mono">#{invoice.invoiceNumber}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    invoice.status === 'paid' ? 'bg-white/20 text-white' :
                    invoice.status === 'overdue' ? 'bg-red-500/80 text-white' :
                    invoice.status === 'sent' ? 'bg-blue-500/80 text-white' :
                    'bg-white/15 text-white'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>

              <div className="p-8">
                {/* Addresses */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">From</p>
                    <p className="font-bold text-lg dark:text-white">{invoice.companyName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line mt-1">{invoice.companyAddress}</p>
                    {invoice.companyEmail && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{invoice.companyEmail}</p>}
                    {invoice.companyPhone && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.companyPhone}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Bill To</p>
                    <p className="font-bold text-lg dark:text-white">{invoice.clientName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line mt-1">{invoice.clientAddress}</p>
                    {invoice.clientEmail && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{invoice.clientEmail}</p>}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Invoice Date</p>
                    <p className="font-semibold dark:text-white mt-0.5">{formatDate(invoice.invoiceDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Due Date</p>
                    <p className="font-semibold dark:text-white mt-0.5">{formatDate(invoice.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Amount Due</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-0.5">{formatCurrency(total)}</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                      <th className="text-left py-3 text-xs font-bold uppercase text-gray-500 tracking-wider">Description</th>
                      <th className="text-center py-3 text-xs font-bold uppercase text-gray-500 tracking-wider">Qty</th>
                      <th className="text-right py-3 text-xs font-bold uppercase text-gray-500 tracking-wider">Price</th>
                      {totalDiscount > 0 && <th className="text-right py-3 text-xs font-bold uppercase text-gray-500 tracking-wider">Disc</th>}
                      <th className="text-right py-3 text-xs font-bold uppercase text-gray-500 tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id} className={`border-b dark:border-gray-700 ${idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-700/20' : ''}`}>
                        <td className="py-3 dark:text-white">{item.description || 'Untitled Item'}</td>
                        <td className="py-3 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-600 dark:text-gray-400">{formatCurrency(item.price)}</td>
                        {totalDiscount > 0 && (
                          <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                            {item.discount > 0 ? `${item.discount}%` : '-'}
                          </td>
                        )}
                        <td className="py-3 text-right font-semibold dark:text-white">{formatCurrency(getItemTotal(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-80">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal + totalDiscount)}</span>
                      </div>
                      {totalDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-{formatCurrency(totalDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Tax ({invoice.taxRate}%):</span>
                        <span>{formatCurrency(tax)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold border-t-2 border-gray-200 dark:border-gray-600 pt-3 dark:text-white">
                        <span>Total:</span>
                        <span className="text-green-600 dark:text-green-400">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes & Terms */}
                {(invoice.notes || invoice.paymentTerms) && (
                  <div className="grid md:grid-cols-2 gap-6 pt-6 border-t dark:border-gray-700">
                    {invoice.notes && (
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Notes</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.paymentTerms && (
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">Payment Terms</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">{invoice.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
