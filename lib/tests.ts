import type { StudySet, MCQ, Flashcard } from '../types';
// FIX: The export functions were moved from a now-deleted service to lib/exportAnki.ts.
// We are now importing testable formatter functions instead of the download-triggering functions.
import { formatForAnkiTxt, formatForJson } from './exportAnki';

// Mock Data
const mockMcqItem: MCQ = {
    id: "mcq-123",
    type: 'mcq',
    question: "What is React?",
    options: ["A library", "A framework", "A language"],
    correctAnswerIndex: 0,
    explanation: "React is a JavaScript library for building user interfaces.",
    difficulty: 2,
    sm2: { interval: 0, repetitions: 0, efactor: 2.5 },
    lastReviewedAt: null,
    nextReviewAt: null
};

const mockFlashcardItem: Flashcard = {
    id: "flash-456",
    type: 'flashcard',
    question: "What is JSX?",
    answer: "JavaScript XML, a syntax extension for JavaScript.",
    difficulty: 3,
    sm2: { interval: 0, repetitions: 0, efactor: 2.5 },
    lastReviewedAt: null,
    nextReviewAt: null
};

const mockStudySet: StudySet = {
    id: "set-abc",
    title: "React Basics",
    createdAt: "2023-10-27T10:00:00.000Z",
    items: [mockMcqItem, mockFlashcardItem],
    sourceText: "Some text about React."
};


// "Snapshot" Tests
const runAnkiTxtSnapshotTest = () => {
    const expectedOutput = `What is React?\t<ul><li><b>A. A library (Correct)</b></li><li>B. A framework</li><li>C. A language</li></ul><br><hr><br><b>Explanation:</b> React is a JavaScript library for building user interfaces.
What is JSX?\tJavaScript XML, a syntax extension for JavaScript.`;

    const actualOutput = formatForAnkiTxt(mockStudySet);

    console.log("--- Anki TXT Snapshot Test ---");
    console.assert(actualOutput === expectedOutput, "Anki TXT output does not match snapshot.");
    if (actualOutput === expectedOutput) {
        console.log("Test Passed: ✅");
    } else {
        console.error("Test Failed: ❌");
        console.log("Expected:\n", expectedOutput);
        console.log("\nActual:\n", actualOutput);
    }
    console.log("----------------------------");
};


const runJsonSnapshotTest = () => {
    const expectedOutput = JSON.stringify(mockStudySet, null, 2);
    const actualOutput = formatForJson(mockStudySet);

    console.log("\n--- JSON Snapshot Test ---");
    console.assert(actualOutput === expectedOutput, "JSON output does not match snapshot.");
    if (actualOutput === expectedOutput) {
        console.log("Test Passed: ✅");
    } else {
        console.error("Test Failed: ❌");
        console.error("JSON Snapshot Mismatch!");
        console.log("Expected:\n", expectedOutput);
        console.log("\nActual:\n", actualOutput);
    }
    console.log("----------------------------");
};

/**
 * Call this function somewhere in your app for development to see test results.
 * For example, in a useEffect in App.tsx.
 */
export const runExportTests = () => {
    console.log("Running export service tests...");
    runAnkiTxtSnapshotTest();
    runJsonSnapshotTest();
    console.log("...tests complete.");
};
