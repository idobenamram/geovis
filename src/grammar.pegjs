start
  = _ expression _

expression
  = binaryExpression
  / identifier

binaryExpression
  = left:identifier _ operator:binaryOperator _ right:identifier
  {
    return {
      type: "LogicalExpression",
      operator: operator,
      left: left,
      right: right
    };
  }

identifier
  = _ chars:[a-zA-Z]+ _
  {
    return {
      type: "Identifier",
      name: chars.join("")
    };
  }

binaryOperator
  = _ "\\" "wedge" _  { return "∧"; }
  / _ "+" _ { return "+"; }
  / _ "-" _ { return "-"; }
  / _ "\\cdot" _ { return "cdot"; }

_ "whitespace"
  = [ \t\n\r]*