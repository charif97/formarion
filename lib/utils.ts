// A very simple tokenizer for estimation. A real implementation might use a library.
const countTokens = (text: string): number => {
    return text.split(/\s+/).length;
};

// Simple text cleaner
export const cleanText = (text: string): string => {
    return text
        .replace(/(\r\n|\n|\r){3,}/gm, "\n\n") // Replace multiple newlines with just two
        .trim();
};


// Simple chunking strategy
export const chunkText = (text: string, maxTokens: number = 1500): string[] => {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
        const sentenceTokens = countTokens(sentence);
        const chunkTokens = countTokens(currentChunk);

        if (chunkTokens + sentenceTokens > maxTokens && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += sentence + " ";
    }

    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};
