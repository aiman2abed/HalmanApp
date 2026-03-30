'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Video,
  Mic,
  CheckCircle,
  Sparkles,
  BotMessageSquare,
  StopCircle,
  Smile,
  Code2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

// ==========================================
// TYPES
// ==========================================
type MessageBlock =
  | { type: 'title'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; text: string; language?: string }
  | { type: 'list'; items: string[]; text?: string };

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  blocks?: MessageBlock[];
  timestamp: Date;
}

interface ChatApiResponse {
  reply: string;
  blocks?: MessageBlock[];
}

interface SendPromptOptions {
  appendUserMessage?: boolean;
}

// ==========================================
// UI HELPERS
// ==========================================
function ThinkingDots({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 justify-start"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border-2 border-white overflow-hidden">
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

function MessageContent({
  message,
  onCopyCode,
  copiedCodeMap,
}: {
  message: Message;
  onCopyCode: (key: string, text: string) => void;
  copiedCodeMap: Record<string, boolean>;
}) {
  const isUser = message.sender === 'user';

  if (isUser || !message.blocks || message.blocks.length === 0) {
    return <p className="whitespace-pre-wrap break-words">{message.text}</p>;
  }

  return (
    <div className="space-y-3">
      {message.blocks.map((block, index) => {
        if (block.type === 'title') {
          return (
            <h3
              key={index}
              className="text-base md:text-lg font-extrabold text-slate-800"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p
              key={index}
              className="text-sm md:text-[15px] leading-7 text-slate-700 whitespace-pre-wrap"
            >
              {block.text}
            </p>
          );
        }

        if (block.type === 'list') {
          return (
            <div key={index} className="space-y-2">
              {block.text ? (
                <p className="text-sm leading-7 text-slate-700">{block.text}</p>
              ) : null}
              <ul className="list-disc pr-5 space-y-1 text-sm text-slate-700">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="leading-7">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (block.type === 'code') {
          const codeCopyKey = `${message.id}-code-${index}`;
          return (
            <div
              key={index}
              className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-sm"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                  <Code2 className="w-4 h-4" />
                  <span>{block.language || 'code'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onCopyCode(codeCopyKey, block.text)}
                  className="text-[11px] md:text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedCodeMap[codeCopyKey] ? 'تم النسخ' : 'نسخ الكود'}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-sm text-slate-100 leading-6">
                <code>{block.text}</code>
              </pre>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function AssistantPage() {
  const { profile } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: 'مرحباً! أنا حلمان أفندي. أنا هنا لأساعدك بطريقة بسيطة ومريحة. احكيلي شو حابب نبدأ فيه.',
      blocks: [
        { type: 'title', text: 'مرحباً 👋' },
        {
          type: 'paragraph',
          text: 'أنا حلمان أفندي، موجود حتى أساعدك بطريقة بسيطة ومريحة.',
        },
        {
          type: 'paragraph',
          text: 'احكيلي شو حابب نبدأ فيه: سؤال، فكرة، شرح، أو حتى كود.',
        },
      ],
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [copiedStateMap, setCopiedStateMap] = useState<Record<string, boolean>>(
    {}
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const normalizeBlocks = (blocks: MessageBlock[] | undefined, reply: string) => {
    if (blocks && blocks.length > 0) return blocks;
    return [{ type: 'paragraph' as const, text: reply }];
  };

  const buildPlainTextFromMessage = (message: Message): string => {
    if (!message.blocks || message.blocks.length === 0) return message.text;

    const sections = message.blocks.flatMap((block) => {
      if (block.type === 'title' || block.type === 'paragraph') {
        return block.text ? [block.text] : [];
      }
      if (block.type === 'list') {
        const intro = block.text ? [block.text] : [];
        const items = (block.items || []).map((item) => `- ${item}`);
        return [...intro, ...items];
      }
      if (block.type === 'code') {
        const lang = block.language || 'code';
        return [`[${lang}]`, block.text || ''];
      }
      return [];
    });

    const composed = sections.join('\n').trim();
    return composed || message.text;
  };

  const copyWithFeedback = async (key: string, text: string) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStateMap((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStateMap((prev) => ({ ...prev, [key]: false }));
      }, 1500);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
    }
  };

  const sendPrompt = async (prompt: string, options: SendPromptOptions = {}) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isThinking) return;

    const appendUserMessage = options.appendUserMessage ?? true;
    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: trimmedPrompt,
      timestamp: new Date(),
    };

    if (appendUserMessage) {
      setMessages((prev) => [...prev, userMessage]);
    }

    setIsThinking(true);

    try {
      const historyForBackend = messages
        .filter((m) => m.id !== 'init-1')
        .map((m) => ({
          role: m.sender === 'bot' ? 'model' : 'user',
          text: m.text,
        }));

      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: trimmedPrompt,
          student_name: profile?.display_name || 'يا صديقي',
          dominant_trait: 'مستكشف',
          history: historyForBackend,
        }),
      });

      if (!response.ok) throw new Error('Failed to reach backend');

      const data: ChatApiResponse = await response.json();
      const botMsgId = `bot-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: data.reply,
          blocks: normalizeBlocks(data.blocks, data.reply),
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'bot',
          text: 'عذراً، صار عندي خلل صغير بالاتصال. جرّب مرة ثانية.',
          blocks: [
            { type: 'title', text: 'مشكلة اتصال بسيطة' },
            {
              type: 'paragraph',
              text: 'عذراً، صار عندي خلل صغير بالاتصال. جرّب مرة ثانية.',
            },
          ],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = async () => {
    const prompt = inputValue;
    setInputValue('');
    await sendPrompt(prompt, { appendUserMessage: true });
  };

  const handleRetry = async (assistantMessageId: string) => {
    if (isThinking) return;

    const currentIndex = messages.findIndex((m) => m.id === assistantMessageId);
    if (currentIndex <= 0) return;

    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      const candidate = messages[i];
      if (candidate.sender === 'user' && candidate.text.trim()) {
        await sendPrompt(candidate.text, { appendUserMessage: true });
        return;
      }
    }
  };

  const handleAudioRecordToggle = () => {
    if (isRecordingAudio) {
      setIsRecordingAudio(false);
      setInputValue('أنا أحب تعلم أشياء جديدة!');
      setTimeout(() => handleSend(), 500);
    } else {
      setIsRecordingAudio(true);
    }
  };

  const handleVideoRecording = () => {
    setIsRecordingVideo(true);
    setTimeout(() => {
      setIsRecordingVideo(false);
      setShowAnalysis(true);
    }, 3000);
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto h-full flex flex-col gap-5">
      {/* HEADER */}
      <div className="px-1 md:px-2">
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur rounded-2xl px-4 py-3 border border-orange-100 shadow-sm">
          <div className="bg-orange-100 p-2 rounded-xl border border-orange-200 shadow-sm">
            <Smile className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
              مساحة المساعدة
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              تحدث، اسأل، وتعلّم مع حلمان أفندي بطريقة مرتبة وواضحة
            </p>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5 flex-1 min-h-0 pb-6">
        {/* LEFT: CHAT */}
        <div className="bg-white rounded-[28px] shadow-lg border border-slate-100 flex flex-col min-h-[620px] overflow-hidden">
          {/* CHAT HEADER */}
          <div className="bg-gradient-to-r from-orange-50 to-pink-50 border-b border-orange-100 p-4 md:p-5 flex items-center gap-4 shadow-sm z-10">
            <div className="relative w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-orange-200 flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center text-orange-500 font-black text-xs">
                حلمان
              </div>
              <Image
                src="/assets/halman-avatar.png"
                alt="حلمان أفندي"
                fill
                sizes="56px"
                className="z-10 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div className="min-w-0">
              <h2 className="font-black text-slate-800 text-lg">حلمان أفندي</h2>
              <p className="text-sm text-slate-600 font-medium">
                مساعد ذكي يشرح، يرتّب الأفكار، ويدعمك خطوة بخطوة
              </p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 mt-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                متصل الآن
              </div>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 bg-slate-50/70">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-9 h-9 bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white overflow-hidden relative mt-1">
                      <Image
                        src="/assets/halman-avatar.png"
                        alt="Bot"
                        fill
                        sizes="36px"
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <Smile className="w-4 h-4 text-orange-500 z-0" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-3xl shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-sky-500 text-white rounded-tl-md px-4 py-3'
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tr-md px-4 py-3.5'
                    }`}
                  >
                    <MessageContent
                      message={message}
                      onCopyCode={copyWithFeedback}
                      copiedCodeMap={copiedStateMap}
                    />
                    {message.sender === 'bot' && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyWithFeedback(
                              `${message.id}-all`,
                              buildPlainTextFromMessage(message)
                            )
                          }
                          className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {copiedStateMap[`${message.id}-all`]
                            ? 'تم النسخ'
                            : 'نسخ الكل'}
                        </button>
                        <button
                          type="button"
                          disabled={isThinking}
                          onClick={() => handleRetry(message.id)}
                          className="text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          إعادة المحاولة
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <ThinkingDots visible={isThinking} />
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="p-3 md:p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2 items-center">
              <button
                onClick={handleAudioRecordToggle}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md flex-shrink-0 ${
                  isRecordingAudio
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                {isRecordingAudio ? (
                  <StopCircle className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <input
                type="text"
                value={isRecordingAudio ? 'جاري الاستماع إليك...' : inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اكتب رسالة، سؤال، أو حتى كود..."
                disabled={isThinking || isRecordingAudio}
                className="flex-1 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm disabled:opacity-50"
              />

              <button
                onClick={handleSend}
                disabled={isThinking || (!inputValue.trim() && !isRecordingAudio)}
                className="bg-orange-500 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-orange-200 flex-shrink-0"
              >
                <Send className="w-5 h-5 -ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: VIDEO PANEL */}
        <div className="bg-white rounded-[28px] shadow-lg border border-slate-100 p-4 md:p-6 flex flex-col min-h-[620px]">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Video className="w-5 h-5 text-sky-500" />
              التدريب التفاعلي
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-6">
              مساحة تجريبية للصوت والفيديو. الواجهة جاهزة، والتحليل التفصيلي يمكن تطويره لاحقاً بدون كسر الشكل الحالي.
            </p>
          </div>

          {!showAnalysis ? (
            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-slate-900 rounded-3xl flex-1 flex items-center justify-center relative overflow-hidden border-4 border-slate-800">
                {isRecordingVideo ? (
                  <div className="text-center animate-pulse">
                    <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center justify-center border-2 border-white/50">
                      <Mic className="w-5 h-5 text-white animate-bounce" />
                    </div>
                    <p className="text-white text-sm font-bold tracking-wider">
                      جاري الاستماع والتحليل...
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">منطقة الكاميرا التجريبية</p>
                  </div>
                )}
              </div>

              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-sky-700 mb-1">تحدي اليوم:</p>
                <p className="text-sm font-medium text-slate-700 leading-7">
                  تحدث لمدة 15 ثانية عن شيء يسعدك. الهدف هنا أن تتكلم براحتك، لا أن تكون مثالياً.
                </p>
              </div>

              <button
                onClick={handleVideoRecording}
                disabled={isRecordingVideo}
                className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold py-4 rounded-xl shadow-md shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Video className="w-5 h-5" />
                {isRecordingVideo ? 'حلمان يتابعك الآن...' : 'ابدأ التحدي المرئي'}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="text-center mb-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-slate-800">أداء جميل جداً</h3>
                <p className="text-sm text-slate-500 mt-1">
                  هذه نتائج تجريبية للواجهة ويمكن لاحقاً ربطها بتحليل حقيقي.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      لغة الجسد والثقة
                    </span>
                    <span className="text-emerald-600 font-black text-xs">مذهل</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="h-full bg-emerald-500 rounded-full w-[90%]" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mic className="w-3 h-3" />
                      نبرة الصوت
                    </span>
                    <span className="text-sky-600 font-black text-xs">هادئة ومريحة</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="h-full bg-sky-500 rounded-full w-[85%]" />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <BotMessageSquare className="w-3 h-3" />
                      وضوح الأفكار
                    </span>
                    <span className="text-purple-600 font-black text-xs">مرتب وواضح</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="h-full bg-purple-500 rounded-full w-[95%]" />
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mt-2 text-center relative">
                <div className="absolute -top-4 -right-2 w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden bg-orange-200">
                  <Image
                    src="/assets/halman-avatar.png"
                    alt="حلمان"
                    fill
                    sizes="32px"
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-xs font-bold text-orange-800 mb-1">
                  ملاحظة من حلمان أفندي
                </p>
                <p className="text-sm font-medium text-orange-900/80 leading-7">
                  أحببت وضوحك أثناء الحديث. الأفكار كانت مرتبة والنبرة مريحة. استمر بالتعبير عن نفسك بهذه الثقة.
                </p>
              </div>

              <button
                onClick={() => setShowAnalysis(false)}
                className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-200 active:scale-95 transition-all mt-auto"
              >
                تحدي مرئي جديد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
