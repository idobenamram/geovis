#![allow(unused_imports)]
#![allow(dead_code)]
#![allow(non_upper_case_globals)]
#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
pub mod r300;
use latex_expr_parser::{ASTNode, TokenKind};
use r300::R300;
use serde::Serialize;
use serde_wasm_bindgen::from_value;
use std::{collections::HashMap, ops::Mul};
use wasm_bindgen::prelude::*;


// TODO: this duplication is not my favorite
#[derive(Debug, Serialize)]
pub enum AstNodeWithValue {
    Identifier {
        name: String,
        value: R300,
    },
    Int {
        value: R300,
    },
    BinaryOpNode {
        op: TokenKind,
        left: Box<AstNodeWithValue>,
        right: Box<AstNodeWithValue>,
        value: R300,
    },
    UnaryOpNode {
        op: TokenKind,
        operand: Box<AstNodeWithValue>,
        value: R300,
    },
}

impl AstNodeWithValue {
    pub fn value(&self) -> R300 {
        match self {
            AstNodeWithValue::Int { value } => value.clone(),
            AstNodeWithValue::Identifier { value, .. } => value.clone(),
            AstNodeWithValue::BinaryOpNode { value, .. } => value.clone(),
            AstNodeWithValue::UnaryOpNode { value, .. } => value.clone(),
        }
    }
}

#[wasm_bindgen]
pub fn find_identifiers(expr: &str) -> Vec<String> {
    let ast = serde_json::from_str::<ASTNode>(expr).unwrap();
    let mut identifiers = Vec::new();
    find_ast_identifiers(&ast, &mut identifiers);
    identifiers
}

pub fn find_ast_identifiers(ast: &ASTNode, identifiers: &mut Vec<String>) {
    match ast {
        ASTNode::Identifier { name } => identifiers.push(name.clone()),
        ASTNode::BinaryOpNode { left, right, op: _ } => {
            find_ast_identifiers(left, identifiers);
            find_ast_identifiers(right, identifiers);
        }
        ASTNode::UnaryOpNode { operand, op: _ } => {
            find_ast_identifiers(operand, identifiers);
        }
        _ => {}
    }
}

#[wasm_bindgen]
pub fn calculate_expression(expr: &str, vars: JsValue) -> String {
    let ast = serde_json::from_str::<ASTNode>(expr).unwrap();
    let vars: HashMap<String, R300> = from_value(vars).unwrap();
    let calculated = calculate_ast_expression(&ast, &vars);
    serde_json::to_string(&calculated).unwrap()
}

fn calculate_ast_expression(ast: &ASTNode, vars: &HashMap<String, R300>) -> AstNodeWithValue {
    match ast {
        ASTNode::Int { value } => AstNodeWithValue::Int {
            value: R300::new(*value as f64, 0),
        },
        ASTNode::Identifier { name } => AstNodeWithValue::Identifier {
            name: name.clone(),
            value: vars[name].clone(),
        },
        ASTNode::BinaryOpNode { op, left, right } => {
            let left = calculate_ast_expression(left, vars);
            let right = calculate_ast_expression(right, vars);
            let left_val = left.value();
            let right_val = right.value();
            let value = match op {
                TokenKind::Plus => left_val.add(right_val),
                TokenKind::Minus => left_val.sub(right_val),
                TokenKind::Multiply => left_val.mul(right_val),
                TokenKind::Dot => left_val.dot(right_val),
                TokenKind::Wedge => left_val.wedge(right_val),
                TokenKind::Frac => left_val.divide(right_val),
                _ => panic!("Unsupported binary operator: {:?}", op),
            };
            AstNodeWithValue::BinaryOpNode {
                op: *op,
                left: Box::new(left),
                right: Box::new(right),
                value,
            }
        }
        ASTNode::UnaryOpNode { op, operand } => {
            let operand = calculate_ast_expression(operand, vars);
            let operand_val = operand.value();
            let value = match op {
                TokenKind::Plus => operand_val,
                TokenKind::Minus => -1.0 * operand_val,
                _ => panic!("Unsupported unary operator: {:?}", op),
            };
            AstNodeWithValue::UnaryOpNode {
                op: *op,
                operand: Box::new(operand),
                value,
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_ast_expression() {
        let ast = ASTNode::BinaryOpNode {
            op: TokenKind::Plus,
            left: Box::new(ASTNode::Identifier {
                name: "a".to_string(),
            }),
            right: Box::new(ASTNode::Identifier {
                name: "b".to_string(),
            }),
        };
        let mut vars = HashMap::new();
        vars.insert("a".to_string(), R300::vector(1.0, 0.0, 0.0));
        vars.insert("b".to_string(), R300::vector(2.0, 0.0, 0.0));
        let result = calculate_ast_expression(&ast, &vars);

        insta::assert_debug_snapshot!(result);
    }
}
