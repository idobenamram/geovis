import { R300 } from "geo-calc";

export interface BinaryOperator {
    BinaryOpNode: {
        op: string;
        left: ASTNode;
        right: ASTNode;
        value: R300,
    }
}

export interface UnaryOperator {
    UnaryOpNode: {
        op: string;
        operand: ASTNode;
        value: R300,
    }
}

export interface Identifier {
    Identifier: string;
    value: R300
}

export interface Int {
    value: R300
}

export type ASTNode = BinaryOperator | UnaryOperator | Identifier | Int;

export interface ThreeJSMultiVector {
    vector: THREE.Object3D;
    name: string;
}