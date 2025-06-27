import React from 'react';

export const Footer: React.FC = () => {
  return (
    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-12 mb-6">
      <p>© {new Date().getFullYear()} IntelliAudit. All rights reserved.</p>
    </div>
  );
}; 