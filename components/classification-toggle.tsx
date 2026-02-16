'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ClassificationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function ClassificationToggle({ enabled, onToggle }: ClassificationToggleProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border rounded-lg">
      <Switch
        id="classification-mode"
        checked={enabled}
        onCheckedChange={onToggle}
      />
      <div className="flex-1">
        <Label htmlFor="classification-mode" className="text-sm font-medium cursor-pointer">
          Show Data Classification
        </Label>
        <p className="text-xs text-muted-foreground">
          Highlight direct identifiers, indirect identifiers, and sensitive data
        </p>
      </div>
    </div>
  );
}
