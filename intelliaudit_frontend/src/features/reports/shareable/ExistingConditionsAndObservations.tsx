import type { FC } from 'react';

// Component interfaces
interface ExistingConditionsProps {
  conditions?: string[];
}

export const ExistingConditionsAndObservations: FC<ExistingConditionsProps> = ({
  conditions = []
}) => {
  return (
    <div className="existing-conditions">
      <h3 className="text-xl font-semibold mb-4">Existing Conditions</h3>
      {conditions && conditions.length > 0 ? (
        <ul className="list-disc list-inside space-y-2">
          {conditions.map((condition, index) => (
            <li key={index} className="text-gray-700">{condition}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No conditions data available.</p>
      )}
    </div>
  );
}
 