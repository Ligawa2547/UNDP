import { Checkbox as RadixCheckbox } from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export const Checkbox = forwardRef(({ className, ...props }, ref) => (
  <RadixCheckbox
    ref={ref}
    className={cn('h-4 w-4 rounded ring-offset-gray-100 focus:ring-2 checked:ring-4', className)}
    {...props}
  />
));

Checkbox.displayName = 'Checkbox';
