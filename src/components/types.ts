export interface ASTNode {
  type: string;
  operator?: string;
  name?: string;
  left?: ASTNode;
  right?: ASTNode;
}

export interface ThreeJSMultiVector {
    vector: THREE.Object3D;
    name: string;
}