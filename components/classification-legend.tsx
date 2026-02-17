'use client';

import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export default function ClassificationLegend() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="w-4 h-4" />
          Classification Legend
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2">Data Classification Types</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Understanding sensitivity levels for data protection
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Direct Identifier</div>
                <div className="text-xs text-muted-foreground">
                  Uniquely identifies a person: email, SSN, name, phone
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Indirect Identifier</div>
                <div className="text-xs text-muted-foreground">
                  Can identify when combined: DOB, address, IP, zip code
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-sm">Sensitive Data</div>
                <div className="text-xs text-muted-foreground">
                  Requires protection: salary, medical, financial data
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
