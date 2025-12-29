// Toggle switch component
import { motion } from 'framer-motion';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
    label?: string;
}

export function Toggle({ checked, onChange, disabled = false, size = 'md', label }: ToggleProps) {
    const sizes = {
        sm: {
            track: 'w-8 h-4',
            knob: 'w-3 h-3',
            translate: 'translate-x-4',
        },
        md: {
            track: 'w-11 h-6',
            knob: 'w-5 h-5',
            translate: 'translate-x-5',
        },
    };

    const s = sizes[size];

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`
        relative inline-flex items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-dark-900
        ${s.track}
        ${checked ? 'bg-accent-primary' : 'bg-dark-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
        >
            <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`
          inline-block rounded-full bg-white shadow-md
          transform
          ${s.knob}
          ${checked ? s.translate : 'translate-x-0.5'}
        `}
            />
        </button>
    );
}

export default Toggle;
