import React from 'react';

interface DeviationExplanationsProps {
  components: any[];
}

export const DeviationExplanations: React.FC<DeviationExplanationsProps> = ({ components }) => {
  // Filter components that have deviation explanations or standard percentages
  const componentsWithExplanations = components.filter(c => c.deviationExplanation);
  const componentsWithStandards = components.filter(c => c.standardPercent && c.standardPercent > 0);

  console.log('Components with explanations:', componentsWithExplanations);
  console.log('Components with standard percentages:', componentsWithStandards);

  if (componentsWithExplanations.length === 0 && componentsWithStandards.length === 0) {
    console.log('No components with deviation explanations or standard percentages found');
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Components with deviation explanations */}
      {componentsWithExplanations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Deviations from standard multifamily breakdown:</h3>
          <div className="space-y-3">
            {componentsWithExplanations.map(component => (
              <div key={`explanation-${component.name}`} className="border-l-2 border-blue-500 pl-3 py-1">
                <h4 className="text-sm font-medium">{component.name}</h4>
                <p className="text-xs text-muted-foreground">{component.deviationExplanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standard percentages table */}
      {componentsWithStandards.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Standard multifamily breakdown:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {componentsWithStandards
              .sort((a, b) => (b.standardPercent || 0) - (a.standardPercent || 0))
              .map(component => (
                <div key={`standard-${component.name}`} className="flex justify-between">
                  <span>{component.name}:</span>
                  <span className="font-medium">{component.standardPercent}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
