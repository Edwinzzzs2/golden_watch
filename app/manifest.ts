import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '建行实物黄金价格追踪',
    short_name: '黄金追踪',
    description: '实时追踪建设银行实物黄金价格走势',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#EAB308',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  };
}
