import React from 'react';
import Tree from 'react-d3-tree';

interface ASTNode {
  type: string;
  operator?: string;
  name?: string;
  left?: ASTNode;
  right?: ASTNode;
}

interface TreeNode {
  name: string;
  attributes?: Record<string, string>;
  children?: TreeNode[];
}

interface ASTTreeVisualizationProps {
  ast: [any[], ASTNode | null, any[]] | null;
}

const ASTTreeVisualization: React.FC<ASTTreeVisualizationProps> = ({ ast }) => {
  // Convert AST to the format expected by react-d3-tree
  const convertASTToTreeData = (node: ASTNode | null): TreeNode | null => {
    if (!node) return null;

    const treeNode: TreeNode = {
      name: node.type,
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
        renderCustomNodeElement={({ nodeDatum, toggleNode }) => (
          <g>
            <circle r="20" fill="#88c999" onClick={toggleNode} />
            <text
              fill="black"
              strokeWidth="0.5"
              x="25"
              style={{ fontSize: '0.8rem' }}
            >
              {nodeDatum.name}
            </text>
            {nodeDatum.attributes && (
              Object.entries(nodeDatum.attributes).map(([key, value], i) => (
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
        )}
      />
    </div>
  );
};

export default ASTTreeVisualization; 