
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
/* Removed non-existent FreeResponse and CaseStudy from imports */
import type { StudyItem, MCQ, TrueFalse, Flashcard } from '../types';
import { XIcon, SpinnerIcon } from './icons';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: StudyItem | null;
  sourceText: string;
}

interface Message {
  author: 'user' | 'ai';
  text: string;
}

const getCorrectAnswerText = (item: StudyItem): string => {
    switch (item.type) {
        case 'mcq':
            return (item as MCQ).options[(item as MCQ).correctAnswerIndex];
        case 'true/false':
            return (item as TrueFalse).correctAnswer ? 'Vrai' : 'Faux';
        case 'flashcard':
        case 'free':
        case 'case':
            /* Cast to any to access answer property for flashcard, free and case types */
            return (item as any).answer;
        default:
            return '';
    }
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, currentItem, sourceText }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const initializeChat = async () => {
      if (isOpen && currentItem && !chatSessionRef.current) {
        setIsLoading(true);
        setMessages([]);
        
        try {
          // Fixed: Use process.env.API_KEY directly for initialization.
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

          const systemInstruction = `Vous êtes un tuteur IA expert et amical. Votre seule et unique source de connaissance est le CONTEXTE fourni ci-dessous. Vous NE DEVEZ PAS répondre à des questions qui sortent de ce contexte. Si un utilisateur pose une question non pertinente, rappelez-lui poliment de rester sur le sujet du document.
          
          CONTEXTE:
          ---
          ${sourceText}
          ---
          `;

          // Fixed: Using gemini-3-flash-preview for chat tasks.
          const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction },
          });
          chatSessionRef.current = chat;

          const correctAnswerText = getCorrectAnswerText(currentItem);
          const initialPrompt = `En te basant uniquement sur le contexte fourni, explique-moi de manière simple et claire la réponse à cette question.
          
          Question : "${currentItem.question}"
          Réponse attendue : "${correctAnswerText}"`;
          
          const response = await chat.sendMessage({ message: initialPrompt });
          // Fixed: Accessing response.text as a property.
          setMessages([{ author: 'ai', text: response.text }]);

        } catch (error) {
            console.error("Erreur lors de l'initialisation du chat:", error);
            setMessages([{ author: 'ai', text: "Désolé, une erreur s'est produite lors du démarrage du tuteur IA." }]);
        } finally {
            setIsLoading(false);
        }
      } else if (!isOpen) {
          chatSessionRef.current = null; // Reset chat session on close
      }
    };

    initializeChat();
  }, [isOpen, currentItem, sourceText]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !userInput.trim() || !chatSessionRef.current) return;

    const userText = userInput;
    setMessages(prev => [...prev, { author: 'user', text: userText }]);
    setUserInput('');
    setIsLoading(true);

    try {
        const response = await chatSessionRef.current.sendMessage({ message: userText });
        // Fixed: Accessing response.text as a property.
        setMessages(prev => [...prev, { author: 'ai', text: response.text }]);
    } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
        setMessages(prev => [...prev, { author: 'ai', text: "Désolé, je rencontre des difficultés pour répondre." }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <aside
      className={`transition-all duration-500 ease-in-out bg-gray-50 border-l border-gray-200 flex flex-col h-screen ${isOpen ? 'w-2/5' : 'w-0'}`}
      style={{ overflow: 'hidden' }}
    >
      <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <h3 className="font-bold text-gray-800">Tuteur IA</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
          <XIcon className="w-6 h-6 text-gray-600" />
        </button>
      </header>

      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.author === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.author === 'user' ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
         {isLoading && (
            <div className="flex justify-start">
                 <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl bg-white text-gray-800 border border-gray-200 rounded-bl-none flex items-center gap-2">
                    <SpinnerIcon className="w-5 h-5 text-primary-500 animate-spin" />
                    <span className="text-sm text-gray-500">Réflexion...</span>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="Posez une question..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
            disabled={isLoading || !chatSessionRef.current}
          />
          <button type="submit" className="bg-primary-600 text-white p-3 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-gray-400" disabled={isLoading || !userInput.trim()}>
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
};
