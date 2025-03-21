export interface SerializedR300 {
    mvec: number[];
}

export interface BinaryOperator {
    BinaryOpNode: {
        op: string;
        left: ASTNode;
        right: ASTNode;
    }
}

export interface UnaryOperator {
    UnaryOpNode: {
        op: string;
        operand: ASTNode;
    }
}

export interface Identifier {
    Identifier: {
        name: string;
    }
}

export interface Int {
    Int: {}
}

export type ASTNode = {
    start: number;
    end: number;
    value: SerializedR300,
    type: BinaryOperator | UnaryOperator | Identifier | Int;
}

export interface ThreeJSMultiVector {
    vector: THREE.Object3D;
    name: string;
}