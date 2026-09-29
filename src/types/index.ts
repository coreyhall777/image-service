export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'jpg' | 'png' | 'webp';
  quality?: number;
  crop?: 'fill' | 'fit' | 'contain';
}

export interface VideoThumbnailOptions {
  time: number;
  format?: 'jpeg' | 'jpg' | 'png';
  quality?: number;
}
