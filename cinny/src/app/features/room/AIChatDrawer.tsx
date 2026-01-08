import React, { useState, useRef, FormEventHandler } from 'react';
import {
    Box,
    Text,
    Input,
    Icon,
    Icons,
    IconButton,
    Spinner,
    config,
    Scroll,
    Chip,
    Header,
    Tooltip,
    TooltipProvider,
} from 'folds';
import { Room } from 'matrix-js-sdk';
import classNames from 'classnames';

import * as css from './AIChatDrawer.css';
import { useSetSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import { ContainerColor } from '../../styles/ContainerColor.css';
import { MessageEvent } from '../../../types/matrix/room';

// Types
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// API call to Python backend
const AI_API_BASE = 'http://localhost:3000/api';

async function sendToAI(
    message: string,
    searchContext: string,
    roomId: string
): Promise<{ answer: string }> {
    try {
        const response = await fetch(`${AI_API_BASE}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                room_ids: [roomId],
                search_context: searchContext,
            }),
        });

        if (!response.ok) {
            throw new Error('AI request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('AI Chat error:', error);
        return {
            answer: '抱歉，AI 服务暂时不可用。请稍后重试。',
        };
    }
}

// Header component - matching MembersDrawer style
function AIChatDrawerHeader() {
    const setAIChatDrawer = useSetSetting(settingsAtom, 'isAIChatDrawer');

    return (
        <Header className={css.AIChatDrawerHeader} variant="Background" size="600">
            <Box grow="Yes" alignItems="Center" gap="200">
                <Box grow="Yes" alignItems="Center" gap="200">
                    <Text size="H5" truncate>AI Assistant</Text>
                </Box>
                <Box shrink="No" alignItems="Center">
                    <TooltipProvider
                        position="Bottom"
                        align="End"
                        offset={4}
                        tooltip={
                            <Tooltip>
                                <Text>Close</Text>
                            </Tooltip>
                        }
                    >
                        {(triggerRef) => (
                            <IconButton
                                ref={triggerRef}
                                variant="Background"
                                onClick={() => setAIChatDrawer(false)}
                            >
                                <Icon src={Icons.Cross} />
                            </IconButton>
                        )}
                    </TooltipProvider>
                </Box>
            </Box>
        </Header>
    );
}

// Main component
interface AIChatDrawerProps {
    room: Room;
}

export function AIChatDrawer({ room }: AIChatDrawerProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (evt) => {
        evt.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Get recent messages from room timeline
            const timeline = room.getLiveTimeline();
            const events = timeline.getEvents();
            
            // Get last 50 text messages
            const contextMessages = events
                .filter((evt) => evt.getType() === MessageEvent.RoomMessage)
                .slice(-50)
                .map((evt) => {
                    const sender = evt.getSender() || 'Unknown';
                    const body = evt.getContent()?.body || '';
                    return `[${sender}]: ${body}`;
                })
                .join('\n');

            // Call AI backend
            const aiResponse = await sendToAI(
                userMessage.content,
                contextMessages,
                room.roomId
            );

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: aiResponse.answer,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, AI service is temporarily unavailable. Please try again later.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }, 100);
        }
    };

    return (
        <Box
            className={classNames(css.AIChatDrawer, ContainerColor({ variant: 'Background' }))}
            shrink="No"
            direction="Column"
        >
            <AIChatDrawerHeader />
            <Box className={css.AIChatDrawerContentBase} grow="Yes">
                <Scroll ref={scrollRef} variant="Background" size="300" visibility="Hover" hideTrack>
                    <Box className={css.AIChatDrawerContent} direction="Column" gap="200">
                        {/* Empty state */}
                        {messages.length === 0 && (
                            <Box
                                direction="Column"
                                alignItems="Center"
                                justifyContent="Center"
                                style={{ padding: config.space.S700 }}
                            >
                                <Icon size="400" src={Icons.Message} />
                                <Text size="T400" style={{ marginTop: config.space.S200 }}>
                                    AI-Powered Q&A Based on Room Messages
                                </Text>
                                <Text size="T200" priority="300" style={{ marginTop: config.space.S100 }}>
                                    Ask questions and AI will search room history to answer
                                </Text>
                            </Box>
                        )}

                        {/* Messages */}
                        <Box className={css.MessagesGroup} direction="Column" gap="300">
                            {messages.map((msg, index) => (
                                <Box
                                    key={index}
                                    className={
                                        msg.role === 'user'
                                            ? css.UserMessageBubble
                                            : css.AssistantMessageBubble
                                    }
                                >
                                    <Text size="T300" style={{ whiteSpace: 'pre-wrap' }}>
                                        {msg.content}
                                    </Text>
                                </Box>
                            ))}

                            {isLoading && (
                                <Box alignItems="Center" gap="200" style={{ padding: config.space.S200 }}>
                                    <Spinner size="200" />
                                    <Text size="T300" priority="300">Thinking...</Text>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Scroll>
            </Box>

            {/* Input Area */}
            <Box
                as="form"
                onSubmit={handleSubmit}
                className={css.InputArea}
                direction="Column"
                gap="100"
            >
                <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                    placeholder="Ask your question..."
                    variant="Surface"
                    size="400"
                    radii="400"
                    disabled={isLoading}
                    after={
                        <Chip
                            type="submit"
                            variant="Primary"
                            size="400"
                            radii="Pill"
                            disabled={!inputValue.trim() || isLoading}
                        >
                            <Icon size="100" src={Icons.ArrowRight} />
                        </Chip>
                    }
                />
            </Box>
        </Box>
    );
}
