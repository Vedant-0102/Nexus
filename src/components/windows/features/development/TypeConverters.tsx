import React, { useState } from 'react';
import { FileImage, FileText, Download, Upload, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const TypeConverters: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [convertedImage, setConvertedImage] = useState<string>('');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpg'>('png');
  const [textContent, setTextContent] = useState('');
  const [htmlOutput, setHtmlOutput] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docContent, setDocContent] = useState<string>('');

  // Image Converter (JPG <-> PNG)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        // Auto-detect format
        if (file.type === 'image/png') {
          setImageFormat('jpg');
        } else {
          setImageFormat('png');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImage = async () => {
    if (!imageFile || !imagePreview) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // For JPG, fill white background (no transparency)
      if (imageFormat === 'jpg') {
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx?.drawImage(img, 0, 0);

      // Convert to target format
      const mimeType = imageFormat === 'png' ? 'image/png' : 'image/jpeg';
      const quality = imageFormat === 'jpg' ? 0.95 : undefined;
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setConvertedImage(url);
          
          // Auto download
          const a = document.createElement('a');
          a.href = url;
          a.download = `${imageFile.name.split('.')[0]}.${imageFormat}`;
          a.click();
        }
      }, mimeType, quality);
    };

    img.src = imagePreview;
  };

  // DOC to PDF Converter
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setDocContent(text);
      };
      reader.readAsText(file);
    }
  };

  const convertDocToPDF = () => {
    if (!docFile || !docContent) return;

    // Create HTML representation
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${docFile.name}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      padding: 1in;
      max-width: 8.5in;
      margin: 0 auto;
      background: white;
    }
    p { margin: 0 0 12pt 0; }
    h1, h2, h3 { margin: 18pt 0 12pt 0; }
  </style>
</head>
<body>
${docContent.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('\n')}
</body>
</html>`;

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docFile.name.split('.')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Text to HTML Converter
  const convertTextToHTML = () => {
    const lines = textContent.split('\n');
    let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += '  <title>Converted Document</title>\n';
    html += '  <style>\n';
    html += '    body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }\n';
    html += '    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }\n';
    html += '    p { margin: 10px 0; }\n';
    html += '  </style>\n';
    html += '</head>\n<body>\n';
    
    lines.forEach(line => {
      if (line.trim().startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, '');
        html += `  <h${level}>${text}</h${level}>\n`;
      } else if (line.trim()) {
        html += `  <p>${line}</p>\n`;
      } else {
        html += '  <br>\n';
      }
    });

    html += '</body>\n</html>';
    setHtmlOutput(html);
  };

  const downloadHTML = () => {
    const blob = new Blob([htmlOutput], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Type Converters</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Convert files between different formats</p>
      </div>

      <Tabs defaultValue="image" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <FileImage size={16} />
            JPG ↔ PNG
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText size={16} />
            Text to HTML
          </TabsTrigger>
          <TabsTrigger value="doc" className="flex items-center gap-2">
            <File size={16} />
            DOC to PDF
          </TabsTrigger>
        </TabsList>

        {/* Image Converter */}
        <TabsContent value="image" className="flex-1 p-4 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <FileImage size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload an image to convert between JPG and PNG
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button variant="outline" className="pointer-events-none">
                  <Upload size={16} className="mr-2" />
                  Choose Image
                </Button>
              </label>
            </div>

            {imagePreview && (
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Preview</h3>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-auto rounded"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Original: {imageFile?.type}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Convert to:
                  </label>
                  <select
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value as 'png' | 'jpg')}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="png">PNG (with transparency)</option>
                    <option value="jpg">JPG (smaller file size)</option>
                  </select>
                </div>

                <Button onClick={convertImage} className="w-full">
                  <Download size={16} className="mr-2" />
                  Convert & Download {imageFormat.toUpperCase()}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Text to HTML */}
        <TabsContent value="text" className="flex-1 p-4 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Enter Text (supports # for headings)
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                placeholder="# Heading 1&#10;## Heading 2&#10;&#10;Your text here..."
              />
            </div>

            <Button onClick={convertTextToHTML} className="w-full">
              Convert to HTML
            </Button>

            {htmlOutput && (
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">HTML Output</h3>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-64 text-gray-900 dark:text-gray-100">
                    {htmlOutput}
                  </pre>
                </div>
                <Button onClick={downloadHTML} variant="outline" className="w-full">
                  <Download size={16} className="mr-2" />
                  Download HTML File
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* DOC to PDF */}
        <TabsContent value="doc" className="flex-1 p-4 overflow-auto">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <File size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload a text/document file to convert to PDF format
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".txt,.doc,.docx,text/*"
                  onChange={handleDocUpload}
                  className="hidden"
                />
                <Button variant="outline" className="pointer-events-none">
                  <Upload size={16} className="mr-2" />
                  Choose Document
                </Button>
              </label>
            </div>

            {docContent && (
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Document Preview</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded max-h-64 overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-serif">
                      {docContent}
                    </pre>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    File: {docFile?.name}
                  </p>
                </div>
                
                <Button onClick={convertDocToPDF} className="w-full">
                  <Download size={16} className="mr-2" />
                  Convert & Download as HTML/PDF
                </Button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Note: This creates an HTML file that can be printed as PDF using your browser
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
