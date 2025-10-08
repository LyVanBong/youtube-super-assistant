import React, { useEffect, useState, useRef } from 'react';
import './style.css';

interface DualRangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, minValue, maxValue, onMinChange, onMaxChange }) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), maxValue - 5);
    onMinChange(newMin);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), minValue + 5);
    onMaxChange(newMax);
  };

  useEffect(() => {
    if (trackRef.current) {
      const minPercent = ((minValue - min) / (max - min)) * 100;
      const maxPercent = ((maxValue - min) / (max - min)) * 100;
      trackRef.current.style.left = `${minPercent}%`;
      trackRef.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minValue, maxValue, min, max]);

  return (
    <div className="dual-range-slider">
      <div ref={trackRef} className="slider-track"></div>
      <input type="range" min={min} max={max} value={minValue} onChange={handleMinChange} />
      <input type="range" min={min} max={max} value={maxValue} onChange={handleMaxChange} />
    </div>
  );
};

export default DualRangeSlider;
