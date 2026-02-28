import { useMemo } from 'react';
import { useActiveInstituteTypes } from '../hooks/useInstituteTypes';

/**
 * Reusable Institute Type Select Component
 * Fetches institute types from API and displays them in a dropdown
 */
const InstituteTypeSelect = ({ value, onChange, className = '', required = false, disabled = false, placeholder = 'Select Institute Type' }) => {
  const { data: instituteTypesData = [], isLoading } = useActiveInstituteTypes();
  
  // Transform API data to sorted options
  const options = useMemo(() => {
    return instituteTypesData
      .filter(type => type.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(type => ({
        value: type.value,
        label: type.name
      }));
  }, [instituteTypesData]);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <>
      <select
        value={value || ''}
        onChange={handleChange}
        className={className}
        required={required}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <option value="">Loading institute types...</option>
        ) : options.length === 0 ? (
          <option value="">No institute types available</option>
        ) : (
          <>
            <option value="">{placeholder}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
      {options.length === 0 && !isLoading && (
        <p className="mt-1 text-xs text-yellow-600">
          No institute types found. Please create one in Institute Types page.
        </p>
      )}
    </>
  );
};

export default InstituteTypeSelect;

