'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send,
  User,
  Video,
  Mic,
  Sparkles,
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

type VoiceInputStatus = 'idle' | 'recording' | 'transcribing' | 'sending';
type LiveModeStatus =
  | 'idle'
  | 'requesting_permissions'
  | 'ready'
  | 'starting'
  | 'connected'
  | 'error';

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
  const [voiceInputStatus, setVoiceInputStatus] = useState<VoiceInputStatus>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveModeStatus, setLiveModeStatus] = useState<LiveModeStatus>('idle');
  const [liveModeError, setLiveModeError] = useState('');
  const [copiedStateMap, setCopiedStateMap] = useState<Record<string, boolean>>(
    {}
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const cancelRecordingRef = useRef(false);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (voiceInputStatus !== 'recording') return;

    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [voiceInputStatus]);

  useEffect(() => {
    if (!liveVideoRef.current) return;
    liveVideoRef.current.srcObject = liveStreamRef.current;
  }, [liveModeStatus]);

  useEffect(() => {
    return () => {
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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

  const pushBotStatusMessage = (title: string, text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `status-${Date.now()}`,
        sender: 'bot',
        text,
        blocks: [
          { type: 'title', text: title },
          { type: 'paragraph', text },
        ],
        timestamp: new Date(),
      },
    ]);
  };

  const stopAudioCapture = () => {
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setRecordingSeconds(0);
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
    if (voiceInputStatus === 'transcribing' || voiceInputStatus === 'recording') return;
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

  const stopAudioRecording = (cancelled: boolean) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      stopAudioCapture();
      setVoiceInputStatus('idle');
      return;
    }

    cancelRecordingRef.current = cancelled;
    recorder.stop();
  };

  const transcribeAndSendAudio = async (audioBlob: Blob) => {
    setVoiceInputStatus('transcribing');

    const formData = new FormData();
    formData.append('file', audioBlob, `voice-note.${audioBlob.type.includes('ogg') ? 'ogg' : 'webm'}`);

    try {
      const response = await fetch('http://localhost:8000/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Audio transcription request failed');
      }

      const data: { transcript?: string } = await response.json();
      const transcript = (data.transcript || '').trim();

      if (!transcript) {
        pushBotStatusMessage('لم أسمع كلمات واضحة', 'حاول تتكلم بصوت أوضح ثم أعد التسجيل.');
        setVoiceInputStatus('idle');
        return;
      }

      setVoiceInputStatus('sending');
      await sendPrompt(transcript, { appendUserMessage: true });
      setVoiceInputStatus('idle');
    } catch (error) {
      console.error('Audio transcription error:', error);
      pushBotStatusMessage(
        'تعذر تحويل الصوت',
        'صار خلل بسيط أثناء تحويل الصوت إلى نص. حاول مرة ثانية.'
      );
      setVoiceInputStatus('idle');
    }
  };

  const startAudioRecording = async () => {
    if (voiceInputStatus !== 'idle') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      cancelRecordingRef.current = false;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const wasCancelled = cancelRecordingRef.current;
        const chunks = [...audioChunksRef.current];
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        stopAudioCapture();

        if (wasCancelled || blob.size === 0) {
          setVoiceInputStatus('idle');
          return;
        }

        await transcribeAndSendAudio(blob);
      };

      recorder.start();
      setRecordingSeconds(0);
      setVoiceInputStatus('recording');
    } catch (error) {
      console.error('Microphone access error:', error);
      pushBotStatusMessage(
        'تعذر الوصول للميكروفون',
        'يبدو أن إذن الميكروفون مرفوض. فعّل الميكروفون من إعدادات المتصفح ثم حاول مرة ثانية.'
      );
      setVoiceInputStatus('idle');
    }
  };

  const handleAudioRecordToggle = async () => {
    if (voiceInputStatus === 'recording') {
      stopAudioRecording(false);
      return;
    }
    await startAudioRecording();
  };

  const requestLivePermissions = async () => {
    setLiveModeStatus('requesting_permissions');
    setLiveModeError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      liveStreamRef.current?.getTracks().forEach((track) => track.stop());
      liveStreamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
      setLiveModeStatus('ready');
    } catch (error) {
      console.error('Live permissions error:', error);
      setLiveModeStatus('error');
      setLiveModeError(
        'لم أستطع تشغيل الكاميرا والمايك. تأكد من السماح بالأذونات ثم أعد المحاولة.'
      );
    }
  };

  const handleStartLiveMode = async () => {
    if (liveModeStatus === 'connected' || liveModeStatus === 'starting') return;

    if (!liveStreamRef.current) {
      await requestLivePermissions();
    }

    if (!liveStreamRef.current) return;

    setLiveModeStatus('starting');
    setLiveModeError('');

    try {
      const response = await fetch('http://localhost:8000/api/live/session', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start live session scaffold');
      }

      // TODO: Use live-session response to connect websocket transport for Gemini Live API.
      setLiveModeStatus('connected');
    } catch (error) {
      console.error('Live mode start error:', error);
      setLiveModeStatus('error');
      setLiveModeError('بدأنا التحضير للبث الحي لكن الاتصال فشل. حاول مرة ثانية.');
    }
  };

  const handleEndLiveMode = () => {
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    liveStreamRef.current = null;
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
    setLiveModeError('');
    setLiveModeStatus('idle');
  };

  const voiceStatusLabel =
    voiceInputStatus === 'recording'
      ? `جاري التسجيل... ${recordingSeconds}s`
      : voiceInputStatus === 'transcribing'
        ? 'جاري تحويل الصوت إلى نص...'
        : voiceInputStatus === 'sending'
          ? 'جاري إرسال الرسالة...'
          : '';

  const liveStatusLabel: Record<LiveModeStatus, string> = {
    idle: 'اضغط على تشغيل الكاميرا والمايك للبدء.',
    requesting_permissions: 'جاري طلب إذن الكاميرا والمايك...',
    ready: 'الكاميرا جاهزة. يمكنك بدء الجلسة الحية.',
    starting: 'جاري بدء وضع المحادثة الحية...',
    connected: 'وضع المحادثة الحية متصل (الردود اللحظية قيد التطوير).',
    error: liveModeError || 'حدث خطأ في وضع المحادثة الحية.',
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
                  voiceInputStatus === 'recording'
                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
                disabled={isThinking || voiceInputStatus === 'transcribing' || voiceInputStatus === 'sending'}
              >
                {voiceInputStatus === 'recording' ? (
                  <StopCircle className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <input
                type="text"
                value={voiceStatusLabel || inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اكتب رسالة، سؤال، أو حتى كود..."
                disabled={isThinking || voiceInputStatus !== 'idle'}
                className="flex-1 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm disabled:opacity-50"
              />

              {voiceInputStatus === 'recording' && (
                <button
                  type="button"
                  onClick={() => stopAudioRecording(true)}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={isThinking || voiceInputStatus !== 'idle' || !inputValue.trim()}
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
              مساحة حقيقية لتجربة الكاميرا والمايك وتجهيز وضع مباشر آمن. الردود اللحظية ستُربط لاحقاً بدون كسر الدردشة الحالية.
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-900 rounded-3xl flex-1 flex items-center justify-center relative overflow-hidden border-4 border-slate-800 min-h-[260px]">
              {liveStreamRef.current ? (
                <video
                  ref={liveVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-300 px-6">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-70" />
                  <p className="text-sm font-semibold">لا يوجد بث كاميرا حالياً</p>
                  <p className="text-xs opacity-80 mt-1">اسمح بالكاميرا والمايك لعرض المعاينة هنا.</p>
                </div>
              )}
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-sky-700 mb-1">حالة الوضع الحي:</p>
              <p className="text-sm font-medium text-slate-700 leading-7">{liveStatusLabel[liveModeStatus]}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={requestLivePermissions}
                disabled={
                  liveModeStatus === 'requesting_permissions' ||
                  liveModeStatus === 'starting'
                }
                className="bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                تشغيل الكاميرا والمايك
              </button>
              <button
                onClick={handleStartLiveMode}
                disabled={
                  liveModeStatus === 'requesting_permissions' ||
                  liveModeStatus === 'starting' ||
                  liveModeStatus === 'connected'
                }
                className="bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {liveModeStatus === 'connected' ? 'الجلسة الحية تعمل' : 'بدء الجلسة الحية'}
              </button>
              <button
                onClick={handleEndLiveMode}
                disabled={liveModeStatus === 'idle'}
                className="bg-rose-50 text-rose-700 font-bold py-3 rounded-xl hover:bg-rose-100 transition-all disabled:opacity-50"
              >
                إنهاء الجلسة
              </button>
            </div>

            {liveModeStatus === 'connected' && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold text-orange-800 mb-1">تنبيه مهم</p>
                <p className="text-sm font-medium text-orange-900/80 leading-7">
                  المعاينة والكاميرا تعملان الآن فعلياً. التكامل مع الرد الصوتي/المرئي اللحظي سيتم في خطوة لاحقة.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
