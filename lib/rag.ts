/**
 * @fileoverview A lightweight, dependency-free RAG (Retrieval-Augmented Generation) module.
 * Implements TF-IDF and cosine similarity to find relevant text chunks.
 */

// --- Helper Functions ---

/**
 * A simple tokenizer that converts text to lowercase and splits by non-alphanumeric characters.
 * This is a basic form of normalization. A more advanced version might include stemming or lemmatization.
 * @param text The input string.
 * @returns An array of string tokens.
 */
const tokenize = (text: string): string[] => {
    return text.toLowerCase().split(/[^\w+]/).filter(Boolean);
};

/**
 * Chunks a long text into smaller, coherent pieces based on sentences.
 * Tries to keep chunks around a maximum length without splitting a sentence.
 * @param text The full text to chunk.
 * @param maxLength The target maximum length for each chunk.
 * @returns An array of text chunks.
 */
const chunkText = (text: string, maxLength: number = 1500): string[] => {
    // Split by sentences, keeping the delimiter.
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxLength && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += sentence + " ";
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
};


// --- TF-IDF and Vector Math ---

/**
 * Calculates Term Frequency (TF) for a term in a document.
 * @param term The term to calculate TF for.
 * @param docTokens Tokenized document.
 * @returns The TF score.
 */
const calculateTf = (term: string, docTokens: string[]): number => {
    const termCount = docTokens.filter(t => t === term).length;
    return termCount / docTokens.length;
};

/**
 * Calculates Inverse Document Frequency (IDF) for a term across a corpus.
 * Uses smoothed IDF to prevent division by zero.
 * @param term The term to calculate IDF for.
 * @param allDocsTokens An array of all tokenized documents in the corpus.
 * @returns The IDF score.
 */
const calculateIdf = (term: string, allDocsTokens: string[][]): number => {
    const docsWithTerm = allDocsTokens.filter(tokens => tokens.includes(term)).length;
    return 1 + Math.log((1 + allDocsTokens.length) / (1 + docsWithTerm));
};

/**

 * Calculates the dot product of two vectors.
 * @param vecA First vector.
 * @param vecB Second vector.
 * @returns The dot product.
 */
const dotProduct = (vecA: number[], vecB: number[]): number => {
    return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
};

/**
 * Calculates the magnitude (Euclidean norm) of a vector.
 * @param vec The vector.
 * @returns The magnitude.
 */
const magnitude = (vec: number[]): number => {
    return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
};

/**
 * Calculates the cosine similarity between two vectors.
 * @param vecA First vector.
 * @param vecB Second vector.
 * @returns A similarity score between 0 and 1.
 */
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    const magA = magnitude(vecA);
    const magB = magnitude(vecB);
    if (magA === 0 || magB === 0) return 0;
    return dotProduct(vecA, vecB) / (magA * magB);
};

// --- Main RAG Function ---

/**
 * Selects the most relevant text chunks from a large document based on a query.
 * This function implements a simple RAG pipeline:
 * 1. Chunks the document.
 * 2. Calculates TF-IDF vectors for the query and each chunk.
 * 3. Ranks chunks by cosine similarity to the query.
 * 4. Returns the top k chunks.
 *
 * @param query The user's query or topic of interest.
 * @param text The long source text.
 * @param k The number of top chunks to return.
 * @returns An array containing the `k` most relevant chunks of text.
 */
export const selectRelevantChunks = (query: string, text: string, k: number): string[] => {
    const chunks = chunkText(text);
    if (chunks.length <= k) {
        return chunks;
    }

    const queryTokens = tokenize(query);
    const chunkTokensList = chunks.map(c => tokenize(c));
    const allDocsTokens = [queryTokens, ...chunkTokensList];

    // Create a vocabulary of all unique terms in the corpus.
    const vocab = [...new Set(allDocsTokens.flat())];

    // Pre-calculate IDF for all terms in the vocabulary.
    const idfMap = new Map<string, number>();
    vocab.forEach(term => idfMap.set(term, calculateIdf(term, allDocsTokens)));

    // Create TF-IDF vectors for the query and each chunk.
    const createVector = (docTokens: string[]): number[] => {
        return vocab.map(term => {
            const tf = calculateTf(term, docTokens);
            const idf = idfMap.get(term) ?? 0;
            return tf * idf;
        });
    };

    const queryVector = createVector(queryTokens);
    const chunkVectors = chunkTokensList.map(tokens => createVector(tokens));

    // Calculate similarity scores for each chunk.
    const scores = chunks.map((chunk, i) => ({
        chunk,
        score: cosineSimilarity(queryVector, chunkVectors[i])
    }));

    // Sort chunks by score in descending order and return the top k.
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, k).map(s => s.chunk);
};