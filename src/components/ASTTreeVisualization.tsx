import React, { useState, useCallback } from 'react';
import Tree, { RawNodeDatum, } from 'react-d3-tree';

import { ASTNode } from './types';

interface TreeNode extends RawNodeDatum {
  nodeId: string;
}

interface ASTTreeVisualizationProps {
  ast: [any[], ASTNode | null, any[]] | null;
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
  const convertASTToTreeData = (node: ASTNode | null): TreeNode | null => {
    if (!node) return null;

    const nodeId = node.name || `${node.type}-${node.operator || ''}`;
    const treeNode: TreeNode = {
      name: node.type,
      nodeId: nodeId,
      attributes: {},
    };

    // Add operator or name as attributes if they exist
    if (node.operator) {
      treeNode.attributes = { ...treeNode.attributes, operator: node.operator };
    }
    if (node.name) {
      treeNode.attributes = { ...treeNode.attributes, name: node.name };
    }

    // Add children if they exist
    const children: TreeNode[] = [];
    if (node.left) {
      const leftNode = convertASTToTreeData(node.left);
      if (leftNode) children.push(leftNode);
    }
    if (node.right) {
      const rightNode = convertASTToTreeData(node.right);
      if (rightNode) children.push(rightNode);
    }

    if (children.length > 0) {
      treeNode.children = children;
    }

    return treeNode;
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

  // Extract the actual AST node from the array structure
  const actualASTNode = ast ? ast[1] : null;
  const treeData = convertASTToTreeData(actualASTNode);

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