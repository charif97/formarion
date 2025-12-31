
import React, { useState } from 'react';
import { JungleLogo, CheckIcon, ChevronDownIcon } from './icons';

interface LandingViewProps {
    onGetStarted: () => void;
}

const FAQItem: React.FC<{ q: string, a: string }> = ({ q, a }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-4">
                <span className="font-semibold text-lg text-gray-800">{q}</span>
                <ChevronDownIcon className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="pb-4 text-gray-600">{a}</div>}
        </div>
    )
};

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted }) => {
    return (
        <div className="bg-white">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <JungleLogo className="w-24 h-auto text-primary-700" />
                    </div>
                    <button onClick={onGetStarted} className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-primary-700 transition-colors">
                        Get Started
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center text-center bg-gray-50 overflow-hidden">
                 <div className="absolute inset-0 bg-grid-gray-200/50 [mask-image:linear-gradient(to_bottom,white_50%,transparent_100%)]"></div>
                <div className="relative z-10 p-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight">
                        Master Any Subject, <span className="text-primary-600">Faster.</span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-gray-600">
                        Turn your notes, documents, and videos into powerful, interactive study materials with the help of AI.
                    </p>
                    <button onClick={onGetStarted} className="mt-8 bg-primary-600 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:bg-primary-700 transition-transform transform hover:scale-105">
                        Start Learning for Free
                    </button>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="features" className="py-20 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-gray-800">How It Works</h2>
                    <p className="text-lg text-gray-500 mt-2">In three simple steps.</p>
                    <div className="mt-12 grid md:grid-cols-3 gap-8">
                        <div className="p-8 border rounded-xl shadow-sm">
                            <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">1</div>
                            <h3 className="text-2xl font-semibold mt-6">Import Content</h3>
                            <p className="text-gray-600 mt-2">Upload a file (PDF, DOCX), paste text, or link a URL. Our AI handles the rest.</p>
                        </div>
                        <div className="p-8 border rounded-xl shadow-sm">
                            <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">2</div>
                            <h3 className="text-2xl font-semibold mt-6">AI Generates</h3>
                            <p className="text-gray-600 mt-2">Instantly get flashcards, multiple-choice questions, and summaries tailored to your material.</p>
                        </div>
                        <div className="p-8 border rounded-xl shadow-sm">
                             <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">3</div>
                            <h3 className="text-2xl font-semibold mt-6">Study Smart</h3>
                            <p className="text-gray-600 mt-2">Our spaced repetition system shows you what you need to review, right when you need to.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-gray-800">Choose Your Plan</h2>
                    <div className="mt-12 flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto">
                        <div className="w-full md:w-1/2 p-8 border rounded-xl shadow-lg bg-white text-left">
                            <h3 className="text-2xl font-bold">Free</h3>
                            <p className="text-gray-500">For casual learners</p>
                            <p className="text-5xl font-extrabold my-6">$0<span className="text-lg font-medium text-gray-500">/month</span></p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3"><CheckIcon className="w-6 h-6 text-green-500"/> 5 Study Sets</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-6 h-6 text-green-500"/> Up to 20 items per set</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-6 h-6 text-green-500"/> Spaced Repetition (SM-2)</li>
                            </ul>
                            <button onClick={onGetStarted} className="w-full mt-8 bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300">
                                Get Started
                            </button>
                        </div>
                         <div className="w-full md:w-1/2 p-8 border-2 border-primary-500 rounded-xl shadow-2xl bg-white text-left relative">
                            <div className="absolute top-0 -translate-y-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</div>
                            <h3 className="text-2xl font-bold text-primary-600">Pro</h3>
                            <p className="text-gray-500">For dedicated students</p>
                            <p className="text-5xl font-extrabold my-6">$10<span className="text-lg font-medium text-gray-500">/month</span></p>
                             <ul className="space-y-3">
                                <li className="flex items-center gap-3"><CheckIcon className="w-6 h-6 text-green-500"/> Unlimited Study Sets</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-6 h-6 text-green-500"/> Unlimited items per set</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-6 h-6 text-green-500"/> Spaced Repetition (SM-2)</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-6 h-6 text-green-500"/> Advanced Analytics</li>
                                <li className="flex items-center gap-3"><CheckIcon className="w-6 h-6 text-green-500"/> Priority Support</li>
                            </ul>
                            <button onClick={onGetStarted} className="w-full mt-8 bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700">
                                Go Pro
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* FAQ Section */}
            <section id="faq" className="py-20 bg-white">
                <div className="container mx-auto px-4 max-w-3xl">
                     <h2 className="text-4xl font-bold text-gray-800 text-center">Frequently Asked Questions</h2>
                     <div className="mt-8">
                        <FAQItem q="What is spaced repetition?" a="Spaced repetition is a learning technique that involves reviewing information at increasing intervals. Our app uses the SM-2 algorithm to calculate the optimal time to review each flashcard, helping you move information into your long-term memory more efficiently." />
                        <FAQItem q="What file types can I import?" a="You can import DOCX files, paste plain text, or provide a URL to an article. We are working on adding support for more file types like PDF and PPTX soon!" />
                        <FAQItem q="Can I use this on my phone?" a="Yes! The application is fully responsive and works beautifully on desktops, tablets, and mobile phones." />
                        <FAQItem q="How does the AI generation work?" a="We use a powerful language model (Google's Gemini) to analyze your source text. It identifies key concepts and relationships to create relevant and challenging questions of various types, such as flashcards and multiple-choice questions." />
                     </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-gray-800 text-gray-300 text-center">
                 <div className="container mx-auto px-4">
                    <p>&copy; {new Date().getFullYear()} Jungle. All rights reserved.</p>
                 </div>
            </footer>
        </div>
    );
};