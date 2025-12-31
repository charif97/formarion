
import React from 'react';

interface ProgressTreeProps {
  /** The user's overall mastery score, from 0 to 100. */
  mastery: number;
}

/**
 * A stylized SVG tree that "grows" and "lights up" based on a mastery score.
 * This component provides a gamified visualization of learning progress.
 */
export const ProgressTree: React.FC<ProgressTreeProps> = ({ mastery }) => {
  const masteryPercentage = Math.max(0, Math.min(100, mastery));

  const milestones = [20, 40, 60, 80, 100];
  const trunkLength = 80;
  const branch1Length = 35;
  const branch2Length = 40;
  
  // Calculate the stroke-dashoffset to animate the "drawing" of the tree.
  // At 0 mastery, the offset is the full length (invisible).
  // At 100 mastery, the offset is 0 (fully visible).
  const getOffset = (length: number, startMastery: number, endMastery: number) => {
    if (masteryPercentage < startMastery) return length;
    if (masteryPercentage >= endMastery) return 0;
    const progress = (masteryPercentage - startMastery) / (endMastery - startMastery);
    return length * (1 - progress);
  };
  
  const trunkOffset = getOffset(trunkLength, 0, 50);
  const branch1Offset = getOffset(branch1Length, 25, 75);
  const branch2Offset = getOffset(branch2Length, 40, 90);

  const nodeClass = (threshold: number) => 
    masteryPercentage >= threshold 
      ? 'text-yellow-400 filter-glow transition-colors duration-500' 
      : 'text-gray-300 transition-colors duration-500';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="w-64 h-64">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Tree structure */}
        <g 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-primary-700"
        >
          {/* Trunk */}
          <path
            d="M 50 95 V 15"
            stroke="currentColor"
            strokeWidth="5"
            fill="none"
            strokeDasharray={trunkLength}
            strokeDashoffset={trunkOffset}
            className="transition-all duration-1000 ease-out"
          />
          {/* Branches */}
          <path
            d="M 50 70 C 40 60, 25 50, 20 35"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={branch1Length}
            strokeDashoffset={branch1Offset}
            className="transition-all duration-1000 ease-out"
          />
          <path
            d="M 50 60 C 60 50, 75 45, 80 25"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
             strokeDasharray={branch2Length}
            strokeDashoffset={branch2Offset}
            className="transition-all duration-1000 ease-out"
          />
           <path
            d="M 50 40 C 40 30, 30 25, 25 15"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray={30}
            strokeDashoffset={getOffset(30, 60, 100)}
            className="transition-all duration-1000 ease-out"
          />
        </g>
        
        {/* Nodes (that light up) */}
        <g fill="currentColor">
           <circle cx="50" cy="15" r="4" className={nodeClass(milestones[4])} />
           <circle cx="20" cy="35" r="4" className={nodeClass(milestones[1])} />
           <circle cx="80" cy="25" r="4" className={nodeClass(milestones[2])} />
           <circle cx="25" cy="15" r="3.5" className={nodeClass(milestones[3])} />
           <circle cx="35" cy="55" r="3.5" className={nodeClass(milestones[0])} />
        </g>
         <style>{`
          .filter-glow {
            filter: url(#glow);
          }
        `}</style>
      </svg>
      <p className="text-2xl font-bold text-gray-700 mt-2">{masteryPercentage}%</p>
      <p className="text-sm text-gray-500">Maîtrise</p>
    </div>
  );
};