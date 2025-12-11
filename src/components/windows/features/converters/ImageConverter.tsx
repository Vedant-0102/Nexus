import React, { useState } from 'react';
import { FileImage, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ImageConverter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpg'>('png');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
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
      
      if (imageFormat === 'jpg') {
        ctx!.fillStyle = '#FFFFFF';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx?.drawImage(img, 0, 0);

      const mimeType = imageFormat === 'png' ? 'image/png' : 'image/jpeg';
      const quality = imageFormat === 'jpg' ? 0.95 : undefined;
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${imageFile.name.split('.')[0]}.${imageFormat}`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, mimeType, quality);
    };

    img.src = imagePreview;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 p-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Image Converter</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Convert between JPG and PNG formats</p>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-4">
        <div className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <FileImage size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload an image to convert
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
          <div className="w-full space-y-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Preview</h3>
              <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded" />
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
    </div>
  );
};
