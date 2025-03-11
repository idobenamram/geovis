#![allow(unused_imports)]
#![allow(dead_code)]
#![allow(non_upper_case_globals)]
#![allow(non_snake_case)]
#![allow(non_camel_case_types)]
pub mod r300;
use latex_expr_parser::{ASTNode, Token, TokenKind};
use r300::R300;
use std::collections::HashMap;

pub fn calculate_ast_expression(ast: &ASTNode, vars: &HashMap<String, R300>) -> R300 {
    match ast {
        // ASTNode::Number(n) => R300::new(*n as f64, 0),
        ASTNode::Identifier { name } => vars[name].clone(),
        ASTNode::BinaryOpNode { op, left, right } => {
            let left_val = calculate_ast_expression(left, vars);
            let right_val = calculate_ast_expression(right, vars);
            match op.kind {
                TokenKind::Plus => left_val + right_val,
                TokenKind::Minus => left_val - right_val,
                TokenKind::Multiply => left_val * right_val,
                // TokenKind::Dot => left_val.dot(right_val),
                // TokenKind::Divide => left_val / right_val,
                _ => panic!("Unsupported binary operator: {:?}", op.kind),
            }
        }
        ASTNode::UnaryOpNode { op, operand } => {
            let operand_val = calculate_ast_expression(operand, vars);
            match op.kind {
                TokenKind::Plus => operand_val,
                TokenKind::Minus => -1.0 * operand_val,
                _ => panic!("Unsupported unary operator: {:?}", op.kind),
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
            op: Token::new(TokenKind::Plus, 0, 0),
            left: Box::new(ASTNode::Identifier { name: "a".to_string() }),
            right: Box::new(ASTNode::Identifier { name: "b".to_string() }),
        };
        let mut vars = HashMap::new();
        vars.insert("a".to_string(), R300::vector(1.0, 0.0, 0.0));
        vars.insert("b".to_string(), R300::vector(2.0, 0.0, 0.0));
        let result = calculate_ast_expression(&ast, &vars);
        assert_eq!(result, R300::vector(3.0, 0.0, 0.0));
    }
}