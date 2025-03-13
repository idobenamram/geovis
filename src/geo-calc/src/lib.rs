#![allow(unused_imports)]
#![allow(dead_code)]
#![allow(non_upper_case_globals)]
#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
pub mod r300;
use latex_expr_parser::{ASTNode, TokenKind};
use r300::R300;
use serde_wasm_bindgen::from_value;
use std::{collections::HashMap, ops::Mul};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate_expression(expr: &str, vars: JsValue) -> R300 {
    let ast = serde_json::from_str::<ASTNode>(expr).unwrap();
    let vars: HashMap<String, R300> = from_value(vars).unwrap();
    calculate_ast_expression(&ast, &vars)
}

fn calculate_ast_expression(ast: &ASTNode, vars: &HashMap<String, R300>) -> R300 {
    match ast {
        ASTNode::Int { value } => R300::new(*value as f64, 0),
        ASTNode::Identifier { name } => vars[name].clone(),
        ASTNode::BinaryOpNode { op, left, right } => {
            let left_val = calculate_ast_expression(left, vars);
            let right_val = calculate_ast_expression(right, vars);
            match op {
                TokenKind::Plus => left_val.add(right_val),
                TokenKind::Minus => left_val.sub(right_val),
                TokenKind::Multiply => left_val.mul(right_val),
                TokenKind::Dot => left_val.dot(right_val),
                TokenKind::Wedge => left_val.wedge(right_val),
                TokenKind::Frac => left_val.divide(right_val),
                _ => panic!("Unsupported binary operator: {:?}", op),
            }
        }
        ASTNode::UnaryOpNode { op, operand } => {
            let operand_val = calculate_ast_expression(operand, vars);
            match op {
                TokenKind::Plus => operand_val,
                TokenKind::Minus => -1.0 * operand_val,
                _ => panic!("Unsupported unary operator: {:?}", op),
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
        assert_eq!(result, R300::vector(3.0, 0.0, 0.0));
    }
}
