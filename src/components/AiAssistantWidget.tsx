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
        'Hola, soy **ARK Contable AI**. Tengo acceso directo a tus bases de datos de D1 y a los motores de cálculo fiscal y laboral del Worker. ¿En qué te puedo ayudar hoy?',
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
        paymentUrl: data.payment_url || 'https://pago.clip.mx/v3/bc5ff8d9-dacb-4f36-b006-78d0348bbb65',
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

      const res = await apiClient.ai.chat(
        {
          messages: apiMessages,
          tenant_id: tenantId || '',
        },
      );

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
    <aside aria-label="Asistente Virtual ARK AI" className="fixed bottom-6 right-6 z-50 font-inter">
      {/* Botón Flotante (Cuando está cerrado) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-[#002B7F] hover:bg-[#001A4D] text-white rounded-full border-2 border-[#D4AF37] shadow-[0_10px_35px_rgba(0,43,127,0.5)] hover:shadow-[0_12px_40px_rgba(212,175,55,0.45)] transition-all duration-300 hover:scale-[1.03]"
          title="Abrir Asistente ARK AI"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#001A4D] border border-[#D4AF37]/50 text-gold group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 animate-pulse text-[#D4AF37]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#002B7F] animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#002B7F]" />
          </div>
          <div className="text-left">
            <div className="text-[13px] font-bold tracking-wide text-white flex items-center gap-1.5 font-playfair">
              ARK AI <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-[#D4AF37]/25 text-[#F5D97A] font-bold rounded border border-[#D4AF37]/40">Edge</span>
            </div>
            <div className="text-[11px] text-white/85 font-medium">Llama 3.3 • Conectado a D1</div>
          </div>
        </button>
      )}

      {/* Ventana de Chat Expandida */}
      {isOpen && (
        <div
          className={`flex flex-col bg-surface rounded-2xl border-2 border-[#002B7F]/40 shadow-[0_20px_50px_rgba(0,26,77,0.35)] transition-all duration-300 overflow-hidden ring-1 ring-[#D4AF37]/25 ${
            isMinimized ? 'h-14 w-80' : 'w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#002B7F] text-white border-b-2 border-[#D4AF37]/40 select-none shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center border border-gold/40 text-gold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-playfair font-black text-[15px] tracking-wide text-white">
                    ARK AI
                  </span>
                  {quota.isPro ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gold/20 text-gold border border-gold/40">
                      <Crown className="w-3 h-3 text-gold" />
                      PRO
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border',
                        quota.used >= quota.limit
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      )}
                      title={`Consultas usadas este mes: ${quota.used} de ${quota.limit}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                      {quota.used}/{quota.limit} gratis
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/70 truncate max-w-[200px]">
                  {tenantName ? `🏢 ${tenantName}` : 'Modo Despacho General'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/70">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={isMinimized ? 'Maximizar' : 'Minimizar'}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo (solo si no está minimizado) */}
          {!isMinimized && (
            <>
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-2/40">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-navy/10 border border-navy/20 flex items-center justify-center text-navy shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-navy text-white rounded-br-none shadow-sm'
                          : 'bg-surface text-ink border border-line rounded-bl-none shadow-sm'
                      }`}
                    >
                      {/* Badge si ejecutó herramientas del Worker */}
                      {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                        <div className="mb-2.5 pb-2 border-b border-line/60 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] font-mono uppercase text-muted font-bold flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-gold" /> Herramientas Worker:
                          </span>
                          {msg.toolsExecuted.map((tool) => (
                            <span
                              key={tool}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-gold/15 text-gold-dark font-bold rounded-md border border-gold/30"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
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
                              'inline-block w-1.5 h-3.5 animate-pulse ml-1 align-middle rounded-xs',
                              msg.role === 'user' ? 'bg-white' : 'bg-navy'
                            )}
                          />
                        )}
                      </div>

                      {/* Tarjeta interactiva de Paywall con enlace de pago Clip */}
                      {msg.isPaywall && (
                        <div className="mt-3.5 rounded-xl border border-gold/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3.5 shadow-sm space-y-2.5">
                          <div className="flex items-center gap-1.5 text-navy font-bold text-[12px] font-orbitron">
                            <Crown className="w-4 h-4 text-gold-dark" />
                            <span>Desbloquear ARK TOOLS Pro</span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">
                            Obtén consultas ilimitadas con Llama 3.3, integración total con D1,
                            timbrado masivo y soporte directo para todo tu despacho.
                          </p>
                          <a
                            href={msg.paymentUrl || quota.paymentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-navy text-white text-[11px] font-bold font-orbitron hover:bg-navy-dark transition shadow-md group"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                            <span>ACTIVAR PRO — $399 MXN / MES</span>
                            <ExternalLink className="w-3.5 h-3.5 text-white/80" />
                          </a>
                        </div>
                      )}

                      <div
                        className={`text-[10px] mt-1.5 text-right font-mono ${
                          msg.role === 'user' ? 'text-white/60' : 'text-muted'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-navy shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex gap-3 justify-start items-center text-muted text-xs">
                    <div className="w-7 h-7 rounded-full bg-navy/10 border border-navy/20 flex items-center justify-center text-navy shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    </div>
                    <div className="bg-surface border border-line rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-2 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" />
                      <span className="text-[12px] text-muted ml-1">Consultando herramientas y recursos...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chips / Prompts Rápidos (solo si hay pocos mensajes) */}
              {messages.length <= 3 && !isLoading && !quota.quotaExceeded && (
                <div className="px-3 py-2 bg-surface border-t border-line/60">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-gold" /> Sugerencias rápidas:
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {QUICK_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt)}
                        className="text-[11px] text-left shrink-0 max-w-[260px] truncate px-2.5 py-1.5 rounded-lg bg-surface-2 border border-line hover:border-gold hover:bg-gold/5 text-ink transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 bg-surface border-t border-line">
                {quota.quotaExceeded ? (
                  <div className="rounded-xl border border-gold/40 bg-gradient-to-r from-amber-50 to-cream/40 p-3 text-center space-y-2">
                    <div className="flex items-center justify-center gap-1.5 font-orbitron text-[11px] font-bold text-navy">
                      <Lock className="w-3.5 h-3.5 text-gold-dark" />
                      <span>LÍMITE MENSUAL ALCANZADO ({quota.limit}/{quota.limit})</span>
                    </div>
                    <p className="text-[10px] text-muted">
                      Has consumido tus {quota.limit} consultas de cortesía del mes. Activa Pro para seguir consultando.
                    </p>
                    <a
                      href={quota.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-navy text-white text-[10px] font-bold font-orbitron hover:bg-navy-dark transition shadow-xs"
                    >
                      <Sparkles className="w-3 h-3 text-gold" />
                      <span>SUSCRIBIRSE PRO ($399 MXN)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 bg-surface-2 border border-line rounded-xl p-2 focus-within:border-navy focus-within:ring-1 focus-within:ring-navy transition-all">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe tu consulta o pide un cálculo..."
                      rows={1}
                      className="flex-1 max-h-24 bg-transparent text-[13px] text-ink placeholder:text-muted resize-none focus:outline-none leading-relaxed py-1"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!inputMessage.trim() || isLoading}
                      className="p-2 rounded-lg bg-[#002B7F] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#001A4D] transition-colors shrink-0 shadow-sm"
                      title="Enviar mensaje"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex justify-between items-center mt-1.5 px-1 text-[10px] text-muted font-mono">
                  <span>Enter para enviar • LFT 2026</span>
                  <span>{quota.isPro ? 'ARK Pro Ilimitado' : `${quota.used}/${quota.limit} consultas gratis`}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

function renderInlineFormatted(
  text: string,
  keyPrefix: string | number,
  isUser: boolean = false
) {
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
        className={cn(
          'font-semibold',
          isUser ? 'text-white font-bold' : 'text-ink'
        )}
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
            'font-bold text-[13px] mt-2.5 mb-1 font-orbitron',
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
        <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
          <span
            className={cn(
              'font-bold text-xs leading-5 select-none',
              isUser ? 'text-amber-300' : 'text-gold-dark'
            )}
          >
            •
          </span>
          <span
            className={cn(
              'flex-1 text-[13px] leading-relaxed',
              isUser ? 'text-white' : 'text-ink'
            )}
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
        <div key={lineIdx} className="flex items-start gap-2 my-1 pl-1">
          <span
            className={cn(
              'font-bold text-[11px] font-mono leading-5 select-none',
              isUser ? 'text-amber-300' : 'text-navy'
            )}
          >
            {numMatch[1]}.
          </span>
          <span
            className={cn(
              'flex-1 text-[13px] leading-relaxed',
              isUser ? 'text-white' : 'text-ink'
            )}
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
          'mb-2 leading-relaxed text-[13px] last:mb-0',
          isUser ? 'text-white' : 'text-ink'
        )}
      >
        {renderInlineFormatted(line, lineIdx, isUser)}
      </p>
    );
  });
}

export default AiAssistantWidget;
