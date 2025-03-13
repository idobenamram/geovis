import React, { useState, useCallback } from 'react';
import Tree, { RawNodeDatum, } from 'react-d3-tree';

import { ASTNode } from './types';
import { R300 } from 'geo-calc';

interface TreeNode extends RawNodeDatum {
  nodeId: string;
  value: R300;
}

interface ASTTreeVisualizationProps {
  ast: ASTNode | null;
  onVectorAdd?: (name: string) => void;
  onVectorRemove?: (name: string) => void;
}

const ASTTreeVisualization: React.FC<ASTTreeVisualizationProps> = ({
  ast,
  onVectorAdd,
  onVectorRemove
}) => {
  // Track which nodes have vectors
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());

  // Convert AST to the format expected by react-d3-tree
  const convertASTToTreeData = (node: ASTNode): TreeNode | null => {
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

    if ('BinaryOpNode' in node) {
      const binOp = node.BinaryOpNode;
      const treeNode: TreeNode = {
        name: `${binOp.op}`,
        nodeId: `binary-${binOp.op}-${binOp.left}-${binOp.right}`,
        value: binOp.value,
        attributes: {
          value: binOp.value.display()
        }
      };

      // Add children
      const children: TreeNode[] = [];
      const leftNode = convertASTToTreeData(binOp.left);
      if (leftNode) children.push(leftNode);
      const rightNode = convertASTToTreeData(binOp.right);
      if (rightNode) children.push(rightNode);
      if (children.length > 0) {
        treeNode.children = children;
      }

      return treeNode;
    }

    if ('UnaryOpNode' in node) {
      const unaryOp = node.UnaryOpNode;
      const treeNode: TreeNode = {
        name: `${unaryOp.op}`,
        nodeId: `unary-${unaryOp.op}-${unaryOp.operand}`,
        value: unaryOp.value,
        attributes: {
          value: unaryOp.value.display()
        }
      };

      // Add child
      const operandNode = convertASTToTreeData(unaryOp.operand);
      if (operandNode) {
        treeNode.children = [operandNode];
      }

      return treeNode;
    }

    if ('Int' in node) {
      return {
        name: `${node.Int}`,
        nodeId: `int-${node.Int}`,
        value: node.value,
        attributes: {
          value: node.value.display()
        }
      };
    }
    if ('Identifier' in node) {
      return {
        name: node.Identifier,
        nodeId: `id-${node.Identifier}`,
        value: node.value,
        attributes: {
          value: node.value.display()
        }
      };
    }


    return null;
  };

  const handleNodeClick = useCallback((nodeDatum: TreeNode) => {
    // Only handle clicks for single-letter identifiers
    const name = nodeDatum.attributes?.name;
    if (nodeDatum.name !== 'Identifier' || !name || typeof name !== 'string' || name.length !== 1) {
      return;
    }

    const nodeId = nodeDatum.nodeId;

    setActiveNodes(prev => {
      const newActiveNodes = new Set(prev);
      if (newActiveNodes.has(nodeId as string)) {
        newActiveNodes.delete(nodeId as string);
        onVectorRemove?.(name);
      } else {
        newActiveNodes.add(nodeId as string);
        onVectorAdd?.(name);
      }
      return newActiveNodes;
    });
  }, [onVectorAdd, onVectorRemove]);

  if (!ast) {
    return <div>No AST data available</div>;
  }

  const treeData = convertASTToTreeData(ast);

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
        renderCustomNodeElement={({ nodeDatum, toggleNode }) => {
          const node = nodeDatum as RawNodeDatum as TreeNode;
          const name = node.attributes?.name;
          const isIdentifier = node.name === 'Identifier' && name && typeof name === 'string' && name.length === 1;

          return (
            <g>
              <circle
                r="20"
                fill={activeNodes.has(node.nodeId) ? '#4CAF50' : '#88c999'}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(node);
                }}
                style={{ cursor: isIdentifier ? 'pointer' : 'default' }}
              />
              <text
                fill="black"
                strokeWidth="0.5"
                x="25"
                style={{ fontSize: '0.8rem' }}
                onClick={toggleNode}
              >
                {node.name}
              </text>
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
        }}
      />
    </div>
  );
};

export default ASTTreeVisualization; 