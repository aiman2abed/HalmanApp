import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Halman',
    short_name: 'Halman',
    description: 'منصة حلمان التعليمية',
    start_url: '/',
    display: 'standalone', // هذه الكلمة السحرية هي التي تخفي شريط المتصفح وتجعله يبدو كتطبيق حقيقي
    background_color: '#f8fafc', // لون الخلفية (متناسق مع bg-slate-50)
    theme_color: '#f97316', // لون شريط الإشعارات العلوي في الهاتف (برتقالي)
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}