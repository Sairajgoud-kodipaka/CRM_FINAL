'use client';

import { config } from './config';

export interface UploadedImageInfo {
  url: string;
  thumbUrl: string;
  width?: number;
  height?: number;
  publicId?: string;
}

export async function uploadImageToCloudinary(file: File): Promise<UploadedImageInfo> {
  if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured');
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', config.CLOUDINARY_UPLOAD_PRESET);
  if (config.CLOUDINARY_FOLDER) form.append('folder', config.CLOUDINARY_FOLDER);

  const res = await fetch(endpoint, { method: 'POST', body: form });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || 'Upload failed');
  }
  const data = await res.json();
  const secureUrl: string = data.secure_url;
  const publicId: string = data.public_id;
  const width: number | undefined = data.width;
  const height: number | undefined = data.height;

  // Build a small thumbnail URL using Cloudinary transformations (w=300, q_auto,f_auto)
  const cloudBase = `https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const thumbUrl = `${cloudBase}/f_auto,q_auto,w_300/${publicId}.webp`;

  return { url: secureUrl, thumbUrl, width, height, publicId };
}

export function isAllowedImageFile(file: File): boolean {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  return allowed.includes(file.type) && file.size <= maxSize;
}


