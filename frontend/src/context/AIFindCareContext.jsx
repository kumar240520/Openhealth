import React, { createContext, useContext, useState } from 'react';
import AIFindCareModal from '../components/ai/AIFindCareModal';

const AIFindCareContext = createContext(null);

export function AIFindCareProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('menu'); // 'menu' | 'input' | 'voice' | 'report' | 'bill'

  const openAICareModal = (options = {}) => {
    if (options.mode) setInitialMode(options.mode);
    else setInitialMode('menu');
    setIsOpen(true);
  };

  const closeAICareModal = () => {
    setIsOpen(false);
  };

  return (
    <AIFindCareContext.Provider value={{ isOpen, openAICareModal, closeAICareModal }}>
      {children}
      <AIFindCareModal 
        isOpen={isOpen} 
        onClose={closeAICareModal} 
        initialMode={initialMode} 
      />
    </AIFindCareContext.Provider>
  );
}

export function useAICare() {
  const context = useContext(AIFindCareContext);
  if (!context) {
    throw new Error('useAICare must be used within an AIFindCareProvider');
  }
  return context;
}
