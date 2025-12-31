


import React from 'react';

// FIX: Define an explicit interface for props and data to ensure type safety and clarity,
// which resolves potential subtle type inference issues.
interface LeaderboardRowProps {
  rank: number;
  avatar: string;
  name: string;
  xp: number;
  medal: string | null;
}

const leaderboardData: LeaderboardRowProps[] = [
  { rank: 1, avatar: '🐵', name: 'Utilisateur 1', xp: 301, medal: '🥇' },
  { rank: 2, avatar: '🦥', name: 'Utilisateur 2', xp: 274, medal: '🥈' },
  { rank: 3, avatar: '🐷', name: 'Utilisateur 3', xp: 233, medal: '🥉' },
  { rank: 4, avatar: '🐵', name: 'Utilisateur 4', xp: 208, medal: null },
  { rank: 5, avatar: '🦊', name: 'Utilisateur 5', xp: 195, medal: null },
  { rank: 6, avatar: '🐨', name: 'Utilisateur 6', xp: 180, medal: null },
];


// FIX: Explicitly type `LeaderboardRow` as a `React.FC` to ensure TypeScript correctly handles React's special `key` prop and resolves the type error.
const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ rank, avatar, name, xp, medal }) => (
  <div className="flex items-center p-3 border-b border-gray-100 last:border-b-0">
    <div className="w-10 text-center font-bold text-gray-600">{rank}</div>
    <div className="w-12 text-2xl text-center">{medal || avatar}</div>
    <div className="flex-grow mx-4">
        <div className="bg-green-200/50 rounded-md h-5 filter blur-sm w-32"></div>
    </div>
    <div className="w-20 text-right font-semibold text-gray-700">{xp}xp</div>
  </div>
);

export const LeaderboardView: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center bg-gray-50/50 h-full">
      <div className="w-full max-w-2xl">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h1 className="text-xl font-bold text-center text-gray-800 mb-6">
                gagnez 100xp pour débloquer le classement pour CAM!
            </h1>
            <div className="space-y-1">
                {leaderboardData.map((user) => (
                    <LeaderboardRow key={user.rank} {...user} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};