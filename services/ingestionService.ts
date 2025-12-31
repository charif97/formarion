import { Buffer } from 'buffer';
import type { Express } from 'express';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import { extractRawText } from 'pptx-parser';
import axios from 'axios';
import cheerio from 'cheerio';
import { YoutubeTranscript } from 'youtube-transcript';
import type { NormalizedDocument } from '../types';

// --- File Parsers ---

async function parseDocx(buffer: Buffer): Promise<Partial<NormalizedDocument>> {
    const { value } = await mammoth.extractRawText({ buffer });
    return { text: value };
}

async function parsePdf(buffer: Buffer): Promise<Partial<NormalizedDocument>> {
    const data = await pdf(buffer);
    return { text: data.text };
}

async function parsePptx(buffer: Buffer): Promise<Partial<NormalizedDocument>> {
    const textContent = await extractRawText(buffer);
    return { text: textContent };
}

// --- URL Parsers ---

async function parseWebUrl(url: string): Promise<Partial<NormalizedDocument>> {
    const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(html);

    const title = $('title').first().text() || $('h1').first().text();
    $('script, style, nav, footer, header, aside').remove();
    const text = $('body').text().replace(/\s\s+/g, ' ').trim();
    
    return { text, title };
}

async function parseYoutubeUrl(url: string): Promise<Partial<NormalizedDocument>> {
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    const text = transcript.map(t => t.text).join(' ');
    
    const { data } = await axios.get(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    const title = data.title || "YouTube Transcript";

    return { text, title };
}

// --- Main Service Functions ---

// FIX: Using any for file type to resolve 'Namespace Express has no exported member Multer' error.
export const ingestFile = async (file: any): Promise<NormalizedDocument> => {
    let result: Partial<NormalizedDocument> = {};
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'docx': result = await parseDocx(file.buffer); break;
        case 'pdf': result = await parsePdf(file.buffer); break;
        case 'pptx': result = await parsePptx(file.buffer); break;
        default: throw new Error('Unsupported file type. Please use PDF, DOCX, or PPTX.');
    }
    
    return {
        text: result.text?.trim() ?? '',
        title: result.title || file.originalname.replace(/\.[^/.]+$/, ""),
        language: 'en', // Language detection can be added here
    };
};

export const ingestUrl = async (url: string): Promise<NormalizedDocument> => {
    let result: Partial<NormalizedDocument> = {};

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        result = await parseYoutubeUrl(url);
    } else {
        result = await parseWebUrl(url);
    }

    return {
        text: result.text?.trim() ?? '',
        title: result.title || url,
        language: 'en',
    };
};