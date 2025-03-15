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
  onVectorAdd?: (name: string, value: R300) => void;
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
      const value = R300.fromJson(binOp.value);
      const treeNode: TreeNode = {
        name: `${binOp.op}`,
        nodeId: `binary-${binOp.op}-${binOp.left}-${binOp.right}`,
        value: value,
        attributes: {
          value: value.display()
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
      const value = R300.fromJson(unaryOp.value);
      const treeNode: TreeNode = {
        name: `${unaryOp.op}`,
        nodeId: `unary-${unaryOp.op}-${unaryOp.operand}`,
        value: value,
        attributes: {
          value: value.display()
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
      const int = node.Int;
      const value = R300.fromJson(int.value);
      return {
        name: `${int.value}`,
        nodeId: `int-${int.value}`,
        value: value,
        attributes: {
          value: value.display()
        }
      };
    }
    if ('Identifier' in node) {
      const identifier = node.Identifier;
      const value = R300.fromJson(identifier.value);
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