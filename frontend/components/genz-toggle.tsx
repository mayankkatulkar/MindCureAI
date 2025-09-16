'use client';

import { useEffect, useState } from 'react';
import { UserIcon, SmileyIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const GENZ_STORAGE_KEY = 'genz-mode';

interface GenZToggleProps {
  className?: string;
  onModeChange?: (isGenZ: boolean) => void;
}

export function GenZToggle({ className, onModeChange }: GenZToggleProps) {
  const [isGenZMode, setIsGenZMode] = useState<boolean>(false);

  useEffect(() => {
    const storedMode = localStorage.getItem(GENZ_STORAGE_KEY) === 'true';
    setIsGenZMode(storedMode);
    onModeChange?.(storedMode);
  }, [onModeChange]);

  function handleModeChange(genZMode: boolean) {
    localStorage.setItem(GENZ_STORAGE_KEY, genZMode.toString());
    setIsGenZMode(genZMode);
    onModeChange?.(genZMode);
  }

  return (
    <div
      className={cn(
        'text-foreground bg-background flex w-full flex-row justify-end divide-x overflow-hidden rounded-full border',
        className
      )}
    >
      <span className="sr-only">Communication style toggle</span>
      <button
        type="button"
        onClick={() => handleModeChange(false)}
        className="cursor-pointer p-1 pl-1.5"
        title="Professional Mode"
      >
        <span className="sr-only">Enable professional mode</span>
        <UserIcon size={16} weight="bold" className={cn(isGenZMode && 'opacity-25')} />
      </button>
      <button
        type="button"
        onClick={() => handleModeChange(true)}
        className="cursor-pointer p-1 pr-1.5"
        title="Gen-Z Mode"
      >
        <span className="sr-only">Enable Gen-Z mode</span>
        <SmileyIcon size={16} weight="bold" className={cn(!isGenZMode && 'opacity-25')} />
      </button>
    </div>
  );
}
