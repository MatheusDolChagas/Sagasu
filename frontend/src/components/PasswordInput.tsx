import { useState } from 'react';
import { HiEye, HiEyeSlash } from 'react-icons/hi2';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PasswordInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
};

export default function PasswordInput({
  id,
  value,
  onChange,
  className,
  required,
  autoComplete,
  placeholder,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn('pr-10', className)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={-1}
      >
        {visible ? <HiEyeSlash className="h-5 w-5" /> : <HiEye className="h-5 w-5" />}
      </button>
    </div>
  );
}
