import React from 'react';
import { cn } from '@/lib/utils';

interface ScoreBarProps {
  score: number;
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
  maxScore?: number;
}

const colorClasses = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  success: 'bg-[hsl(var(--success))]',
  warning: 'bg-[hsl(var(--warning))]',
};

export const ScoreBar: React.FC<ScoreBarProps> = ({ 
  score, 
  label, 
  icon, 
  color,
  maxScore = 10 
}) => {
  const percentage = (score / maxScore) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className="font-bold">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
