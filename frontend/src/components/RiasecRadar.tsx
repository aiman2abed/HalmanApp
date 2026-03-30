// src/components/RiasecRadar.tsx
'use client';

import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip 
} from 'recharts';

interface RiasecRadarProps {
  scores: Record<string, number>;
}

// Translate English keys to Arabic for the chart labels
const traitTranslations: Record<string, string> = {
  Realistic: 'عملي',
  Investigative: 'مفكر',
  Artistic: 'فني',
  Social: 'اجتماعي',
  Enterprising: 'مبادر',
  Conventional: 'منظم'
};

export default function RiasecRadar({ scores }: RiasecRadarProps) {
  // Transform the scores object into an array for Recharts
  const data = Object.keys(scores).map((key) => ({
    subject: traitTranslations[key] || key,
    score: scores[key],
    fullMark: 12, // Assuming max score per trait is roughly 12-15 based on your 24 cards
  }));

  return (
    <div className="w-full h-64 bg-white rounded-2xl shadow-inner border border-slate-50 p-2 relative" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} 
          />
          <Tooltip 
            wrapperStyle={{ direction: 'rtl' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Radar 
            name="نقاطك" 
            dataKey="score" 
            stroke="#f97316" 
            strokeWidth={3}
            fill="#fb923c" 
            fillOpacity={0.5} 
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}