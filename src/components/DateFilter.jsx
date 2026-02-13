import React from 'react';

const DateFilter = ({ selectedPeriod, onPeriodChange }) => {
  const periods = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="date-filter-bar">
      <span className="date-filter-label">Time Period:</span>
      <div className="date-filter-buttons">
        {periods.map(period => (
          <button
            key={period.value}
            className={`date-filter-btn ${selectedPeriod === period.value ? 'active' : ''}`}
            onClick={() => onPeriodChange(period.value)}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateFilter;
