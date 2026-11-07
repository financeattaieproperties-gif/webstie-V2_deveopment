import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Check,
  CheckCheck,
} from 'lucide-react';
import {
  fetchCustomerThread,
  getStoredCustomerSession,
  saveCustomerSession,
  sendCustomerChatMessage,
  markCustomerMessagesRead,
  sendCustomerTypingSignal,
  type ChatConversation,
} from '../../lib/chatService';

export const CustomerChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Direct Customer-to-Admin Chat state
  const [session, setSession] = useState(() => getStoredCustomerSession());
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time typing indicator state (both customer & admin)
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [typingAdminName, setTypingAdminName] = useState('Admin');
  const customerTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCustomerTypingSentRef = useRef<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async () => {
    if (!session.sessionId) return;
    const conv = await fetchCustomerThread(session.sessionId);
    if (conv) {
      if (conv.is_admin_typing) {
        setIsAdminTyping(true);
        if (conv.typing_admin_name) {
          setTypingAdminName(conv.typing_admin_name);
        }
      } else if (conv.typing_admin_at) {
        const elapsed = Date.now() - new Date(conv.typing_admin_at).getTime();
        setIsAdminTyping(elapsed >= 0 && elapsed <= 6000);
        if (conv.typing_admin_name) {
          setTypingAdminName(conv.typing_admin_name);
        }
      } else {
        setIsAdminTyping(false);
      }

      setConversation((prev) => {
        if (!isOpen && prev && conv.messages.length > prev.messages.length) {
          const newAdminMsgs = conv.messages
            .slice(prev.messages.length)
            .filter((m) => m.sender === 'admin').length;
          if (newAdminMsgs > 0) {
            setUnreadCount((c) => c + newAdminMsgs);
          }
        }
        return conv;
      });
    }
  }, [session.sessionId, isOpen]);

  // Real-time polling + BroadcastChannel + Storage listener for typing & read receipts
  useEffect(() => {
    void loadThread();
    const interval = setInterval(() => {
      void loadThread();
    }, 2500);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'attaie_chat_conversations_v1') {
        void loadThread();
      }
    };
    window.addEventListener('storage', onStorage);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('attaie_live_chat_channel');
        bc.onmessage = (event: MessageEvent) => {
          const data = event.data as {
            type?: string;
            conversationId?: string;
            sender?: string;
            senderName?: string;
            isTyping?: boolean;
            reader?: string;
            readAt?: string;
          } | null;
          if (!data) return;

          if (data.conversationId && session.sessionId && data.conversationId !== session.sessionId) {
            return;
          }

          if (data.type === 'TYPING_STATUS' && data.sender === 'admin') {
            setIsAdminTyping(Boolean(data.isTyping));
            if (data.senderName) {
              setTypingAdminName(data.senderName);
            }
            if (adminTypingTimeoutRef.current) {
              clearTimeout(adminTypingTimeoutRef.current);
            }
            if (data.isTyping) {
              adminTypingTimeoutRef.current = setTimeout(() => {
                setIsAdminTyping(false);
              }, 6000);
            }
            return;
          }

          if (data.type === 'MESSAGES_READ' && data.reader === 'admin') {
            const readTime = data.readAt || new Date().toISOString();
            setConversation((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                unread_admin: 0,
                messages: prev.messages.map((m) =>
                  m.sender === 'customer'
                    ? { ...m, read_status: 'read' as const, read_at: m.read_at || readTime }
                    : m
                ),
              };
            });
            return;
          }

          if (data.type === 'NEW_ADMIN_REPLY') {
            setIsAdminTyping(false);
            void loadThread();
          }
        };
      }
    } catch {
      // ignore if BroadcastChannel is unsupported
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      bc?.close();
    };
  }, [loadThread, session.sessionId]);

  // Automatically mark incoming admin messages as 'read' when customer views the chat
  useEffect(() => {
    if (!isOpen || !session.sessionId || !conversation) return;
    const hasUnreadAdminMsg =
      (conversation.unread_customer || 0) > 0 ||
      conversation.messages.some((m) => m.sender === 'admin' && m.read_status !== 'read');

    if (hasUnreadAdminMsg) {
      void markCustomerMessagesRead(session.sessionId).then((updated) => {
        if (updated) {
          setConversation(updated);
        } else {
          const now = new Date().toISOString();
          setConversation((prev) =>
            prev
              ? {
                  ...prev,
                  unread_customer: 0,
                  messages: prev.messages.map((m) =>
                    m.sender === 'admin'
                      ? { ...m, read_status: 'read' as const, read_at: m.read_at || now }
                      : m
                  ),
                }
              : prev
          );
        }
      });
    }
  }, [isOpen, session.sessionId, conversation?.messages.length, conversation?.unread_customer]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [isOpen, conversation?.messages?.length, isAdminTyping]);

  // Keyboard Escape to close panel
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Emit customer typing signal (throttled + auto-stops after 2.5s of inactivity)
  const handleCustomerTypingInput = (nextValue: string) => {
    setMessageText(nextValue);

    const activeText = nextValue.trim();
    if (!activeText) {
      if (customerTypingTimeoutRef.current) {
        clearTimeout(customerTypingTimeoutRef.current);
      }
      if (session.sessionId) {
        void sendCustomerTypingSignal(session.sessionId, false, 'Customer');
      }
      return;
    }

    const now = Date.now();
    if (session.sessionId && now - lastCustomerTypingSentRef.current > 1800) {
      lastCustomerTypingSentRef.current = now;
      void sendCustomerTypingSignal(session.sessionId, true, 'Customer');
    }

    if (customerTypingTimeoutRef.current) {
      clearTimeout(customerTypingTimeoutRef.current);
    }
    customerTypingTimeoutRef.current = setTimeout(() => {
      if (session.sessionId) {
        void sendCustomerTypingSignal(session.sessionId, false, 'Customer');
      }
    }, 2500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedMsg = messageText.trim();
    if (!trimmedMsg) return;

    setSending(true);
    if (customerTypingTimeoutRef.current) {
      clearTimeout(customerTypingTimeoutRef.current);
    }

    try {
      const pageContext = `${window.location.pathname} — ${document.title.replace(/\s*\|\s*Attaie Properties.*$/i, '')}`;
      const updated = await sendCustomerChatMessage({
        sessionId: session.sessionId,
        pageContext,
        message: trimmedMsg,
      });
      const updatedSession = {
        sessionId: updated.id,
        name: updated.customer_name || '',
        phone: updated.customer_phone || '',
        email: updated.customer_email || '',
      };
      setSession(updatedSession);
      saveCustomerSession(updatedSession);
      setConversation(updated);
      setMessageText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const renderReadReceiptBadge = (readStatus?: 'sent' | 'read', readAt?: string | null) => {
    const isRead = readStatus === 'read';
    const timeLabel = readAt
      ? new Date(readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold mt-1 px-1 ${
          isRead ? 'text-brand-gold' : 'text-neutral-400'
        }`}
        title={isRead ? `Read${timeLabel ? ` • ${timeLabel}` : ''}` : 'Sent'}
      >
        {isRead ? (
          <>
            <CheckCheck size={12} className="text-brand-gold shrink-0" />
            <span>Read</span>
          </>
        ) : (
          <>
            <Check size={12} className="text-neutral-400 shrink-0" />
            <span>Sent</span>
          </>
        )}
      </span>
    );
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 w-[calc(100vw-2rem)] sm:w-[375px] max-h-[78vh] bg-white rounded-2xl shadow-2xl border border-brand-navy/15 overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="false"
            aria-label="Direct Message"
          >
            {/* Minimal Header */}
            <div className="bg-brand-navy text-white px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-brand-gold" />
                <span className="text-sm font-bold text-white">
                  {isAdminTyping ? `${typingAdminName} is typing...` : 'Messages'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-brand-cream/60 min-h-[240px] max-h-[360px]">
              {conversation?.messages.map((msg) => {
                const isCustomer = msg.sender === 'customer';
                if (msg.sender === 'system') {
                  return null;
                }
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] font-semibold text-neutral-500 mb-1 px-1">
                      {isCustomer ? 'You' : msg.sender_name || 'Admin'}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                        isCustomer
                          ? 'bg-brand-gold text-white rounded-br-xs shadow-xs'
                          : 'bg-white text-brand-navy border border-brand-navy/10 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                    {isCustomer ? (
                      renderReadReceiptBadge(msg.read_status, msg.read_at)
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-1 px-1">
                        <CheckCheck size={11} className="text-emerald-600" />
                        <span>Received</span>
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Real-time Admin Typing Indicator Bubble */}
              {isAdminTyping && (
                <div className="flex flex-col items-start" role="status" aria-live="polite">
                  <span className="text-[10px] font-semibold text-neutral-500 mb-1 px-1">
                    {typingAdminName || 'Admin'}
                  </span>
                  <div className="bg-white border border-brand-gold/30 text-brand-navy rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs shadow-xs inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-bounce [animation-delay:300ms]" />
                    </span>
                    <span className="font-medium text-brand-navy">typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Direct Message Input Only (No Name or Phone Inputs) */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 bg-white border-t border-neutral-200 space-y-2 shrink-0"
            >
              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                  {error}
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={messageText}
                  onChange={(e) => handleCustomerTypingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage(e);
                    }
                  }}
                  placeholder=""
                  aria-label="Message"
                  className="flex-1 resize-none rounded-xl border border-neutral-300 focus:border-brand-gold focus:outline-none px-3 py-2 text-xs text-neutral-900"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="h-10 w-10 rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-xs inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon-Only Floating Message Button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="relative flex items-center justify-center w-14 h-14 bg-brand-navy hover:bg-brand-navy-light text-white rounded-full shadow-[0_6px_20px_rgba(2,14,58,0.38)] border border-white/15 hover:scale-105 transition-all duration-200 cursor-pointer"
        aria-label="Messages"
      >
        <MessageSquare size={22} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-extrabold flex items-center justify-center shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
