
import * as mammoth from 'mammoth';
import type { NormalizedDocument } from '../types';
import { cleanText } from '../lib/utils';

// Déclare la variable globale pdfjsLib pour informer TypeScript qu'elle existe
declare const pdfjsLib: any;

// --- Logique d'Adaptateur de Base ---

const processAndNormalize = (text: string, title?: string): NormalizedDocument => {
    const cleanedText = cleanText(text);
    
    // Pour la simplicité, nous retournons le texte en entier.
    // La logique de découpage est disponible dans les utilitaires si nécessaire pour un flux différent.
    
    return {
        text: cleanedText,
        title: title || 'Document Importé',
        // La détection de la langue nécessiterait une bibliothèque comme 'languagedetect'
        // qui peut être lourde pour le client. Nous la simulons pour l'instant.
        language: 'en', 
    };
};


// --- Adaptateurs ---

/**
 * Analyse un fichier DOCX en utilisant mammoth.js dans le navigateur.
 */
export const docxAdapter = async (file: File): Promise<NormalizedDocument> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (event.target?.result) {
                try {
                    // Fix for mammoth browser import issues.
                    // In browser environments with CDN scripts, mammoth is often on window.mammoth.
                    // We prioritize window.mammoth if available.
                    const mammothInstance = (typeof window !== 'undefined' && (window as any).mammoth) 
                        ? (window as any).mammoth 
                        // @ts-ignore
                        : (mammoth.default || mammoth);
                    
                    if (!mammothInstance || typeof mammothInstance.extractRawText !== 'function') {
                         throw new Error("La bibliothèque Mammoth n'est pas chargée correctement. (Fonction extractRawText introuvable)");
                    }

                    const result = await mammothInstance.extractRawText({ arrayBuffer: event.target.result as ArrayBuffer });
                    resolve(processAndNormalize(result.value, file.name.replace('.docx', '')));
                } catch (error) {
                    console.error("Erreur lors de l'analyse du DOCX:", error);
                    reject(new Error("Échec de l'analyse du fichier DOCX. Il est peut-être corrompu ou dans un format non supporté."));
                }
            } else {
                reject(new Error("Échec de la lecture du fichier."));
            }
        };
        reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier."));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Analyse un fichier PDF en utilisant PDF.js dans le navigateur.
 */
export const pdfAdapter = async (file: File): Promise<NormalizedDocument> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (event.target?.result) {
                try {
                    // pdfjsLib est chargé depuis une balise script dans index.html
                    const loadingTask = pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer });
                    const pdf = await loadingTask.promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }
                    resolve(processAndNormalize(fullText, file.name.replace('.pdf', '')));
                } catch (error) {
                    console.error("Erreur lors de l'analyse du PDF avec PDF.js:", error);
                    reject(new Error("Impossible de traiter le fichier PDF. Il est peut-être corrompu ou protégé par un mot de passe."));
                }
            } else {
                reject(new Error("Échec de la lecture du fichier."));
            }
        };
        reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier."));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * ADAPTATEUR FICTIF: Analyse un fichier PPTX.
 * NOTE: L'analyse de PPTX côté client n'est pas couramment supportée par les bibliothèques légères.
 * Ceci est un placeholder.
 */
export const pptxAdapter = async (file: File): Promise<NormalizedDocument> => {
    console.warn("L'adaptateur PPTX est une simulation. Il n'effectue pas d'analyse réelle.");
    return new Promise(resolve => {
        setTimeout(() => {
            const mockText = `Ceci est un texte fictif du fichier PowerPoint "${file.name}".\n\nL'analyse de PPTX côté client est difficile. Cette tâche est presque toujours gérée par un serveur backend qui peut utiliser des bibliothèques conçues pour Node.js ou d'autres langages côté serveur pour extraire le contenu des diapositives.`;
            resolve(processAndNormalize(mockText, file.name.replace('.pptx', '')));
        }, 1000);
    });
};


/**
 * ADAPTATEUR FICTIF: Récupère et analyse une URL.
 * NOTE: Ceci est un placeholder. La récupération directe depuis un navigateur est bloquée par la politique CORS pour la plupart des sites web.
 * Cette fonctionnalité nécessite un proxy côté serveur.
 */
export const urlAdapter = async (url: string): Promise<NormalizedDocument> => {
    console.warn("L'adaptateur d'URL est une simulation. Il n'effectue pas de récupération réelle.");
     if (!url.startsWith('http')) {
        throw new Error("Veuillez entrer une URL valide (par ex., https://...).");
    }
    return new Promise(resolve => {
        setTimeout(() => {
            const mockText = `Ceci est un texte fictif de l'URL : ${url}.\n\nLa récupération et l'analyse de pages web arbitraires côté client sont bloquées par les politiques de sécurité du navigateur (CORS). Une application en production enverrait l'URL à son propre backend, qui récupérerait ensuite le contenu, l'analyserait pour supprimer les publicités et la navigation (comme avec Readability.js de Mozilla), et retournerait le texte propre.`;
             let title = 'Contenu de la Page Web';
            try {
                title = new URL(url).hostname;
            } catch(e) {/* ignorer */}
            resolve(processAndNormalize(mockText, title));
        }, 1000);
    });
};


/**
 * ADAPTATEUR FICTIF: Récupère une transcription YouTube.
 * NOTE: Ceci est un placeholder. L'accès aux transcriptions YouTube nécessite l'API de données YouTube,
 * qui requiert une clé API qui doit rester secrète sur un serveur.
 */
export const youtubeAdapter = async (videoUrl: string): Promise<NormalizedDocument> => {
    console.warn("L'adaptateur YouTube est une simulation. Il n'utilise pas l'API YouTube.");
    let videoId = videoUrl;
    try {
        const url = new URL(videoUrl);
        if (url.hostname.includes('youtube.com')) {
            videoId = url.searchParams.get('v') || 'dQw4w9WgXcQ';
        } else if (url.hostname.includes('youtu.be')) {
             videoId = url.pathname.slice(1) || 'dQw4w9WgXcQ';
        }
    } catch(e) { /* Il pourrait s'agir simplement d'un ID */ }

    return new Promise(resolve => {
        setTimeout(() => {
            const mockText = `Ceci est une transcription fictive pour la vidéo YouTube ID : ${videoId}.\n\nObtenir une transcription de vidéo nécessite l'utilisation de l'API de données YouTube v3. Cela implique une authentification avec une clé API, qui ne peut pas être stockée en toute sécurité côté client. Le backend de l'application effectuerait cet appel API et retournerait le texte de la transcription au frontend.`;
            resolve(processAndNormalize(mockText, `Transcription pour la vidéo ${videoId}`));
        }, 1000);
    });
};

/**
 * Adaptateur passe-plat pour le texte brut.
 */
export const notesAdapter = (text: string): NormalizedDocument => {
    return processAndNormalize(text, text.substring(0, 40) + '...');
};
