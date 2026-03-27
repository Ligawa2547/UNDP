import * as React from 'react';
import { styled } from '@stitches/react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

const StyledCheckbox = styled(CheckboxPrimitive.Checkbox, {
  width: 20,
  height: 20,
  backgroundColor: 'white',
  border: '2px solid gray',
  borderRadius: '4px',
  outline: 'none',
  '&[data-state="checked"]': {
    backgroundColor: 'blue',
    borderColor: 'blue',
  },
});

export const Checkbox = React.forwardRef((props, forwardedRef) => (
  <StyledCheckbox {...props} ref={forwardedRef} />
));

Checkbox.displayName = 'Checkbox';

export default Checkbox;
