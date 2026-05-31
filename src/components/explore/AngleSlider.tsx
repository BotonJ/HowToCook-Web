import { useState, useRef, useEffect } from 'react';

interface AngleSliderProps {
  value: number;
  onChange: (deg: number) => void;
}

export function AngleSlider({ value, onChange }: AngleSliderProps) {
  const [local, setLocal] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setLocal(v);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(v);
    }, 50);
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={90}
        step={5}
        value={local}
        onChange={handleChange}
        className="flex-1 h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary"
      />
      <span className="text-sm text-on-surface-variant font-body w-10 text-right">
        {local}°
      </span>
    </div>
  );
}
