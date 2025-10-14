
import React from 'react';
// FIX: Simplified to a single import for the StarIcon component.
import { StarIcon } from './Icons';

interface StarRatingProps {
  score: number;
  maxScore?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ score, maxScore = 5 }) => {
  return (
    <div className="flex items-center">
      {[...Array(maxScore)].map((_, index) => {
        const starValue = index + 1;
        if (score >= starValue) {
          return <StarIcon key={index} className="h-6 w-6 text-yellow-400" filled={true} />;
        }
        if (score > starValue - 1 && score < starValue) {
          const percentage = (score - (starValue - 1)) * 100;
          return (
            <div key={index} className="relative h-6 w-6">
              <StarIcon key={`outline-${index}`} className="h-6 w-6 text-yellow-400" />
              <div className="absolute top-0 left-0 h-full overflow-hidden" style={{ width: `${percentage}%` }}>
                <StarIcon key={`solid-${index}`} className="h-6 w-6 text-yellow-400" filled={true} />
              </div>
            </div>
          );
        }
        return <StarIcon key={index} className="h-6 w-6 text-yellow-400" />;
      })}
    </div>
  );
};
