#![allow(unused_imports)]
#![allow(dead_code)]
#![allow(non_upper_case_globals)]
#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
pub mod r300;
use latex_expr_parser::{ASTNode, ASTNodeType, TokenKind};
use r300::R300;
use serde::Serialize;
use serde_wasm_bindgen::from_value;
use std::{collections::HashMap, ops::Mul};
use wasm_bindgen::prelude::*;

// TODO: this duplication is not my favorite
#[derive(Debug, Serialize)]
pub struct AstNodeWithValue {
    start: usize,
    end: usize,
    value: R300,
    r#type: AstNodeWithValueType,
}

#[derive(Debug, Serialize)]
pub enum AstNodeWithValueType {
    Identifier {
        name: String,
    },
    Int,
    BinaryOpNode {
        op: TokenKind,
        left: Box<AstNodeWithValue>,
        right: Box<AstNodeWithValue>,
    },
    UnaryOpNode {
        op: TokenKind,
        operand: Box<AstNodeWithValue>,
    },
}

#[wasm_bindgen]
pub fn find_identifiers(expr: &str) -> Vec<String> {
    let ast = serde_json::from_str::<ASTNode>(expr).unwrap();
    let mut identifiers = Vec::new();
    find_ast_identifiers(&ast, &mut identifiers);
    identifiers
}

pub fn find_ast_identifiers(ast: &ASTNode, identifiers: &mut Vec<String>) {
    match &ast.r#type {
        ASTNodeType::Identifier { name } => identifiers.push(name.clone()),
        ASTNodeType::BinaryOpNode { left, right, op: _ } => {
            find_ast_identifiers(&left, identifiers);
            find_ast_identifiers(&right, identifiers);
        }
        ASTNodeType::UnaryOpNode { operand, op: _ } => {
            find_ast_identifiers(&operand, identifiers);
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
    match &ast.r#type {
        ASTNodeType::Int { value } => AstNodeWithValue {
            start: ast.start,
            end: ast.end,
            value: R300::new(*value as f64, 0),
            r#type: AstNodeWithValueType::Int,
        },
        ASTNodeType::Identifier { name } => AstNodeWithValue {
            start: ast.start,
            end: ast.end,
            value: vars[name].clone(),
            r#type: AstNodeWithValueType::Identifier { name: name.clone() },
        },
        ASTNodeType::BinaryOpNode { op, left, right } => {
            let left = calculate_ast_expression(&left, vars);
            let right = calculate_ast_expression(&right, vars);
            let left_val = left.value;
            let right_val = right.value;
            let value = match op {
                TokenKind::Plus => left_val.add(right_val),
                TokenKind::Minus => left_val.sub(right_val),
                TokenKind::Multiply => left_val.mul(right_val),
                TokenKind::Dot => left_val.dot(right_val),
                TokenKind::Wedge => left_val.wedge(right_val),
                TokenKind::Frac => left_val.divide(right_val),
                _ => panic!("Unsupported binary operator: {:?}", op),
            };
            AstNodeWithValue {
                start: ast.start,
                end: ast.end,
                value,
                r#type: AstNodeWithValueType::BinaryOpNode {
                    op: *op,
                    left: Box::new(left),
                    right: Box::new(right),
                },
            }
        }
        ASTNodeType::UnaryOpNode { op, operand } => {
            let operand = calculate_ast_expression(&operand, vars);
            let operand_val = operand.value;
            let value = match op {
                TokenKind::Plus => operand_val,
                TokenKind::Minus => -1.0 * operand_val,
                _ => panic!("Unsupported unary operator: {:?}", op),
            };
            AstNodeWithValue {
                start: ast.start,
                end: ast.end,
                value,
                r#type: AstNodeWithValueType::UnaryOpNode {
                    op: *op,
                    operand: Box::new(operand),
                },
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_ast_expression() {
        let ast = ASTNode {
            start: 0,
            end: 4,
            r#type: ASTNodeType::BinaryOpNode {
                op: TokenKind::Plus,
                left: Box::new(ASTNode {
                    start: 0,
                    end: 0,
                    r#type: ASTNodeType::Identifier {
                        name: "a".to_string(),
                    },
                }),
                right: Box::new(ASTNode {
                    start: 4,
                    end: 4,
                    r#type: ASTNodeType::Identifier {
                        name: "b".to_string(),
                    },
                }),
            },
        };
        let mut vars = HashMap::new();
        vars.insert("a".to_string(), R300::vector(1.0, 0.0, 0.0));
        vars.insert("b".to_string(), R300::vector(2.0, 0.0, 0.0));
        let result = calculate_ast_expression(&ast, &vars);

        insta::assert_debug_snapshot!(result);
    }
}
