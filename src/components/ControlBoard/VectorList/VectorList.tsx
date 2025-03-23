import { StyledVectorList, ListItem } from './VectorList.styles';
import { SelectedVector } from '../ControlBoard';
import { ThreeJSMultiVector } from '../../types';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import styled from 'styled-components';

export const RedXButton = styled.button`
  all: unset; /* Remove default button styles */
  background-color: #633434;
  color: #ff9999;
  font-size: 11px;
  font-weight: bold;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto; /* Push to the right */
  opacity: 0.7;
  transition: all 0.2s ease;

  &:hover {
    background-color: #8b3232;
    color: #ffffff;
    opacity: 1;
  }
`;

type Props = {
  vectors: ThreeJSMultiVector[];
  selectedVector: SelectedVector | null;
  onSelectVector: (idx: number) => void;
  onDeleteVector: (idx: number) => void;
};

const VectorList = ({
  vectors,
  selectedVector,
  onSelectVector,
  onDeleteVector,
}: Props) => {
  const renderLatex = (latex: string) => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      return `<span style="color:red;">Error rendering LaTeX</span>`;
    }
  };

  return (
    <StyledVectorList>
      {vectors.map((vector, id) => (
        <ListItem
          key={id}
          isCurrent={selectedVector ? selectedVector.idx === id : false}
          onClick={() => onSelectVector(id)}
        >
          <span dangerouslySetInnerHTML={{ __html: renderLatex(vector.name) }} />
          <RedXButton
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onDeleteVector(id);
            }}
          >×</RedXButton>
        </ListItem>
      ))}
    </StyledVectorList>
  );
};

export default VectorList;
