import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

export function Portal({ children }: PortalProps) {
  const [container] = useState(() => {
    // This will only run once on mount
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = '0';
    div.style.top = '0';
    div.style.zIndex = '9999';
    return div;
  });

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  return createPortal(children, container);
}
