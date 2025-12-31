
import React, { useState, useRef, MouseEvent, ChangeEvent } from 'react';
import { UploadIcon, TrashIcon, CheckIcon } from './icons';

/**
 * Defines the structure for an occlusion mask.
 */
export interface Mask {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageOcclusionEditorProps {
  /**
   * Callback function triggered when the user saves the masks.
   * @param masks An array of the created occlusion masks.
   */
  onSave: (masks: Mask[]) => void;
}

/**
 * An interactive editor for creating image occlusion masks.
 * Users can upload an image, draw rectangles over it, and save the coordinates.
 */
export const ImageOcclusionEditor: React.FC<ImageOcclusionEditorProps> = ({ onSave }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [masks, setMasks] = useState<Mask[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentMask, setCurrentMask] = useState<Omit<Mask, 'id'> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setMasks([]); // Reset masks on new image
      };
      reader.readAsDataURL(file);
    } else {
      alert('Veuillez sélectionner un fichier image valide (PNG, JPEG, SVG, WebP).');
    }
  };

  const getMousePosition = (e: MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only react to left-click
    e.preventDefault();
    const pos = getMousePosition(e);
    if (!pos) return;
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentMask({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !startPoint) return;
    const pos = getMousePosition(e);
    if (!pos) return;

    const x = Math.min(pos.x, startPoint.x);
    const y = Math.min(pos.y, startPoint.y);
    const width = Math.abs(pos.x - startPoint.x);
    const height = Math.abs(pos.y - startPoint.y);

    setCurrentMask({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentMask && currentMask.width > 5 && currentMask.height > 5) {
      setMasks(prev => [...prev, { ...currentMask, id: `mask-${Date.now()}` }]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentMask(null);
  };

  const handleReset = () => {
    setMasks([]);
  };

  const handleSave = () => {
    onSave(masks);
    alert(`${masks.length} masque(s) sauvegardé(s) ! Vérifiez la console du développeur pour les données.`);
    console.log(masks);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border w-full max-w-4xl mx-auto">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
      />
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <p className="text-lg font-semibold text-gray-700">Éditeur d'Occlusion d'Image</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <UploadIcon className="w-5 h-5" />
            {imageSrc ? 'Changer d\'image' : 'Sélectionner une image'}
          </button>
          <button
            onClick={handleReset}
            disabled={!imageSrc || masks.length === 0}
            className="flex items-center gap-2 bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300"
          >
            <TrashIcon className="w-5 h-5" />
            Réinitialiser
          </button>
          <button
            onClick={handleSave}
            disabled={!imageSrc || masks.length === 0}
            className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300"
          >
            <CheckIcon className="w-5 h-5" />
            Sauvegarder
          </button>
        </div>
      </div>

      <div className="relative w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden select-none">
        {imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt="Image à masquer"
              className="block w-full h-auto pointer-events-none"
            />
            <svg
              ref={svgRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="absolute top-0 left-0 w-full h-full cursor-crosshair"
            >
              {/* Render committed masks */}
              {masks.map((mask) => (
                <rect
                  key={mask.id}
                  x={mask.x}
                  y={mask.y}
                  width={mask.width}
                  height={mask.height}
                  fill="rgba(30, 64, 175, 0.7)"
                  stroke="#1e40af"
                  strokeWidth="2"
                />
              ))}
              {/* Render the mask currently being drawn */}
              {currentMask && (
                <rect
                  x={currentMask.x}
                  y={currentMask.y}
                  width={currentMask.width}
                  height={currentMask.height}
                  fill="rgba(60, 130, 246, 0.5)"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              )}
            </svg>
          </>
        ) : (
          <div className="flex items-center justify-center h-80">
            <p className="text-gray-500">Veuillez sélectionner une image pour commencer.</p>
          </div>
        )}
      </div>
    </div>
  );
};
