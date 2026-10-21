/**
 * ARK TOOLS — Workers AI Floating Assistant Widget
 *
 * Widget de chat flotante que permite al contador interactuar con el modelo
 * Cloudflare Workers AI (@cf/meta/llama-3.3-70b-instruct).
 * El modelo tiene acceso a las herramientas del Worker:
 * - Consultar D1 (Guía SAT/IMSS, Ledger SHA-256, Activos Virtuales)
 * - Calcular Finiquitos y Liquidaciones LFT en tiempo real
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  Wrench,
  Loader2,
  Minimize2,
  CheckCircle2,
  HelpCircle,
  Crown,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsExecuted?: string[];
  timestamp: string;
  isTyping?: boolean;
  isPaywall?: boolean;
  paymentUrl?: string;
}

interface QuotaState {
  used: number;
  limit: number;
  isPro: boolean;
  quotaExceeded: boolean;
  paymentUrl: string;
}

const QUICK_PROMPTS = [
  '¿Cuál es el avance actual en la Guía SAT/IMSS?',
  'Calcula el finiquito de un trabajador con ingreso 2024-01-01, baja 2025-12-31 y salario diario de $500',
  '¿Cuáles son las últimas auditorías selladas en el Ledger?',
  'Revisa si tenemos notas sobre Activos Virtuales',
];

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hola, soy **Noah**. Tengo acceso directo a tus bases de datos de D1 y a los motores de cálculo fiscal y laboral del Worker. ¿En qué te puedo ayudar hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const { tenantId, tenantName } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  const [quota, setQuota] = useState<QuotaState>({
    used: 0,
    limit: 10,
    isPro: false,
    quotaExceeded: false,
    paymentUrl: 'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65',
  });

  const clearTypingInterval = () => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTypingInterval();
  }, []);

  const loadQuota = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await apiClient.ai.getQuota(tenantId);
      setQuota({
        used: data.used,
        limit: data.limit,
        isPro: data.is_pro,
        quotaExceeded: !data.allowed,
        paymentUrl:
          data.payment_url || 'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65',
      });
    } catch {
      // ignorar si no hay conexión
    }
  }, [tenantId]);

  useEffect(() => {
    if (isOpen && tenantId) {
      void loadQuota();
    }
  }, [isOpen, tenantId, loadQuota]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const simulateTyping = useCallback((fullText: string, assistantMsgId: string) => {
    clearTypingInterval();

    let i = 0;
    // Step dinámico optimizado: fluido pero rápido (~200ms a 600ms máx)
    const step = Math.max(4, Math.ceil(fullText.length / 40));

    typingRef.current = setInterval(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== assistantMsgId) return msg;

          if (i < fullText.length) {
            const nextI = Math.min(i + step, fullText.length);
            const updatedContent = fullText.slice(0, nextI);
            i = nextI;
            return { ...msg, content: updatedContent, isTyping: i < fullText.length };
          } else {
            clearTypingInterval();
            return { ...msg, content: fullText, isTyping: false };
          }
        })
      );
    }, 15);
  }, []);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    clearTypingInterval();

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Preparar historial para enviar a Workers AI
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiClient.ai.chat({
        messages: apiMessages,
        tenant_id: tenantId || '',
      });

      if (res.quota) {
        setQuota((prev) => ({
          ...prev,
          used: res.quota!.used,
          limit: res.quota!.limit,
          isPro: res.quota!.is_pro,
        }));
      }

      if (res.quota_exceeded) {
        setQuota((prev) => ({
          ...prev,
          quotaExceeded: true,
          paymentUrl: res.payment_url || prev.paymentUrl,
        }));
      }

      const assistantId = `asst-${Date.now()}`;
      const placeholderAssistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        toolsExecuted: res.tools_executed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isTyping: true,
        isPaywall: res.quota_exceeded,
        paymentUrl: res.payment_url || quota.paymentUrl,
      };

      setMessages((prev) => [...prev, placeholderAssistantMsg]);
      setIsLoading(false);

      const fullText = res.result || 'Respuesta recibida sin contenido.';
      simulateTyping(fullText, assistantId);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Ocurrió un error al contactar al modelo:** ${errMsg}. Verifica que el Worker tenga configurado el binding [ai].`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside aria-label="Asistente Virtual Noah" className="fixed bottom-6 right-6 z-50 font-inter">
      {/* Botón Flotante (Cuando está cerrado) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-3 rounded-full border-2 border-[#D4AF37] bg-[#002B7F] px-5 py-3.5 text-white shadow-[0_10px_35px_rgba(0,43,127,0.5)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#001A4D] hover:shadow-[0_12px_40px_rgba(212,175,55,0.45)]"
          title="Abrir Asistente Noah"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-[#001A4D] text-gold transition-transform group-hover:scale-110">
            <Sparkles className="h-5 w-5 animate-pulse text-[#D4AF37]" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400 ring-2 ring-[#002B7F]" />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#002B7F]" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 font-playfair text-[13px] font-bold tracking-wide text-white">
              Noah{' '}
              <span className="py-0.2 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/25 px-1.5 font-mono text-[10px] font-bold uppercase text-[#F5D97A]">
                AI
              </span>
            </div>
            <div className="text-[11px] font-medium text-white/85">Llama 3.3 • Conectado a D1</div>
          </div>
        </button>
      )}

      {/* Ventana de Chat Expandida */}
      {isOpen && (
        <div
          className={`flex flex-col overflow-hidden rounded-2xl border-2 border-[#002B7F]/40 bg-surface shadow-[0_20px_50px_rgba(0,26,77,0.35)] ring-1 ring-[#D4AF37]/25 transition-all duration-300 ${
            isMinimized ? 'h-14 w-80' : 'h-[600px] max-h-[85vh] w-[92vw] sm:w-[440px]'
          }`}
        >
          {/* Header */}
          <div className="flex select-none items-center justify-between border-b-2 border-[#D4AF37]/40 bg-[#002B7F] px-4 py-3 text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/20 text-gold">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-playfair text-[15px] font-black tracking-wide text-white">
                    Noah
                  </span>
                  {quota.isPro ? (
                    <span className="inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gold">
                      <Crown className="h-3 w-3 text-gold" />
                      PRO
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold',
                        quota.used >= quota.limit
                          ? 'border-rose-500/30 bg-rose-500/20 text-rose-300'
                          : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                      )}
                      title={`Consultas usadas este mes: ${quota.used} de ${quota.limit}`}
                    >
                      <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      {quota.used}/{quota.limit} gratis
                    </span>
                  )}
                </div>
                <div className="max-w-[200px] truncate text-[11px] text-white/70">
                  {tenantName ? `🏢 ${tenantName}` : 'Modo Despacho General'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/70">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10 hover:text-white"
                title={isMinimized ? 'Maximizar' : 'Minimizar'}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10 hover:text-white"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo (solo si no está minimizado) */}
          {!isMinimized && (
            <>
              {/* Mensajes */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-surface-2/40 p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-navy/20 bg-navy/10 text-navy">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-br-none bg-navy text-white shadow-sm'
                          : 'rounded-bl-none border border-line bg-surface text-ink shadow-sm'
                      }`}
                    >
                      {/* Badge si ejecutó herramientas del Worker */}
                      {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                        <div className="mb-2.5 flex flex-wrap items-center gap-1.5 border-b border-line/60 pb-2">
                          <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase text-muted">
                            <Wrench className="h-3 w-3 text-gold" /> Herramientas Worker:
                          </span>
                          {msg.toolsExecuted.map((tool) => (
                            <span
                              key={tool}
                              className="inline-flex items-center gap-1 rounded-md border border-gold/30 bg-gold/15 px-2 py-0.5 font-mono text-[10px] font-bold text-gold-dark"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Contenido con formateo de negritas simple */}
                      <div className="whitespace-pre-wrap break-words">
                        {renderFormattedContent(msg.content, msg.role === 'user')}
                        {msg.isTyping && (
                          <span
                            className={cn(
                              'rounded-xs ml-1 inline-block h-3.5 w-1.5 animate-pulse align-middle',
                              msg.role === 'user' ? 'bg-white' : 'bg-navy'
                            )}
                          />
                        )}
                      </div>

                      {/* Tarjeta interactiva de Paywall con enlace de pago Clip */}
                      {msg.isPaywall && (
                        <div className="mt-3.5 space-y-2.5 rounded-xl border border-gold/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3.5 shadow-sm">
                          <div className="flex items-center gap-1.5 font-orbitron text-[12px] font-bold text-navy">
                            <Crown className="h-4 w-4 text-gold-dark" />
                            <span>Desbloquear ARK TOOLS Pro</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-muted">
                            Obtén consultas ilimitadas con Llama 3.3, integración total con D1,
                            timbrado masivo y soporte directo para todo tu despacho.
                          </p>
                          <a
                            href={msg.paymentUrl || quota.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 font-orbitron text-[11px] font-bold text-white shadow-md transition hover:bg-navy-dark"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-gold transition-transform group-hover:scale-110" />
                            <span>ACTIVAR PRO — $399 MXN / MES</span>
                            <ExternalLink className="h-3.5 w-3.5 text-white/80" />
                          </a>
                        </div>
                      )}

                      <div
                        className={`mt-1.5 text-right font-mono text-[10px] ${
                          msg.role === 'user' ? 'text-white/60' : 'text-muted'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/20 text-navy">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-start gap-3 text-xs text-muted">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-navy/20 bg-navy/10 text-navy">
                      <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-none border border-line bg-surface px-4 py-2.5 shadow-sm">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" />
                      <span className="ml-1 text-[12px] text-muted">
                        Consultando herramientas y recursos...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chips / Prompts Rápidos (solo si hay pocos mensajes) */}
              {messages.length <= 3 && !isLoading && !quota.quotaExceeded && (
                <div className="border-t border-line/60 bg-surface px-3 py-2">
                  <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                    <HelpCircle className="h-3 w-3 text-gold" /> Sugerencias rápidas:
                  </div>
                  <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt)}
                        className="max-w-[260px] shrink-0 truncate rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-left text-[11px] text-ink transition-colors hover:border-gold hover:bg-gold/5"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Footer */}
              <div className="border-t border-line bg-surface p-3">
                {quota.quotaExceeded ? (
                  <div className="space-y-2 rounded-xl border border-gold/40 bg-gradient-to-r from-amber-50 to-cream/40 p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 font-orbitron text-[11px] font-bold text-navy">
                      <Lock className="h-3.5 w-3.5 text-gold-dark" />
                      <span>
                        LÍMITE MENSUAL ALCANZADO ({quota.limit}/{quota.limit})
                      </span>
                    </div>
                    <p className="text-[10px] text-muted">
                      Has consumido tus {quota.limit} consultas de cortesía del mes. Activa Pro para
                      seguir consultando.
                    </p>
                    <a
                      href={quota.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shadow-xs inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy px-3 py-2 font-orbitron text-[10px] font-bold text-white transition hover:bg-navy-dark"
                    >
                      <Sparkles className="h-3 w-3 text-gold" />
                      <span>SUSCRIBIRSE PRO ($399 MXN)</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 rounded-xl border border-line bg-surface-2 p-2 transition-all focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe tu consulta o pide un cálculo..."
                      rows={1}
                      className="max-h-24 flex-1 resize-none bg-transparent py-1 text-[13px] leading-relaxed text-ink placeholder:text-muted focus:outline-none"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!inputMessage.trim() || isLoading}
                      className="shrink-0 rounded-lg bg-[#002B7F] p-2 text-white shadow-sm transition-colors hover:bg-[#001A4D] disabled:cursor-not-allowed disabled:opacity-40"
                      title="Enviar mensaje"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="mt-1.5 flex items-center justify-between px-1 font-mono text-[10px] text-muted">
                  <span>Enter para enviar • LFT 2026</span>
                  <span>
                    {quota.isPro
                      ? 'ARK Pro Ilimitado'
                      : `${quota.used}/${quota.limit} consultas gratis`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function renderInlineFormatted(text: string, keyPrefix: string | number, isUser: boolean = false) {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const elements: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    elements.push(
      <strong
        key={`${keyPrefix}-${match.index}`}
        className={cn('font-semibold', isUser ? 'font-bold text-white' : 'text-ink')}
      >
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : text;
}

/**
 * Función de renderizado para soportar negritas, viñetas, listas y separación entre párrafos
 */
function renderFormattedContent(content: string, isUser: boolean = false) {
  const lines = content.split('\n');
  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();

    // Renglón vacío -> espacio visual real entre párrafos
    if (!trimmed) {
      return <div key={lineIdx} className="h-2.5" />;
    }

    // Encabezados markdown (### o ##)
    if (line.startsWith('### ') || line.startsWith('## ')) {
      return (
        <h4
          key={lineIdx}
          className={cn(
            'mb-1 mt-2.5 font-orbitron text-[13px] font-bold',
            isUser ? 'text-white' : 'text-navy'
          )}
        >
          {line.replace(/^###?\s+/, '')}
        </h4>
      );
    }

    // Listas con viñetas (- o *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <div key={lineIdx} className="my-1 flex items-start gap-2 pl-1">
          <span
            className={cn(
              'select-none text-xs font-bold leading-5',
              isUser ? 'text-amber-300' : 'text-gold-dark'
            )}
          >
            •
          </span>
          <span
            className={cn('flex-1 text-[13px] leading-relaxed', isUser ? 'text-white' : 'text-ink')}
          >
            {renderInlineFormatted(line.slice(2), lineIdx, isUser)}
          </span>
        </div>
      );
    }

    // Listas numeradas (1. , 2. )
    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={lineIdx} className="my-1 flex items-start gap-2 pl-1">
          <span
            className={cn(
              'select-none font-mono text-[11px] font-bold leading-5',
              isUser ? 'text-amber-300' : 'text-navy'
            )}
          >
            {numMatch[1]}.
          </span>
          <span
            className={cn('flex-1 text-[13px] leading-relaxed', isUser ? 'text-white' : 'text-ink')}
          >
            {renderInlineFormatted(numMatch[2] || '', lineIdx, isUser)}
          </span>
        </div>
      );
    }

    // Párrafo estándar con espacio inferior
    return (
      <p
        key={lineIdx}
        className={cn(
          'mb-2 text-[13px] leading-relaxed last:mb-0',
          isUser ? 'text-white' : 'text-ink'
        )}
      >
        {renderInlineFormatted(line, lineIdx, isUser)}
      </p>
    );
  });
}

export default AiAssistantWidget;
