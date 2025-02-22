export interface Token {
    kind: string;
    start: number;
    end: number;
}

export interface BinaryOperator {
    BinaryOpNode: {
        op: Token;
        left: ASTNode;
        right: ASTNode;
    }
}

export interface Identifier {
    Identifier: string;
}

export type ASTNode = BinaryOperator | Identifier;

export interface ThreeJSMultiVector {
    vector: THREE.Object3D;
    name: string;
}