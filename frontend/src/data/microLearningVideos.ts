// src/data/microLearningVideos.ts

export interface MicroLearningVideo {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryName: string;
  hashtag: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}

export const microLearningVideos: MicroLearningVideo[] = [
  {
    id: '1',
    title: 'كيف تعمل حساسات الروبوت؟',
    description: 'هل تعلم أن الروبوتات تستخدم الحساسات "لرؤية" العالم من حولها؟',
    category: 'R',
    categoryName: 'الواقعي',
    hashtag: '#روبوتات',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-robotic-arm-in-a-factory-4484-large.mp4',
    thumbnailUrl: '',
    duration: 15,
  },
  {
    id: '2',
    title: 'عملية التمثيل الضوئي',
    description: 'التمثيل الضوئي هو كيف تأكل النباتات ضوء الشمس!',
    category: 'I',
    categoryName: 'الاستقصائي',
    hashtag: '#علوم',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-green-leaves-growing-in-a-garden-4485-large.mp4',
    thumbnailUrl: '',
    duration: 12,
  },
  {
    id: '3',
    title: 'نصيحة للبودكاست',
    description: 'نصيحة: ابتسم عندما تتحدث لتجعل صوتك يبدو أكثر ودية!',
    category: 'A',
    categoryName: 'الفني',
    hashtag: '#بودكاست',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-person-speaking-into-a-microphone-4486-large.mp4',
    thumbnailUrl: '',
    duration: 10,
  },
  {
    id: '4',
    title: 'العمل الجماعي يحقق الأحلام',
    description: 'تعلم كيفية التعاون مع الآخرين لتحقيق أهداف كبيرة!',
    category: 'S',
    categoryName: 'الاجتماعي',
    hashtag: '#تعاون',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-working-together-in-a-meeting-4487-large.mp4',
    thumbnailUrl: '',
    duration: 14,
  }
];