import React, { useState } from 'react';
import { FileText, Download, Upload, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const DocumentConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [conversionType, setConversionType] = useState<'toPDF' | 'toDOC'>('toPDF');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    
    setConverting(true);
    
    // Simulate conversion
    setTimeout(() => {
      const extension = conversionType === 'toPDF' ? '.pdf' : '.docx';
      const mimeType = conversionType === 'toPDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      const blob = new Blob([`Converted: ${file.name}`], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, '') + extension;
      a.click();
      URL.revokeObjectURL(url);
      setConverting(false);
      setFile(null);
    }, 1500);
  };

  const acceptedFormats = conversionType === 'toPDF' 
    ? '.doc,.docx,.txt,.rtf' 
    : '.pdf';

  const formatDescription = conversionType === 'toPDF'
    ? 'DOC, DOCX, TXT, RTF'
    : 'PDF';

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-auto">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Document Converter</h2>
      </div>

      <Tabs defaultValue="toPDF" onValueChange={(v) => setConversionType(v as 'toPDF' | 'toDOC')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="toPDF" className="gap-2">
            <FileText className="h-4 w-4" />
            To PDF
          </TabsTrigger>
          <TabsTrigger value="toDOC" className="gap-2">
            <FileText className="h-4 w-4" />
            To DOC
          </TabsTrigger>
        </TabsList>

        <TabsContent value="toPDF" className="space-y-6">
          <Card className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <FileText className="h-20 w-20 text-blue-500" />
                <ArrowLeftRight className="h-8 w-8 text-green-500 absolute -right-4 -bottom-2" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-center mb-2">
              Convert Documents to PDF
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Upload DOC, DOCX, TXT, or RTF files and convert them to PDF format
            </p>
            
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {file ? file.name : 'Click to upload document'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Supports: {formatDescription}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept={acceptedFormats}
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">{file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setFile(null)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleConvert}
                disabled={!file || converting}
                className="w-full gap-2"
                size="lg"
              >
                {converting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Convert to PDF
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ℹ️ Note: This is a demo converter. For production use, integrate with services like CloudConvert, Zamzar, or Adobe PDF Services API.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="toDOC" className="space-y-6">
          <Card className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <FileText className="h-20 w-20 text-red-500" />
                <ArrowLeftRight className="h-8 w-8 text-green-500 absolute -right-4 -bottom-2" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-center mb-2">
              Convert PDF to Document
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Upload PDF files and convert them to editable DOCX format
            </p>
            
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {file ? file.name : 'Click to upload PDF'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Supports: {formatDescription}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept={acceptedFormats}
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="font-semibold">{file.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setFile(null)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              <Button
                onClick={handleConvert}
                disabled={!file || converting}
                className="w-full gap-2"
                size="lg"
              >
                {converting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Convert to DOCX
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ℹ️ Note: This is a demo converter. For production use, integrate with services like CloudConvert, Zamzar, or Adobe PDF Services API.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Supported Conversions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-blue-600">To PDF</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• DOC → PDF</li>
              <li>• DOCX → PDF</li>
              <li>• TXT → PDF</li>
              <li>• RTF → PDF</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-red-600">From PDF</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• PDF → DOCX</li>
              <li>• PDF → DOC</li>
              <li>• PDF → TXT</li>
              <li>• PDF → RTF</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
