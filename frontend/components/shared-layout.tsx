'use client';

import React from 'react';

interface SharedLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export const SharedLayout: React.FC<SharedLayoutProps> = ({ children, className }) => {
    return (
        <div className={`shared-layout ${className || ''}`}>
            {children}
        </div>
    );
};

export default SharedLayout;
