'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Video,
  Mic,
  Sparkles,
  StopCircle,
  Code2,
  Camera,
  RotateCcw,
  Radio,
  Upload,
  Brain,
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
type WorkspaceMode = 'chat' | 'live' | 'analyzer';
type LiveModeStatus =
  | 'idle'
  | 'requesting_permissions'
  | 'ready'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'assistant_speaking'
  | 'disconnected'
  | 'error';
type AnalyzerInputMode = 'upload_audio' | 'upload_video' | 'record_audio' | 'record_video';
type AnalyzerStatus = 'idle' | 'recording' | 'processing' | 'error' | 'done';

interface LiveSessionApiResponse {
  status: 'ready_for_transport';
  message: string;
  session_id: string;
  websocket_path: string;
  live_ai_connected: boolean;
}

interface AnalysisSection {
  title: string;
  points: string[];
}

interface AnalysisMetric {
  label: string;
  score: number;
  note: string;
}

interface AnalyzerResponse {
  title: string;
  summary: string;
  sections: AnalysisSection[];
  metrics: AnalysisMetric[];
  tips: string[];
  hints: string[];
  availability_notes: string[];
}

interface LiveSessionConnection {
  sessionId: string;
  socket: WebSocket;
}

interface LiveWsEventPayload {
  event?: string;
  message?: string;
  text?: string;
  source?: 'user' | 'assistant';
  audio_base64?: string;
  mime_type?: string;
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

function LiveAvatar({ status }: { status: LiveModeStatus }) {
  const isListening = status === 'listening';
  const isSpeaking = status === 'assistant_speaking';
  const isDisconnected = status === 'disconnected' || status === 'error';

  const ringClass = isSpeaking
    ? 'border-orange-300 shadow-[0_0_40px_rgba(249,115,22,0.45)]'
    : isListening
      ? 'border-sky-300 shadow-[0_0_34px_rgba(56,189,248,0.35)]'
      : isDisconnected
        ? 'border-slate-300 opacity-70'
        : 'border-orange-200 shadow-[0_0_28px_rgba(249,115,22,0.22)]';

  return (
    <div className="relative w-36 h-36 mx-auto md:h-44 md:w-44">
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.08, 1] : isListening ? [1, 1.04, 1] : [1, 1.02, 1],
          y: [0, -4, 0],
        }}
        transition={{ duration: isSpeaking ? 0.8 : 2.6, repeat: Infinity }}
        className={`absolute inset-0 rounded-full border-4 ${ringClass} transition-all`}
      />
      <motion.div
        animate={{ opacity: [0.2, 0.45, 0.2], scale: [0.95, 1.08, 0.95] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className={`absolute -inset-2 rounded-full ${
          isDisconnected ? 'bg-slate-200/40' : isSpeaking ? 'bg-orange-300/30' : 'bg-sky-300/25'
        }`}
      />
      <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-white bg-orange-100 shadow-xl">
        <Image
          src="/assets/halman-avatar.png"
          alt="حلمان أفندي"
          fill
          sizes="176px"
          className="object-cover"
        />
      </div>
      {!isDisconnected && (
        <motion.span
          animate={{ scaleY: [1, 0.05, 1], opacity: [0.16, 0.4, 0.16] }}
          transition={{ duration: 4.8, repeat: Infinity, repeatDelay: 3.5 }}
          className="absolute left-7 right-7 top-[54px] h-[3px] rounded-full bg-slate-700"
        />
      )}
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

  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [voiceInputStatus, setVoiceInputStatus] = useState<VoiceInputStatus>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [liveModeStatus, setLiveModeStatus] = useState<LiveModeStatus>('idle');
  const [liveModeError, setLiveModeError] = useState('');
  const [liveMicActive, setLiveMicActive] = useState(false);
  const [liveCameraActive, setLiveCameraActive] = useState(false);

  const [analyzerInputMode, setAnalyzerInputMode] = useState<AnalyzerInputMode>('upload_audio');
  const [analyzerStatus, setAnalyzerStatus] = useState<AnalyzerStatus>('idle');
  const [analyzerError, setAnalyzerError] = useState('');
  const [analyzerResult, setAnalyzerResult] = useState<AnalyzerResponse | null>(null);
  const [analyzerSourceName, setAnalyzerSourceName] = useState('');

  const [copiedStateMap, setCopiedStateMap] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const cancelRecordingRef = useRef(false);

  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const liveConnectionRef = useRef<LiveSessionConnection | null>(null);
  const liveAudioContextRef = useRef<AudioContext | null>(null);
  const liveAudioNodeRef = useRef<ScriptProcessorNode | null>(null);
  const liveAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const liveOutputContextRef = useRef<AudioContext | null>(null);
  const liveOutputNextTimeRef = useRef(0);
  const liveOutputPendingRef = useRef(0);
  const liveIsClosingRef = useRef(false);
  const liveModeStatusRef = useRef<LiveModeStatus>('idle');

  const analyzerRecorderRef = useRef<MediaRecorder | null>(null);
  const analyzerStreamRef = useRef<MediaStream | null>(null);
  const analyzerChunksRef = useRef<BlobPart[]>([]);

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
    liveModeStatusRef.current = liveModeStatus;
  }, [liveModeStatus]);

  useEffect(() => {
    if (!liveVideoRef.current) return;
    liveVideoRef.current.srcObject = liveStreamRef.current;
  }, [liveModeStatus]);

  useEffect(() => {
    return () => {
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      liveConnectionRef.current?.socket.close();
      liveConnectionRef.current = null;
      liveAudioNodeRef.current?.disconnect();
      liveAudioSourceRef.current?.disconnect();
      liveAudioContextRef.current?.close();
      liveOutputContextRef.current?.close();
      liveStreamRef.current?.getTracks().forEach((track) => track.stop());
      analyzerRecorderRef.current?.stop();
      analyzerStreamRef.current?.getTracks().forEach((track) => track.stop());
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
    const userMessage: Message = {
      id: `user-${Date.now()}`,
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

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
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

  const stopLiveTracks = () => {
    liveStreamRef.current?.getTracks().forEach((track) => track.stop());
    liveStreamRef.current = null;
    setLiveMicActive(false);
    setLiveCameraActive(false);
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  };

  const floatToPcm16 = (input: Float32Array) => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return new Uint8Array(buffer);
  };

  const bytesToBase64 = (bytes: Uint8Array) => {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      const sub = bytes.subarray(i, i + chunk);
      binary += String.fromCharCode(...sub);
    }
    return btoa(binary);
  };

  const base64ToBytes = (value: string) => {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  const decodePcm16ToFloat32 = (bytes: Uint8Array) => {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const count = Math.floor(bytes.byteLength / 2);
    const output = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      output[i] = view.getInt16(i * 2, true) / 0x8000;
    }
    return output;
  };

  const stopLiveAudioPipeline = () => {
    liveAudioNodeRef.current?.disconnect();
    liveAudioSourceRef.current?.disconnect();
    liveAudioNodeRef.current = null;
    liveAudioSourceRef.current = null;

    if (liveAudioContextRef.current) {
      liveAudioContextRef.current.close().catch(() => {});
      liveAudioContextRef.current = null;
    }

    if (liveOutputContextRef.current) {
      liveOutputContextRef.current.close().catch(() => {});
      liveOutputContextRef.current = null;
    }
    liveOutputNextTimeRef.current = 0;
    liveOutputPendingRef.current = 0;
  };

  const queueAssistantAudioChunk = (audioBase64: string, mimeType?: string) => {
    if (!audioBase64) return;
    if (!mimeType?.includes('audio/pcm')) return;

    if (!liveOutputContextRef.current) {
      liveOutputContextRef.current = new AudioContext();
    }
    const audioContext = liveOutputContextRef.current;
    if (!audioContext) return;

    const pcmBytes = base64ToBytes(audioBase64);
    const pcmFloats = decodePcm16ToFloat32(pcmBytes);
    if (pcmFloats.length === 0) return;

    const buffer = audioContext.createBuffer(1, pcmFloats.length, 24000);
    buffer.copyToChannel(pcmFloats, 0);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const currentTime = audioContext.currentTime;
    const startAt = Math.max(liveOutputNextTimeRef.current, currentTime + 0.02);
    liveOutputNextTimeRef.current = startAt + buffer.duration;
    liveOutputPendingRef.current += 1;

    source.onended = () => {
      liveOutputPendingRef.current = Math.max(0, liveOutputPendingRef.current - 1);
      if (
        liveOutputPendingRef.current === 0 &&
        liveModeStatusRef.current !== 'idle' &&
        liveModeStatusRef.current !== 'disconnected' &&
        liveModeStatusRef.current !== 'error' &&
        !liveIsClosingRef.current
      ) {
        handleAssistantSpeakingStop();
      }
    };

    source.start(startAt);
  };

  const startLiveMicStreaming = (stream: MediaStream, socket: WebSocket) => {
    const audioTrackAvailable = stream.getAudioTracks().length > 0;
    if (!audioTrackAvailable) {
      handleLiveConnectionError('الميكروفون غير متاح. فعّل الميكروفون ثم أعد المحاولة.');
      return;
    }

    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      handleLiveConnectionError('المتصفح الحالي لا يدعم بث الصوت المباشر.');
      return;
    }

    const inputContext = new AudioCtx({ sampleRate: 16000 });
    const source = inputContext.createMediaStreamSource(stream);
    const processor = inputContext.createScriptProcessor(2048, 1, 1);

    source.connect(processor);
    processor.connect(inputContext.destination);

    processor.onaudioprocess = (audioEvent) => {
      if (socket.readyState !== WebSocket.OPEN) return;
      const pcm16 = floatToPcm16(audioEvent.inputBuffer.getChannelData(0));
      socket.send(JSON.stringify({
        event: 'audio_input_chunk',
        mime_type: 'audio/pcm;rate=16000',
        audio_base64: bytesToBase64(pcm16),
      }));
    };

    liveAudioContextRef.current = inputContext;
    liveAudioSourceRef.current = source;
    liveAudioNodeRef.current = processor;
  };

  const handleLiveConnectionError = (message: string) => {
    setLiveModeError(message);
    setLiveModeStatus('error');
    liveConnectionRef.current?.socket.close();
    liveConnectionRef.current = null;
  };

  const handleAssistantSpeakingStart = () => {
    setLiveModeStatus('assistant_speaking');
  };

  const handleAssistantSpeakingStop = () => {
    setLiveModeStatus('listening');
  };

  const requestLivePermissions = async () => {
    setLiveModeStatus('requesting_permissions');
    setLiveModeError('');

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }
      stopLiveTracks();
      liveStreamRef.current = stream;
      setLiveMicActive(stream.getAudioTracks().some((track) => track.enabled));
      setLiveCameraActive(stream.getVideoTracks().some((track) => track.enabled));
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
      }
      setLiveModeStatus('ready');
    } catch (error) {
      console.error('Live permissions error:', error);
      stopLiveTracks();
      const errName = (error as DOMException)?.name;
      const permissionMessage = errName === 'NotAllowedError'
        ? 'تم رفض إذن الكاميرا أو الميكروفون. فعّل الأذونات من إعدادات المتصفح.'
        : errName === 'NotFoundError'
          ? 'لم يتم العثور على كاميرا أو ميكروفون متاح على هذا الجهاز.'
          : 'تعذر تشغيل الكاميرا والميكروفون الآن. حاول مرة أخرى.';
      handleLiveConnectionError(permissionMessage);
    }
  };

  const startLiveSession = async () => {
    if (liveModeStatus === 'connecting' || liveModeStatus === 'connected') return;

    if (!liveStreamRef.current) {
      await requestLivePermissions();
    }

    if (!liveStreamRef.current) return;

    setLiveModeStatus('connecting');
    setLiveModeError('');

    try {
      const response = await fetch('http://localhost:8000/api/live/session', { method: 'POST' });
      if (!response.ok) throw new Error('Failed live bootstrap');

      const session: LiveSessionApiResponse = await response.json();
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://localhost:8000${session.websocket_path}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setLiveModeStatus('connected');
        liveIsClosingRef.current = false;
        startLiveMicStreaming(liveStreamRef.current as MediaStream, ws);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as LiveWsEventPayload;
          if (payload.event === 'assistant_speaking_start') {
            handleAssistantSpeakingStart();
          } else if (payload.event === 'assistant_speaking_stop') {
            handleAssistantSpeakingStop();
          } else if (payload.event === 'audio_output_chunk' && payload.audio_base64) {
            queueAssistantAudioChunk(payload.audio_base64, payload.mime_type);
          } else if (payload.event === 'session_ready' || payload.event === 'pong') {
            setLiveModeStatus('listening');
          } else if (payload.event === 'live_error') {
            handleLiveConnectionError(payload.message || 'حدث خطأ في الجلسة المباشرة.');
          } else if (payload.event === 'session_closed') {
            setLiveModeStatus('disconnected');
          }
        } catch {
          // ignore malformed events
        }
      };

      ws.onerror = () => {
        handleLiveConnectionError('انقطع اتصال الوضع المباشر. تقدر تعيد الاتصال بدون خسارة الدردشة.');
      };

      ws.onclose = () => {
        stopLiveAudioPipeline();
        if (liveModeStatusRef.current !== 'idle' && liveModeStatusRef.current !== 'error') {
          setLiveModeStatus('disconnected');
          setLiveModeError('تم فصل الجلسة المباشرة. اضغط إعادة الاتصال للمتابعة.');
        }
      };

      liveConnectionRef.current = { sessionId: session.session_id, socket: ws };
    } catch (error) {
      console.error('Live session start error:', error);
      handleLiveConnectionError('تعذر بدء الجلسة المباشرة حالياً. يمكنك المتابعة عبر الدردشة أو إعادة المحاولة.');
    }
  };

  const stopLiveSession = () => {
    liveIsClosingRef.current = true;
    if (liveConnectionRef.current?.socket.readyState === WebSocket.OPEN) {
      liveConnectionRef.current.socket.send(JSON.stringify({ event: 'disconnect' }));
    }
    liveConnectionRef.current?.socket.close();
    liveConnectionRef.current = null;
    stopLiveAudioPipeline();
    stopLiveTracks();
    setLiveModeError('');
    setLiveModeStatus('idle');
  };

  const reconnectLiveSession = async () => {
    liveConnectionRef.current?.socket.close();
    liveConnectionRef.current = null;
    if (!liveStreamRef.current) {
      await requestLivePermissions();
    }
    await startLiveSession();
  };

  const runAnalyzer = async (blob: Blob, sourceName: string) => {
    const isAudio = blob.type.startsWith('audio/');
    const endpoint = isAudio ? '/api/analyze-audio' : '/api/analyze-video';

    setAnalyzerStatus('processing');
    setAnalyzerError('');
    setAnalyzerSourceName(sourceName);

    const form = new FormData();
    form.append('file', blob, sourceName);

    try {
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) throw new Error('Analyzer request failed');

      const data: AnalyzerResponse = await response.json();
      setAnalyzerResult(data);
      setAnalyzerStatus('done');
    } catch (error) {
      console.error('Analyzer error:', error);
      setAnalyzerStatus('error');
      setAnalyzerError('تعذر إكمال التحليل الآن. تأكد من الملف ثم أعد المحاولة.');
    }
  };

  const handleAnalyzerFileUpload = async (file: File | null) => {
    if (!file) return;

    const audioMode = analyzerInputMode === 'upload_audio';
    const videoMode = analyzerInputMode === 'upload_video';

    if (audioMode && !file.type.startsWith('audio/')) {
      setAnalyzerStatus('error');
      setAnalyzerError('الرجاء اختيار ملف صوتي صحيح.');
      return;
    }
    if (videoMode && !file.type.startsWith('video/')) {
      setAnalyzerStatus('error');
      setAnalyzerError('الرجاء اختيار ملف فيديو صحيح.');
      return;
    }

    await runAnalyzer(file, file.name || (audioMode ? 'uploaded-audio.webm' : 'uploaded-video.webm'));
  };

  const startAnalyzerRecording = async () => {
    if (analyzerStatus === 'recording') return;

    const wantsAudio = analyzerInputMode === 'record_audio';
    const wantsVideo = analyzerInputMode === 'record_video';

    if (!wantsAudio && !wantsVideo) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: wantsVideo,
      });
      analyzerStreamRef.current = stream;

      const preferredMime = wantsVideo
        ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm')
        : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm');

      const recorder = new MediaRecorder(stream, { mimeType: preferredMime });
      analyzerRecorderRef.current = recorder;
      analyzerChunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) analyzerChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(analyzerChunksRef.current, { type: recorder.mimeType || preferredMime });
        analyzerStreamRef.current?.getTracks().forEach((track) => track.stop());
        analyzerStreamRef.current = null;
        analyzerRecorderRef.current = null;
        analyzerChunksRef.current = [];

        if (blob.size === 0) {
          setAnalyzerStatus('error');
          setAnalyzerError('لم يتم التقاط محتوى كافٍ للتحليل. حاول تسجيل أوضح.');
          return;
        }

        const filename = wantsAudio ? 'recorded-audio.webm' : 'recorded-video.webm';
        await runAnalyzer(blob, filename);
      };

      recorder.start();
      setAnalyzerStatus('recording');
      setAnalyzerError('');
    } catch (error) {
      console.error('Analyzer recording permission error:', error);
      setAnalyzerStatus('error');
      setAnalyzerError('تعذر بدء التسجيل. تحقق من إذن الكاميرا/الميكروفون ثم أعد المحاولة.');
    }
  };

  const stopAnalyzerRecordAndAnalyze = () => {
    if (!analyzerRecorderRef.current || analyzerRecorderRef.current.state === 'inactive') return;
    analyzerRecorderRef.current.stop();
    setAnalyzerStatus('processing');
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
    idle: 'اضغط بدء مباشر لتفعيل الجلسة الحية.',
    requesting_permissions: 'جاري طلب إذن الأجهزة...',
    ready: 'تم تجهيز الأجهزة. يمكنك بدء الاتصال المباشر.',
    connecting: 'جاري إنشاء اتصال مباشر آمن...',
    connected: 'تم الاتصال المباشر.',
    listening: 'جاري الاستماع.',
    assistant_speaking: 'حلمان يتحدث الآن.',
    disconnected: 'انقطع الاتصال المباشر.',
    error: liveModeError || 'حدث خطأ في الجلسة المباشرة.',
  };

  const liveStateToneClass = useMemo(() => {
    if (liveModeStatus === 'error' || liveModeStatus === 'disconnected') return 'bg-rose-50 border-rose-100 text-rose-800';
    if (liveModeStatus === 'assistant_speaking') return 'bg-orange-50 border-orange-100 text-orange-800';
    if (liveModeStatus === 'listening' || liveModeStatus === 'connected') return 'bg-sky-50 border-sky-100 text-sky-800';
    return 'bg-slate-50 border-slate-100 text-slate-700';
  }, [liveModeStatus]);

  return (
    // Mobile First: Use 100dvh and safe area padding (pb-24) for the bottom nav
    <div className="mx-auto flex h-[100dvh] w-full max-w-7xl flex-col gap-3 p-3 pb-24 md:gap-5 md:p-6 md:pb-6" dir="rtl">
      
      {/* Mobile-Friendly Header with Embedded Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 md:px-2">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
          <div className="rounded-xl border border-orange-200 bg-orange-100 p-2 shadow-sm">
            <Sparkles className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-xl font-black text-transparent md:text-3xl">
              مساحة المساعدة
            </h1>
            <p className="mt-1 hidden text-sm font-medium text-slate-500 md:block">
              تحدث، اسأل، وتعلّم مع حلمان أفندي بطريقة مرتبة وواضحة
            </p>
          </div>
        </div>

        {/* Mode Switcher - Extracted to the top so it's always accessible on mobile */}
        <div className="flex w-fit items-center gap-1 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur sm:gap-2">
          {([
            { key: 'chat', label: 'دردشة', icon: Sparkles },
            { key: 'live', label: 'مباشر', icon: Radio },
            { key: 'analyzer', label: 'تحليل', icon: Brain },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const active = workspaceMode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setWorkspaceMode(tab.key)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-all ${
                  active
                    ? 'border border-orange-100 bg-white text-orange-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Column Grid */}
      <div className="flex min-h-0 flex-1 grid-cols-1 gap-4 xl:grid xl:grid-cols-[1.2fr_0.8fr] md:gap-5">
        
        {/* Left Column: Chat Container */}
        {/* Mobile Logic: Only show when 'chat' is active. Desktop Logic: Always show (xl:flex) */}
        <div
          className={`flex-col overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-lg md:rounded-[28px] ${
            workspaceMode !== 'chat' ? 'hidden xl:flex' : 'flex'
          } h-full w-full`}
        >
          <div className="z-10 flex items-center gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-pink-50 p-4 shadow-sm md:p-5">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-orange-200 shadow-md">
              <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-orange-500">
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
              <h2 className="text-lg font-black text-slate-800">حلمان أفندي</h2>
              <p className="text-sm font-medium text-slate-600 line-clamp-1">
                مساعد ذكي يشرح، يرتّب الأفكار، ويدعمك خطوة بخطوة
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                </span>
                متصل الآن
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 md:p-5">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="relative mt-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-orange-200 shadow-sm">
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
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] rounded-3xl shadow-sm ${
                      message.sender === 'user'
                        ? 'rounded-tl-md bg-sky-500 px-4 py-3 text-white'
                        : 'rounded-tr-md border border-slate-100 bg-white px-4 py-3.5 text-slate-700'
                    }`}
                  >
                    <MessageContent
                      message={message}
                      onCopyCode={copyWithFeedback}
                      copiedCodeMap={copiedStateMap}
                    />
                    {message.sender === 'bot' && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyWithFeedback(
                              `${message.id}-all`,
                              buildPlainTextFromMessage(message)
                            )
                          }
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                        >
                          {copiedStateMap[`${message.id}-all`]
                            ? 'تم النسخ'
                            : 'نسخ الكل'}
                        </button>
                        <button
                          type="button"
                          disabled={isThinking}
                          onClick={() => handleRetry(message.id)}
                          className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="border-t border-slate-100 bg-white p-3 md:p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleAudioRecordToggle}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-md transition-all ${
                  voiceInputStatus === 'recording'
                    ? 'animate-pulse bg-rose-500 text-white shadow-rose-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
                disabled={isThinking || voiceInputStatus === 'transcribing' || voiceInputStatus === 'sending'}
              >
                {voiceInputStatus === 'recording' ? (
                  <StopCircle className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              <input
                type="text"
                value={voiceStatusLabel || inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اكتب رسالة، سؤال، أو حتى كود..."
                disabled={isThinking || voiceInputStatus !== 'idle'}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-50"
              />

              {voiceInputStatus === 'recording' && (
                <button
                  type="button"
                  onClick={() => stopAudioRecording(true)}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  إلغاء
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={isThinking || voiceInputStatus !== 'idle' || !inputValue.trim()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-200 transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                <Send className="-ml-1 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Tools Container */}
        {/* Mobile Logic: Only show when 'live' or 'analyzer' is active. Desktop Logic: Always show */}
        <div
          className={`flex-col h-full overflow-y-auto rounded-[24px] border border-slate-100 bg-white p-4 shadow-lg md:rounded-[28px] md:p-6 ${
            workspaceMode === 'chat' ? 'hidden xl:flex' : 'flex'
          } w-full`}
        >
          <div className="mb-5 hidden xl:block">
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Video className="h-5 w-5 text-sky-500" />
              {workspaceMode === 'chat'
                ? 'لوحة المساعدة'
                : workspaceMode === 'live'
                  ? 'جلسة مباشرة'
                  : 'ورشة التحليل'}
            </h2>
            <p className="text-sm font-medium leading-6 text-slate-500">
              {workspaceMode === 'chat'
                ? 'الدردشة والرسائل الصوتية تعمل كما هي. اختر مباشر أو تحليل من الأعلى عند الحاجة.'
                : workspaceMode === 'live'
                  ? 'وضع مباشر منفصل عن الدردشة: كاميرا، ميكروفون، وحالة اتصال واضحة مع fallback آمن.'
                  : 'حلّل صوتك أو فيديوك ثم خذ ملاحظات واضحة: نقاط قوة، تحسينات عملية، وخطوات تالية.'}
            </p>
          </div>

          {workspaceMode === 'chat' && (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <div>
                <Sparkles className="mx-auto mb-2 h-8 w-8 text-orange-500" />
                <p className="text-sm font-bold text-slate-700">أنت الآن في وضع الدردشة.</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">لو حابب جلسة كاميرا مباشرة أو تحليل فيديو/صوت، اختر الوضع المناسب من الأعلى.</p>
              </div>
            </div>
          )}

          {workspaceMode === 'live' && (
            <div className="flex flex-1 flex-col gap-4">
              <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden rounded-3xl border-4 border-slate-800 bg-slate-900">
                {liveStreamRef.current ? (
                  <video ref={liveVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <div className="px-6 text-center text-slate-300">
                    <Camera className="mx-auto mb-2 h-12 w-12 opacity-70" />
                    <p className="text-sm font-semibold">لا يوجد بث كاميرا حالياً</p>
                    <p className="mt-1 text-xs opacity-80">ابدأ الجلسة المباشرة لعرض المعاينة هنا.</p>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4">
                <LiveAvatar status={liveModeStatus} />
                <div className={`mt-4 rounded-2xl border p-3 ${liveStateToneClass}`}>
                  <p className="mb-1 text-xs font-bold">حالة الوضع المباشر:</p>
                  <p className="text-sm font-semibold leading-7">{liveStatusLabel[liveModeStatus]}</p>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
                  <div className={`rounded-xl border px-3 py-2 ${liveMicActive ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                    <Mic className="ml-1 inline-block h-4 w-4" />
                    {liveMicActive ? 'الميكروفون يعمل' : 'الميكروفون غير متاح'}
                  </div>
                  <div className={`rounded-xl border px-3 py-2 ${liveCameraActive ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                    <Video className="ml-1 inline-block h-4 w-4" />
                    {liveCameraActive ? 'الكاميرا تعمل' : 'الكاميرا غير متاحة'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  onClick={requestLivePermissions}
                  disabled={liveModeStatus === 'requesting_permissions' || liveModeStatus === 'connecting'}
                  className="rounded-xl bg-slate-100 py-2.5 font-bold text-slate-700 transition-all hover:bg-slate-200 disabled:opacity-50"
                >
                  تفعيل الأجهزة
                </button>
                <button
                  onClick={startLiveSession}
                  disabled={liveModeStatus === 'requesting_permissions' || liveModeStatus === 'connecting' || liveModeStatus === 'connected' || liveModeStatus === 'listening' || liveModeStatus === 'assistant_speaking'}
                  className="rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 py-2.5 font-bold text-white shadow-md shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  بدء مباشر
                </button>
                <button
                  onClick={reconnectLiveSession}
                  disabled={liveModeStatus !== 'disconnected' && liveModeStatus !== 'error'}
                  className="flex items-center justify-center gap-1 rounded-xl bg-orange-50 py-2.5 font-bold text-orange-700 transition-all hover:bg-orange-100 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  إعادة الاتصال
                </button>
                <button
                  onClick={stopLiveSession}
                  disabled={liveModeStatus === 'idle'}
                  className="rounded-xl bg-rose-50 py-2.5 font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-50"
                >
                  إنهاء
                </button>
              </div>
            </div>
          )}

          {workspaceMode === 'analyzer' && (
            <div className="flex flex-1 flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'upload_audio', label: 'رفع صوت' },
                  { key: 'upload_video', label: 'رفع فيديو' },
                  { key: 'record_audio', label: 'تسجيل صوت' },
                  { key: 'record_video', label: 'تسجيل فيديو' },
                ] as const).map((mode) => (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={() => {
                      setAnalyzerInputMode(mode.key);
                      setAnalyzerStatus('idle');
                      setAnalyzerError('');
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
                      analyzerInputMode === mode.key
                        ? 'border-sky-200 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {(analyzerInputMode === 'upload_audio' || analyzerInputMode === 'upload_video') && (
                <label className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-sky-300">
                  <Upload className="mx-auto mb-2 h-7 w-7 text-slate-500" />
                  <p className="text-sm font-bold text-slate-700">
                    {analyzerInputMode === 'upload_audio' ? 'اختر ملف صوتي للتحليل' : 'اختر ملف فيديو للتحليل'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">MP3 / WAV / WEBM أو MP4 / WEBM حسب الوضع</p>
                  <input
                    type="file"
                    className="hidden"
                    accept={analyzerInputMode === 'upload_audio' ? 'audio/*' : 'video/*'}
                    onChange={(e) => handleAnalyzerFileUpload(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}

              {(analyzerInputMode === 'record_audio' || analyzerInputMode === 'record_video') && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    {analyzerInputMode === 'record_audio'
                      ? 'سجّل مقطعاً صوتياً قصيراً ثم حلّله.'
                      : 'سجّل فيديو قصيراً ثم حلّله.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startAnalyzerRecording}
                      disabled={analyzerStatus === 'recording' || analyzerStatus === 'processing'}
                      className="flex-1 rounded-xl bg-slate-900 py-2 font-bold text-white disabled:opacity-50"
                    >
                      بدء التسجيل
                    </button>
                    <button
                      type="button"
                      onClick={stopAnalyzerRecordAndAnalyze}
                      disabled={analyzerStatus !== 'recording'}
                      className="flex-1 rounded-xl bg-rose-50 py-2 font-bold text-rose-700 disabled:opacity-50"
                    >
                      إنهاء وتحليل
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-white p-3 text-sm">
                <p className="mb-1 font-bold text-slate-700">حالة التحليل</p>
                <p className="text-slate-600">
                  {analyzerStatus === 'idle' && 'اختر طريقة الإدخال ثم ابدأ التحليل.'}
                  {analyzerStatus === 'recording' && 'جاري التسجيل... عند الانتهاء اضغط "إنهاء وتحليل".'}
                  {analyzerStatus === 'processing' && 'جاري التحليل الآن... هذا قد يستغرق وقتاً قصيراً.'}
                  {analyzerStatus === 'done' && `اكتمل التحليل بنجاح${analyzerSourceName ? ` (${analyzerSourceName})` : ''}.`}
                  {analyzerStatus === 'error' && analyzerError}
                </p>
              </div>

              {analyzerResult && (
                <div className="max-h-[360px] space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4">
                  <div>
                    <h3 className="text-base font-black text-slate-800">{analyzerResult.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-slate-600">{analyzerResult.summary}</p>
                  </div>

                  {analyzerResult.metrics.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {analyzerResult.metrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                          <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>{metric.label}</span>
                            <span>{metric.score}%</span>
                          </div>
                          <div className="mb-1 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full bg-gradient-to-r from-sky-400 to-orange-400" style={{ width: `${Math.max(0, Math.min(100, metric.score))}%` }} />
                          </div>
                          <p className="text-xs text-slate-500">{metric.note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {analyzerResult.sections.map((section) => (
                    <div key={section.title}>
                      <p className="mb-1 text-sm font-bold text-slate-800">{section.title}</p>
                      <ul className="list-disc space-y-1 pr-5 text-sm text-slate-700">
                        {section.points.map((point, idx) => (
                          <li key={`${section.title}-${idx}`}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {analyzerResult.tips.length > 0 && (
                    <div>
                      <p className="mb-1 text-sm font-bold text-orange-700">نصائح عملية</p>
                      <ul className="list-disc space-y-1 pr-5 text-sm text-slate-700">
                        {analyzerResult.tips.map((tip, i) => (
                          <li key={`tip-${i}`}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analyzerResult.hints.length > 0 && (
                    <div>
                      <p className="mb-1 text-sm font-bold text-sky-700">خطوات تالية</p>
                      <ul className="list-disc space-y-1 pr-5 text-sm text-slate-700">
                        {analyzerResult.hints.map((hint, i) => (
                          <li key={`hint-${i}`}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analyzerResult.availability_notes.length > 0 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
                      <p className="mb-1 font-bold">ملاحظة توفر القدرات</p>
                      <ul className="list-disc space-y-1 pr-5">
                        {analyzerResult.availability_notes.map((note, i) => (
                          <li key={`availability-${i}`}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}