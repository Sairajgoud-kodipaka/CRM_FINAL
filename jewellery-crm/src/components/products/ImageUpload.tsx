'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  mainImage?: string;
  additionalImages?: string[];
  onMainImageChange: (file: File | null) => void;
  onAdditionalImagesChange: (files: File[]) => void;
  onRemoveImage?: (index: number) => void;
}

export default function ImageUpload({
  mainImage,
  additionalImages = [],
  onMainImageChange,
  onAdditionalImagesChange,
  onRemoveImage
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState<string[]>([]);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

  // Handle main image preview
  useEffect(() => {
    if (mainImage) {
      setMainImagePreview(mainImage);
    } else {
      setMainImagePreview(null);
    }
  }, [mainImage]);

  // Handle additional images previews
  useEffect(() => {
    setAdditionalImagesPreviews(additionalImages);
  }, [additionalImages]);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreview(previewUrl);
    } else {
      setMainImagePreview(null);
    }
    onMainImageChange(file);
  };

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setAdditionalImagesPreviews(prev => [...prev, ...previewUrls]);
    onAdditionalImagesChange(files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreview(previewUrl);
      onMainImageChange(file);
    }
  };

  const handleRemoveMainImage = () => {
    if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mainImagePreview);
    }
    setMainImagePreview(null);
    onMainImageChange(null);
  };

  const handleRemoveAdditionalImage = (index: number) => {
    const previewUrl = additionalImagesPreviews[index];
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const newPreviews = additionalImagesPreviews.filter((_, i) => i !== index);
    setAdditionalImagesPreviews(newPreviews);
    if (onRemoveImage) {
      onRemoveImage(index);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Main Image Upload */}
      <div className="space-y-2">
        <Label htmlFor="main-image">Main Product Image</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {mainImagePreview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={mainImagePreview}
                  alt="Main product"
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                  onClick={handleRemoveMainImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">Main product image</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">
                  Drag and drop an image here, or{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-500"
                    onClick={() => mainImageInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          )}
          <input
            ref={mainImageInputRef}
            type="file"
            id="main-image"
            accept="image/*"
            onChange={handleMainImageChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Additional Images Upload */}
      <div className="space-y-2">
        <Label htmlFor="additional-images">Additional Images</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <ImageIcon className="h-5 w-5 text-gray-400" />
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 text-sm"
              onClick={() => additionalImagesInputRef.current?.click()}
            >
              Add additional images
            </button>
          </div>
          <input
            ref={additionalImagesInputRef}
            type="file"
            id="additional-images"
            accept="image/*"
            multiple
            onChange={handleAdditionalImagesChange}
            className="hidden"
          />
        </div>

        {/* Display additional images */}
        {additionalImagesPreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {additionalImagesPreviews.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Additional product ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveAdditionalImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 