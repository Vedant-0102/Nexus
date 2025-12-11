import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, Plus, Trash2, Printer } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export const InvoiceGenerator = () => {
  const [companyName, setCompanyName] = useState('Your Company');
  const [clientName, setClientName] = useState('Client Name');
  const [invoiceNumber, setInvoiceNumber] = useState('INV-001');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Service', quantity: 1, price: 100 }
  ]);

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      description: 'New Item',
      quantity: 1,
      price: 0
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold dark:text-white">Invoice Generator</h1>
        </div>
        <Button onClick={() => window.print()} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-4 dark:bg-gray-800 space-y-4">
          <div>
            <Label>Company Name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div>
            <Label>Client Name</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
          <div>
            <Label>Invoice Number</Label>
            <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
        </Card>

        <Card className="md:col-span-2 p-6 dark:bg-gray-800">
          <div className="bg-white dark:bg-gray-900 p-6 rounded border">
            <div className="mb-6">
              <h2 className="text-2xl font-bold dark:text-white">INVOICE</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">#{invoiceNumber}</p>
            </div>

            <div className="mb-6">
              <p className="font-semibold dark:text-white">{companyName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Bill To: {clientName}</p>
            </div>

            <table className="w-full mb-6">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        className="text-sm"
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="text-sm w-20"
                      />
                    </td>
                    <td className="py-2">
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="text-sm w-24"
                      />
                    </td>
                    <td className="py-2 text-right dark:text-white">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button onClick={addItem} variant="outline" size="sm" className="mb-6">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
