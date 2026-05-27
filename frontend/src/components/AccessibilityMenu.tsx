import { HiAdjustmentsHorizontal } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AccessibilityControls from '@/components/AccessibilityControls';

/** Menu completo (ex.: visitante no fim da navbar). */
export default function AccessibilityMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 border-border text-dark"
          aria-label="Acessibilidade e aparência"
        >
          <HiAdjustmentsHorizontal className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">Acessível</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,20rem)] p-3">
        <AccessibilityControls />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
