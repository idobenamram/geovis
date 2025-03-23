import React, { useState, useCallback, useRef, useEffect } from 'react';
import Tree, { RawNodeDatum, } from 'react-d3-tree';
import katex from "katex";

import { ASTNode } from './types';
import { R300 } from 'geo-calc';

interface TreeNode extends RawNodeDatum {
  nodeId: string;
  value: R300;
}

interface ASTTreeVisualizationProps {
  ast: ASTNode | null;
  input: string | null;
  onVectorAdd?: (name: string, value: R300) => void;
  onVectorRemove?: (name: string) => void;
}

interface TreeNodeElementProps {
  nodeDatum: RawNodeDatum;
  toggleNode: () => void;
  activeNodes: Set<string>;
  onNodeClick: (node: TreeNode) => void;
}

const TreeNodeElement: React.FC<TreeNodeElementProps> = ({ nodeDatum, toggleNode, activeNodes, onNodeClick }) => {
  const node = nodeDatum as RawNodeDatum as TreeNode;
  const name = node.attributes?.name;
  const isIdentifier = node.name === 'Identifier' && name && typeof name === 'string' && name.length === 1;
  const contentRef = useRef<HTMLDivElement>(null);

  // Use KaTeX to convert the LaTeX input to HTML
  let renderedHTML = "";
  try {
    renderedHTML = katex.renderToString(node.name, {
      throwOnError: false,
      displayMode: false,
    });
  } catch (error) {
    console.error('LaTeX rendering error:', error);
    renderedHTML = `<span style="color:red;">Error rendering LaTeX</span>`;
  }

  return (
    <g>
      <circle
        r="20"
        fill={activeNodes.has(node.nodeId) ? '#4CAF50' : '#88c999'}
        onClick={(e) => {
          e.stopPropagation();
          onNodeClick(node);
        }}
        style={{ cursor: isIdentifier ? 'pointer' : 'default' }}
      />
      <foreignObject x="15" y="-15" width={contentRef.current?.offsetWidth ?? 100} height="30">
        <div
          ref={contentRef}
          dangerouslySetInnerHTML={{ __html: renderedHTML }}
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: 'black',
            whiteSpace: 'nowrap'
          }}
        />
      </foreignObject>
      {node.attributes && (
        Object.entries(node.attributes).map(([key, value], i) => (
          <text
            key={key}
            fill="#666"
            x="25"
            y={(i + 1) * 15 + 5}
            style={{ fontSize: '0.7rem' }}
          >
            {`${key}: ${value}`}
          </text>
        ))
      )}
    </g>
  );
};

const ASTTreeVisualization: React.FC<ASTTreeVisualizationProps> = ({
  ast,
  input,
  onVectorAdd,
  onVectorRemove
}) => {
  // Track which nodes have vectors
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());

  // Convert AST to the format expected by react-d3-tree
  const convertASTToTreeData = (node: ASTNode, input: string): TreeNode | null => {
    if (!node || typeof node !== 'object') return null;

    // Handle error case
    if ('error' in node && typeof node.error === 'string') {
      return {
        name: 'Error',
        nodeId: 'error',
        value: R300.vector(0.0, 0.0, 0.0),
        attributes: {
          message: node.error
        }
      };
    }

    if ('BinaryOpNode' in node.type) {
      const binOp = node.type.BinaryOpNode;
      const value = R300.fromJson(node.value);
      const treeNode: TreeNode = {
        name: `${input.slice(node.start, node.end + 1)}`,
        nodeId: `binary-${binOp.op}-${binOp.left}-${binOp.right}`,
        value: value,
        attributes: {
          value: value.display()
        }
      };

      // Add children
      const children: TreeNode[] = [];
      const leftNode = convertASTToTreeData(binOp.left, input);
      if (leftNode) children.push(leftNode);
      const rightNode = convertASTToTreeData(binOp.right, input);
      if (rightNode) children.push(rightNode);
      if (children.length > 0) {
        treeNode.children = children;
      }

      return treeNode;
    }

    if ('UnaryOpNode' in node.type) {
      const unaryOp = node.type.UnaryOpNode;
      const value = R300.fromJson(node.value);
      const treeNode: TreeNode = {
        name: `${input.slice(node.start, node.end + 1)}`,
        nodeId: `unary-${unaryOp.op}-${unaryOp.operand}`,
        value: value,
        attributes: {
          value: value.display()
        }
      };

      // Add child
      const operandNode = convertASTToTreeData(unaryOp.operand, input);
      if (operandNode) {
        treeNode.children = [operandNode];
      }

      return treeNode;
    }

    if ('Int' in node.type) {
      const value = R300.fromJson(node.value);
      return {
        name: `${input.slice(node.start, node.end + 1)}`,
        nodeId: `int-${node.value}`,
        value: value,
        attributes: {
          value: value.display()
        }
      };
    }
    if ('Identifier' in node.type) {
      const identifier = node.type.Identifier;
      const value = R300.fromJson(node.value);
      return {
        name: identifier.name,
        nodeId: `id-${identifier.name}`,
        value: value,
        attributes: {
          value: value.display()
        }
      };
    }


    return null;
  };

  const handleNodeClick = useCallback((nodeDatum: TreeNode) => {
    if (!nodeDatum.value.isScalar() && !nodeDatum.value.isVector() && !nodeDatum.value.isBivector()) {
      return;
    }

    const name = nodeDatum.name;
    const nodeId = nodeDatum.nodeId;
    const value = nodeDatum.value;

    setActiveNodes(prev => {
      const newActiveNodes = new Set(prev);
      if (newActiveNodes.has(nodeId as string)) {
        newActiveNodes.delete(nodeId as string);
        onVectorRemove?.(name);
      } else {
        newActiveNodes.add(nodeId as string);
        onVectorAdd?.(name, value);
      }
      return newActiveNodes;
    });
  }, [onVectorAdd, onVectorRemove]);

  if (!ast) {
    return <div>No AST data available</div>;
  }

  const treeData = convertASTToTreeData(ast, input ?? '');

  if (!treeData) {
    return <div>No AST data available</div>;
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Tree
        data={treeData}
        orientation="vertical"
        pathFunc="diagonal"
        translate={{ x: 200, y: 50 }}
        nodeSize={{ x: 150, y: 80 }}
        separation={{ siblings: 2, nonSiblings: 2.5 }}
        renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
          <TreeNodeElement
            nodeDatum={nodeDatum}
            toggleNode={toggleNode}
            activeNodes={activeNodes}
            onNodeClick={handleNodeClick}
          />
        )}
      />
    </div>
  );
};

export default ASTTreeVisualization; 