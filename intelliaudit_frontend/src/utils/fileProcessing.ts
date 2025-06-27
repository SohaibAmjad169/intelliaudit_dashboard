import JSZip from 'jszip';

const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp'
];

export function isValidImageFile(file: File): boolean {
  // Check if it's a valid image type
  if (VALID_IMAGE_TYPES.includes(file.type)) {
    return true;
  }
  
  // Fallback to extension check if MIME type is not recognized
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? /^(jpe?g|png|gif|bmp)$/.test(extension) : false;
}

export function shouldProcessFile(file: File): boolean {
  // Skip macOS metadata files
  if (file.name.startsWith('._') || file.name.startsWith('.DS_Store')) {
    return false;
  }
  
  return isValidImageFile(file) || isZipFile(file);
}

export async function extractImagesFromZip(zipFile: File): Promise<File[]> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipFile);
  const imageFiles: File[] = [];

  // Process each file in the zip
  const processPromises = Object.keys(contents.files).map(async (filename) => {
    const file = contents.files[filename];
    if (!file.dir) {
      // Create a temporary File object to check if it's valid
      const blob = await file.async('blob');
      const tempFile = new File([blob], filename, {
        type: `image/${filename.split('.').pop()?.toLowerCase() === 'jpg' ? 'jpeg' : filename.split('.').pop()}`
      });
      
      if (isValidImageFile(tempFile) && !filename.startsWith('._')) {
        imageFiles.push(tempFile);
      }
    }
  });

  await Promise.all(processPromises);
  return imageFiles;
}

export function isZipFile(file: File): boolean {
  return file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.toLowerCase().endsWith('.zip');
}
