
import React from 'react';
import { UserRole, Class } from '../types';
import { AddIcon, BookOpenIcon } from './icons';

interface MyCoursesViewProps {
  classes: Class[];
  onSelectClass: (classId: string) => void;
  onCreateClass: () => void;
  onOpenClassAnalytics: (classId: string) => void;
  role: UserRole;
}

export const MyCoursesView: React.FC<MyCoursesViewProps> = ({ classes, onSelectClass, onCreateClass, onOpenClassAnalytics, role }) => {
  const totalCards = (c: Class) => c.studySets.reduce((sum, set) => sum + set.items.length, 0);

  // Permissions
  const canCreate = [UserRole.Manager, UserRole.ContentOwner, UserRole.BusinessAdmin, UserRole.TechAdmin].includes(role);
  const canViewAnalytics = [UserRole.Manager, UserRole.ContentOwner, UserRole.BusinessAdmin, UserRole.Auditor].includes(role);
  
  const title = canCreate ? "Mes Équipes & Espaces de Formation" : "Mes Formations Assignées";
  const subTitle = canCreate 
    ? "Gérez vos équipes, assignez du contenu ou créez de nouveaux groupes." 
    : "Accédez aux contenus de formation mis à disposition par votre manager.";

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500 mt-1">{subTitle}</p>
        </div>
        {canCreate && (
            <button onClick={onCreateClass} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 transition-colors duration-300">
                <AddIcon className="w-5 h-5" />
                Créer un groupe
            </button>
        )}
      </div>

        {classes.length === 0 ? (
             <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto" />
                <h3 className="text-lg font-medium text-gray-600 mt-4">Aucun espace trouvé !</h3>
                <p className="text-gray-500 mt-2 mb-4">{canCreate ? "Créez votre première équipe." : "Demandez à votre manager de vous assigner une formation."}</p>
                {canCreate && (
                    <button onClick={onCreateClass} className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-primary-700 transition-colors duration-300">
                        Créer un groupe
                    </button>
                )}
              </div>
        ) : (
             <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase text-gray-500">Liste</h2>
                {classes.map(c => (
                    <div 
                        key={c.id} 
                        className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex items-center justify-between flex-wrap gap-4"
                    >
                        <div 
                            className="flex items-center gap-4 flex-grow cursor-pointer min-w-[200px]"
                            onClick={() => onSelectClass(c.id)}
                        >
                             <div className="bg-primary-100 p-2 rounded-lg">
                                <BookOpenIcon className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{c.name}</h3>
                                <p className="text-sm text-gray-500">{totalCards(c)} concepts / questions</p>
                            </div>
                        </div>
                        
                        {canViewAnalytics && (
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenClassAnalytics(c.id);
                                    }}
                                    className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                                    </svg>
                                    Suivi de classe
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
