export interface SerializedR300 {
    mvec: number[];
}

export interface BinaryOperator {
    BinaryOpNode: {
        op: string;
        left: ASTNode;
        right: ASTNode;
        value: SerializedR300,
    }
}

export interface UnaryOperator {
    UnaryOpNode: {
        op: string;
        operand: ASTNode;
        value: SerializedR300,
    }
}

export interface Identifier {
    Identifier: {
        name: string;
        value: SerializedR300;
    }
}

export interface Int {
    Int: {
        value: SerializedR300;
    }
}

export type ASTNode = {
    start: number;
    end: number;
    type: BinaryOperator | UnaryOperator | Identifier | Int;
}

export interface ThreeJSMultiVector {
    vector: THREE.Object3D;
    name: string;
}