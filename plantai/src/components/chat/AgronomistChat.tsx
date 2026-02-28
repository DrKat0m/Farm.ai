'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { fetchChatResponse } from '@/lib/apiClient';
import type { ChatMessage } from '@/lib/store';

const SUGGESTIONS = [
    'Why did you recommend these crops?',
    'How can I improve my soil health?',
    'What grants am I eligible for?',
    'Explain my NDVI reading',
];

function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 px-4 py-3">
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
            ))}
        </div>
    );
}

export default function AgronomistChat() {
    const { chatMessages, chatOpen, chatLoading, addChatMessage, setChatOpen, setChatLoading, analysis } = useAppStore();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, chatLoading]);

    useEffect(() => {
        if (chatOpen) inputRef.current?.focus();
    }, [chatOpen]);

    const sendMessage = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || chatLoading) return;
        setInput('');

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: msg,
            timestamp: Date.now(),
        };
        addChatMessage(userMsg);
        setChatLoading(true);

        try {
            const reply = await fetchChatResponse(
                msg,
                [...chatMessages, userMsg],
                analysis as unknown as Record<string, unknown>
            );
            addChatMessage({
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: reply,
                timestamp: Date.now(),
            });
        } catch {
            addChatMessage({
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: Date.now(),
            });
        } finally {
            setChatLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            {!chatOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => setChatOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                    style={{
                        background: 'var(--color-primary)',
                        color: 'var(--color-bg)',
                        boxShadow: '0 0 24px rgba(74, 222, 128, 0.35)',
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </motion.button>
            )}

            {/* Chat Drawer */}
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        initial={{ x: 420, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 420, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
                        style={{
                            width: 400,
                            background: 'rgba(10, 13, 10, 0.85)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{
                                    background: 'var(--color-primary)',
                                    boxShadow: '0 0 8px rgba(74, 222, 128, 0.5)',
                                }} />
                                <div>
                                    <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>AI Agronomist</div>
                                    <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Powered by Gemini</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setChatOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {chatMessages.length === 0 && !chatLoading && (
                                <div className="text-center py-8">
                                    <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                        Ask me anything about your property
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                                        {SUGGESTIONS.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => sendMessage(s)}
                                                className="px-3 py-1.5 rounded-full text-[11px] transition-all hover:scale-[1.02]"
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    color: 'var(--color-text-secondary)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                }}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <AnimatePresence mode="popLayout">
                                {chatMessages.map(msg => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className="max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                                            style={{
                                                background: msg.role === 'user'
                                                    ? 'rgba(255, 255, 255, 0.05)'
                                                    : 'rgba(74, 222, 128, 0.1)',
                                                color: 'var(--color-text-primary)',
                                                border: msg.role === 'assistant'
                                                    ? '1px solid rgba(74, 222, 128, 0.15)'
                                                    : '1px solid rgba(255, 255, 255, 0.08)',
                                            }}
                                        >
                                            {msg.content}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {chatLoading && <TypingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <form
                                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                                className="flex gap-2"
                            >
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask about your soil, crops, climate..."
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--color-text-primary)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || chatLoading}
                                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                                    style={{
                                        background: 'var(--color-primary)',
                                        color: 'var(--color-bg)',
                                    }}
                                >
                                    ↑
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
