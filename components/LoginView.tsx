
import React, { useState } from 'react';
import { UserRole } from '../types';
import { JungleLogo } from './icons';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
  onBack: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const profiles = [
    { role: UserRole.Collaborator, label: 'Collaborateur', desc: 'Apprenant / Agence', icon: '👤' },
    { role: UserRole.Manager, label: 'Manager', desc: 'Chef d\'équipe / Directeur', icon: '💼' },
    { role: UserRole.ContentOwner, label: 'Référent Formation', desc: 'L&D / Contenu', icon: '📚' },
    { role: UserRole.BusinessAdmin, label: 'Admin Fonctionnel', desc: 'Gestion Métier', icon: '⚙️' },
    { role: UserRole.TechAdmin, label: 'Admin IT', desc: 'Support Technique', icon: '💻' },
    { role: UserRole.Auditor, label: 'Auditeur', desc: 'Conformité / Audit', icon: '🛡️' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation: default to Collaborator if generic login is attempted
    onLogin(UserRole.Collaborator);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Left Side - Branding */}
      <div className="md:w-1/2 bg-primary-900 text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10">
          <JungleLogo className="w-32 h-auto text-white mb-8" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Plateforme de Formation <br/> <span className="text-primary-400">Digital Learning</span>
          </h1>
          <p className="text-lg text-primary-100 max-w-md">
            Accédez à vos parcours, suivez votre progression et développez vos compétences métier au sein du groupe.
          </p>
        </div>
        <div className="relative z-10 mt-8">
          <p className="text-sm text-primary-300">© 2025 CAM Learning. Sécurité & Conformité garanties.</p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="md:w-1/2 p-8 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
            <p className="text-gray-500 mt-2">Veuillez sélectionner votre profil pour accéder à l'espace de démonstration.</p>
          </div>

          {/* Profile Selector Grid (Demo Feature) */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {profiles.map((p) => (
              <button
                key={p.role}
                onClick={() => onLogin(p.role)}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-primary-50 hover:border-primary-500 hover:shadow-md transition-all duration-200 text-center group bg-white"
              >
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{p.icon}</span>
                <span className="font-semibold text-gray-800 text-sm">{p.label}</span>
                <span className="text-xs text-gray-500 mt-1">{p.desc}</span>
              </button>
            ))}
          </div>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OU CONNEXION CLASSIQUE</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="sr-only">Matricule ou Email</label>
                <input
                  id="email-address"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Matricule ou Email professionnel"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Se souvenir de moi
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-900 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Se connecter
              </button>
            </div>
          </form>
          
           <button onClick={onBack} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-4">
              &larr; Retour à l'accueil
           </button>
        </div>
      </div>
    </div>
  );
};
