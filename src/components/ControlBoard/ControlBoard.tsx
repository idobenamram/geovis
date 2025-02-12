import { useState } from 'react';

import { StyledControlBoard, Section, SectionHeader, SectionContent } from './ControlBoard.styles';
import { ThreeJSMultiVector } from '../types';

import VectorList from './VectorList/VectorList';
import VectorForm from './VectorForm/VectorForm';

type Props = {
  vectors: ThreeJSMultiVector[];
  onSave: (idx: number | null, coords: SelectedVector['coords']) => void;
  onDelete: (idx: number) => void;
};

export type SelectedVector = {
  idx: number;
  coords: { x: number; y: number; z: number };
};

const ControlBoard = ({ vectors, onSave, onDelete }: Props) => {
  const [selectedVector, setSelectedVector] = useState<SelectedVector | null>(null);
  const [isVectorListOpen, setIsVectorListOpen] = useState(true);
  const [isVectorFormOpen, setIsVectorFormOpen] = useState(true);

  const handleSelectVector = (idx: number) => {
    if (selectedVector && selectedVector.idx === idx) {
      setSelectedVector(null);
    } else {
      const foundVector = vectors[idx];
      setSelectedVector({ idx, coords: { ...foundVector.vector.userData.target } });
    }
  };

  const handleDeleteVector = (idx: number) => {
    if (selectedVector && selectedVector.idx === idx) {
      setSelectedVector(null);
    }
    onDelete(idx);
  };

  const handleSave = (coords: SelectedVector['coords']) => {
    const idx = selectedVector ? selectedVector.idx : null;
    onSave(idx, coords);
  };

  return (
    <StyledControlBoard>
      <Section>
        <SectionHeader onClick={() => setIsVectorListOpen(!isVectorListOpen)}>
          <span>Vectors</span>
          <span className={`toggle-icon ${!isVectorListOpen ? 'collapsed' : ''}`}>▼</span>
        </SectionHeader>
        <SectionContent isOpen={isVectorListOpen}>
          <VectorList
            vectors={vectors}
            selectedVector={selectedVector}
            onSelectVector={handleSelectVector}
            onDeleteVector={handleDeleteVector}
          />
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader onClick={() => setIsVectorFormOpen(!isVectorFormOpen)}>
          <span>Add new vector</span>
          <span className={`toggle-icon ${!isVectorFormOpen ? 'collapsed' : ''}`}>▼</span>
        </SectionHeader>
        <SectionContent isOpen={isVectorFormOpen}>
          <VectorForm selectedVector={selectedVector} onSave={handleSave} />
        </SectionContent>
      </Section>
    </StyledControlBoard>
  );
};

export default ControlBoard;
