import { useEffect, useState } from 'react';

import {
  StyledVectorForm,
  FormField,
  FieldLabel,
  FieldError,
  FieldInput,
  FormButton,
} from './VectorForm.styles';

import { SelectedVector } from '../ControlBoard';

// type definitions
type Axes = 'x' | 'y' | 'z';
type Values = Record<Axes, number>;
type Errors = Record<Axes, string | null>;

type Props = {
  selectedVector: SelectedVector | null;
  onSave: Function;
};

// component
const VectorForm = ({ selectedVector, onSave }: Props) => {
  const [values, setValues] = useState<Values>({ x: 1, y: 1, z: 1 });
  const [errors, setErrors] = useState<Errors>({ x: null, y: null, z: null });

  const handleChange = (e: any, axis: Axes) => {
    e.persist()

    // validate input
    const errorMessage = isNaN(e.target.value) ? 'Not a valid number' : null;
    setValues((values) => ({ ...values, [axis]: e.target.value }));
    setErrors((errors) => ({ ...errors, [axis]: errorMessage }));
  };

  const handleSubmit = () => {
    onSave(values);
  }

  // set input values on vector selection
  useEffect(() => {
    if (selectedVector) {
      setValues({ x: selectedVector.coords.x, y: selectedVector.coords.y, z: selectedVector.coords.z})
    } else {
      setValues({ x: 1, y: 1, z: 1 });
    }
  }, [selectedVector, setValues]);

  return (
    <StyledVectorForm>
      {(['x', 'y', 'z'] as Axes[]).map((axis: Axes) => (
        <FormField key={axis}>
          <FieldLabel>{axis}</FieldLabel>
          <FieldInput
            name={axis}
            value={values[axis]}
            onChange={(e) => handleChange(e, axis)}
          />
          {errors[axis] && <FieldError>{errors[axis]}</FieldError>}
        </FormField>
      ))}
      <FormButton
        type='submit'
        disabled={Object.values(errors).some(item => item !== null)}
        onClick={handleSubmit}
      >
        {selectedVector ? 'Update' : 'Draw'}
      </FormButton>
    </StyledVectorForm>
  );
};

export default VectorForm;
