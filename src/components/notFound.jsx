/* eslint-disable */
import React from 'react';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">404 - Page non trouvée</h1>
      <p className="text-lg">La page que vous recherchez n'existe pas.</p>
      <a href="/dashboard" className="mt-4 text-blue-500 hover:underline">
        Retour 
      </a>
    </div>
  );
}

export default NotFound;