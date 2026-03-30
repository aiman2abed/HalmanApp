// src/app/assistant/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Video, Mic, CheckCircle, Sparkles ,BotMessageSquare} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

// Reusable animated thinking indicator
function ThinkingDots({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 justify-start"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border-2 border-white">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-tr-sm">
        <div className="flex gap-1.5 items-center h-full">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay }}
              className="w-2 h-2 bg-orange-400 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function AssistantPage() {
  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      text: "مرحباً يا بطل! أنا حلمان أفندي 🌟 أنا هنا لأساعدك في اكتشاف مهاراتك وبناء مستقبلك المشرق. كيف يمكنني مساعدتك اليوم؟ 🚀",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Video Coaching States
  const [isRecording, setIsRecording] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Simulated Frontend AI Logic (To be connected to FastAPI later)
  const simulateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('برمجة') || lowerMessage.includes('حاسوب') || lowerMessage.includes('روبوت')) {
      return "اختيار رائع! 🤖 البرمجة هي لغة المستقبل. يمكنك البدء بمهام مختبر الحاسوب في قسم المهمات. هل تحب أن أعطيك أول تحدي برمجي؟ 💻";
    }
    if (lowerMessage.includes('صعب') || lowerMessage.includes('لا أعرف') || lowerMessage.includes('حزين')) {
      return "لا تقلق أبداً! 💙 كل الأبطال يواجهون تحديات في البداية. الفشل هو خطوتك الأولى نحو النجاح. تذكر أنني هنا دائماً لمساعدتك. جرب أخذ نفس عميق ولنحاول مرة أخرى! 🌈";
    }
    if (lowerMessage.includes('أحلم') || lowerMessage.includes('مستقبل') || lowerMessage.includes('أريد')) {
      return "يا له من حلم مذهل! ✨ الأحلام الكبيرة تتحقق بخطوات صغيرة. بناءً على ملفك المهاري، أنت في الطريق الصحيح. استمر في إنجاز مهامك! 🎯";
    }
    
    return "هذا مثير للاهتمام جداً! 🤔 أخبرني المزيد... كيف تعتقد أن هذا سيساعدك في تطوير مهاراتك؟ أنا أستمع إليك! 💭";
  };

  const handleSend = () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage = inputValue;
    setMessages(prev => [...prev, { id: prev.length + 1, sender: 'user', text: userMessage, timestamp: new Date() }]);
    setInputValue('');
    setIsThinking(true);

    // Fake network delay
    setTimeout(() => {
      setMessages(prev => [...prev, { id: prev.length + 2, sender: 'bot', text: simulateAIResponse(userMessage), timestamp: new Date() }]);
      setIsThinking(false);
    }, 1500);
  };

  const handleRecording = () => {
    setIsRecording(true);
    // Fake 3 second video recording
    setTimeout(() => {
      setIsRecording(false);
      setShowAnalysis(true);
    }, 3000);
  };

  return (
    <div className="p-2 md:p-6 max-w-5xl mx-auto h-full flex flex-col gap-4">
      
      {/* Header */}
      <div className="mb-2 px-2">
        <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-xl border border-orange-200 shadow-sm">
            <Sparkles className="w-6 h-6 text-orange-500" />
          </div>
          حلمان أفندي
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">مدربك الشخصي ومرشدك الذكي 🌟</p>
      </div>

      {/* Main Grid: Stacked on Mobile, Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 pb-6">
        
        {/* Left Column: Text Chat UI */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 flex flex-col h-[500px] md:h-full overflow-hidden">
          
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
              <BotMessageSquare className="w-4 h-4 text-orange-500" />
              محادثة نصية
            </h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${
                    message.sender === 'user'
                      ? 'bg-sky-500 text-white rounded-tl-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tr-sm'
                  }`}>
                    {message.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <ThinkingDots visible={isThinking} />
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اسأل حلمان أفندي..."
                disabled={isThinking}
                className="flex-1 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isThinking || !inputValue.trim()}
                className="bg-orange-500 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-orange-200"
              >
                <Send className="w-5 h-5 -ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Multimodal Video Coaching */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-4 md:p-6 flex flex-col h-[500px] md:h-full">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Video className="w-5 h-5 text-sky-500" />
              التدريب التفاعلي
            </h2>
            <p className="text-xs text-slate-500 font-medium">تدرب على الإلقاء وتعرف على لغة جسدك</p>
          </div>

          {!showAnalysis ? (
            <div className="flex-1 flex flex-col gap-4">
              {/* Fake Camera Feed */}
              <div className="bg-slate-900 rounded-2xl flex-1 flex items-center justify-center relative overflow-hidden border-4 border-slate-800">
                {isRecording ? (
                  <div className="text-center animate-pulse">
                    <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 shadow-[0_0_20px_rgba(239,68,68,0.6)] border-2 border-white/50" />
                    <p className="text-white text-sm font-bold tracking-wider">جاري التحليل...</p>
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">معاينة الكاميرا</p>
                  </div>
                )}
              </div>

              {/* Coaching Prompt */}
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
                <p className="text-xs font-bold text-sky-700 mb-1">تحدي اليوم:</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  تحدث لمدة 15 ثانية عن مشروع علمي أو تقني تحلم بتصميمه في المستقبل!
                </p>
              </div>

              <button
                onClick={handleRecording}
                disabled={isRecording}
                className="w-full bg-gradient-to-r from-rose-400 to-red-500 text-white font-bold py-4 rounded-xl shadow-md shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mic className="w-5 h-5" />
                {isRecording ? 'استمع لك...' : 'ابدأ التحدي'}
              </button>
            </div>
          ) : (
            // Fake Analysis Result Screen
            <div className="flex-1 flex flex-col justify-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="text-center mb-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-slate-800">أداء رائع!</h3>
              </div>

              <div className="space-y-3">
                {/* Metric 1 */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">لغة الجسد والثقة</span>
                    <span className="text-emerald-600 font-black text-xs">85%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">نبرة الصوت</span>
                    <span className="text-sky-600 font-black text-xs">92%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="h-full bg-sky-500 rounded-full w-[92%]" />
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700">الوضوح والسرعة</span>
                    <span className="text-purple-600 font-black text-xs">ممتاز</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="h-full bg-purple-500 rounded-full w-[100%]" />
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mt-2 text-center">
                <p className="text-xs font-bold text-orange-800 mb-1">تعليق حلمان أفندي:</p>
                <p className="text-sm font-medium text-orange-900/80 leading-relaxed">
                  نبرة صوتك كانت حماسية جداً ومناسبة للحديث عن التقنية! حافظ على هذا الإبداع.
                </p>
              </div>

              <button
                onClick={() => setShowAnalysis(false)}
                className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 active:scale-95 transition-all mt-auto"
              >
                تدريب جديد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}