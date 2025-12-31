import type { StudySet, StudyItem, MCQ } from '../types';

// --- Helper Functions ---

/**
 * Triggers a browser download for a given Blob and filename.
 * @param blob The data blob to download.
 * @param filename The suggested filename for the download.
 */
const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats a single StudyItem into a "Front\tBack" string for Anki import.
 * @param item The study item to format.
 * @returns A tab-separated string.
 */
const formatAnkiCard = (item: StudyItem): string => {
    const front = item.question;
    let back = '';

    switch (item.type) {
        case 'flashcard':
        case 'free':
        case 'case':
            back = (item as any).answer;
            break;
        case 'mcq':
            const mcq = item as MCQ;
            const optionsHtml = mcq.options.map((opt, index) => {
                const isCorrect = index === mcq.correctAnswerIndex;
                const prefix = String.fromCharCode(65 + index);
                return isCorrect 
                    ? `<li><b>${prefix}. ${opt} (Correct)</b></li>` 
                    : `<li>${prefix}. ${opt}</li>`;
            }).join('');
            back = `<ul>${optionsHtml}</ul>`;
            break;
    }

    if (item.explanation) {
        back += `<br><hr><br><b>Explanation:</b> ${item.explanation}`;
    }

    // Anki fields are separated by a tab character.
    // Replace newlines in the question with HTML breaks to keep it on one line.
    return `${front.replace(/\n/g, '<br>')}\t${back}`;
};

// --- Public API ---

/**
 * Formats a StudySet into a string for Anki's text file import.
 * This function is separated for testability.
 * @param set The study set to format.
 * @returns A string with items formatted for Anki.
 */
export const formatForAnkiTxt = (set: StudySet): string => {
    return set.items.map(formatAnkiCard).join('\n');
};

/**
 * Generates a string for Anki's text file import and triggers a download.
 * @param set The study set to export.
 */
export const exportToAnkiTxt = (set: StudySet): void => {
    try {
        const content = formatForAnkiTxt(set);
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const filename = `${set.title.replace(/\s/g, '_')}_anki.txt`;
        triggerDownload(blob, filename);
    } catch (error) {
        console.error("Failed to export for Anki:", error);
        throw new Error("Failed to create Anki export file.");
    }
};

/**
 * Serializes a study set to a JSON string.
 * This function is separated for testability.
 * @param set The study set to format.
 * @returns A formatted JSON string.
 */
export const formatForJson = (set: StudySet): string => {
    return JSON.stringify(set, null, 2);
};

/**
 * Serializes a study set to a JSON string and triggers a download.
 * @param set The study set to export.
 */
export const exportToJson = (set: StudySet): void => {
    try {
        const content = formatForJson(set);
        const blob = new Blob([content], { type: "application/json" });
        const filename = `${set.title.replace(/\s/g, '_')}.json`;
        triggerDownload(blob, filename);
    } catch (error) {
        console.error("Failed to export to JSON:", error);
        throw new Error("Failed to create JSON export file.");
    }
};

/**
 * Parses a JSON file, validates its structure, and returns it as a new StudySet.
 * Regenerates IDs to prevent conflicts.
 * @param file The JSON file uploaded by the user.
 * @returns A promise that resolves to a new StudySet object.
 */
export const importFromJson = (file: File): Promise<StudySet> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (!event.target?.result) {
                    throw new Error("File is empty or could not be read.");
                }
                const data = JSON.parse(event.target.result as string);

                // Basic validation
                if (!data.id || !data.title || !Array.isArray(data.items)) {
                    throw new Error("Invalid JSON format. Missing required 'id', 'title', or 'items' fields.");
                }

                // Treat it as a *new* set to avoid conflicts
                const newSet: StudySet = {
                    ...data,
                    id: `set-imported-${Date.now()}`,
                    title: `${data.title} (Imported)`,
                    createdAt: new Date().toISOString(),
                    // Regenerate item IDs as well
                    items: data.items.map((item: StudyItem, index: number) => ({
                        ...item,
                        id: `${item.type}-imported-${Date.now()}-${index}`
                    }))
                };

                resolve(newSet);

            } catch (error) {
                if (error instanceof SyntaxError) {
                    reject(new Error("Failed to parse JSON. The file may be corrupt."));
                } else if (error instanceof Error) {
                    reject(error);
                } else {
                    reject(new Error("An unknown error occurred during import."));
                }
            }
        };
        reader.onerror = () => reject(new Error("Error reading the file."));
        reader.readAsText(file);
    });
};
