import React, { useState } from 'react';
import { Send, Plus, Trash2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Header {
  id: string;
  key: string;
  value: string;
}

export const APITester: React.FC = () => {
  const [method, setMethod] = useState<string>('GET');
  const [url, setUrl] = useState<string>('');
  const [headers, setHeaders] = useState<Header[]>([{ id: '1', key: '', value: '' }]);
  const [body, setBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const addHeader = () => {
    setHeaders([...headers, { id: Date.now().toString(), key: '', value: '' }]);
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  const updateHeader = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const sendRequest = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setResponse('');
    setStatus('');

    try {
      const requestHeaders: Record<string, string> = {};
      headers.forEach(h => {
        if (h.key.trim()) requestHeaders[h.key] = h.value;
      });

      const options: RequestInit = {
        method,
        headers: requestHeaders,
      };

      if (method !== 'GET' && body.trim()) {
        options.body = body;
      }

      const startTime = Date.now();
      const res = await fetch(url, options);
      const duration = Date.now() - startTime;

      const contentType = res.headers.get('content-type');
      let responseData: string;

      if (contentType?.includes('application/json')) {
        const json = await res.json();
        responseData = JSON.stringify(json, null, 2);
      } else {
        responseData = await res.text();
      }

      setResponse(responseData);
      setStatus(`${res.status} ${res.statusText} • ${duration}ms`);
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('Request Failed');
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <h2 className="text-2xl font-semibold dark:text-white">API Tester</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Request Line */}
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 font-semibold"
            >
              {methods.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
              onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
            />
            <Button onClick={sendRequest} disabled={loading || !url.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          {/* Request Details */}
          <Tabs defaultValue="headers" className="border rounded dark:border-gray-700">
            <TabsList className="w-full justify-start rounded-none border-b dark:border-gray-700">
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
            </TabsList>

            <TabsContent value="headers" className="p-4 space-y-2">
              {headers.map(header => (
                <div key={header.id} className="flex gap-2">
                  <input
                    type="text"
                    value={header.key}
                    onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                    placeholder="Header name"
                    className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
                  />
                  <input
                    type="text"
                    value={header.value}
                    onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                    placeholder="Header value"
                    className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHeader(header.id)}
                    disabled={headers.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-2" />
                Add Header
              </Button>
            </TabsContent>

            <TabsContent value="body" className="p-4">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full h-48 px-3 py-2 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700 font-mono text-sm resize-none"
              />
            </TabsContent>
          </Tabs>

          {/* Response */}
          {(response || status) && (
            <div className="border rounded dark:border-gray-700">
              <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="font-semibold dark:text-white">Response {status && `• ${status}`}</span>
                <Button variant="ghost" size="sm" onClick={copyResponse}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <pre className="p-4 overflow-auto max-h-96 text-sm dark:text-gray-300">
                {response}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
