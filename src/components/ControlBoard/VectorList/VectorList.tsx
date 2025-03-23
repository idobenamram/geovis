import { StyledVectorList, ListItem } from './VectorList.styles';
import { SelectedVector } from '../ControlBoard';
import { ThreeJSMultiVector } from '../../types';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
          <button
            className="ml-auto p-1 rounded-full hover:bg-gray-700 transition-colors"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              onDeleteVector(id);
            }}
          />
        </ListItem>
      ))}
    </StyledVectorList>
  );
};

export default VectorList;
