import React, { useState, useRef, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { parse_latex } from "latex-expr-parser";
import { find_identifiers, R300, calculate_expression } from "geo-calc";
import ASTTreeVisualization from "./ASTTreeVisualization";
import ThreeJs3DSpace from "./ThreeJs3DSpace";

interface LatexEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const LatexEditor: React.FC<LatexEditorProps> = ({ value, onChange }) => {
    const [input, setInput] = useState<string>(value);
    const [ast, setAst] = useState<any>(null);
    const threejsRef = useRef<any>(null);
    const [identifiers, setIdentifiers] = useState<[string, R300][]>([]);

    const createIdentifiers = (ast: any) => {
        // Find all identifiers in the AST
        const ids = find_identifiers(ast);
        const uniqueIds = new Set(ids);

        // Create random vectors for new identifiers
        const identifiers: [string, R300][] = [];

        uniqueIds.forEach(id => {
            // Create a random vector for this identifier
            const x = Math.random() * 10 - 5; // Range: -5 to 5
            const y = Math.random() * 10 - 5;
            const z = Math.random() * 10 - 5;

            // Create an R300 vector and add it to the array of tuples
            const vector = R300.vector(x, y, z);
            identifiers.push([id, vector]);
        });


        // Update the identifiers map
        setIdentifiers(identifiers);
    }


    // Called when the user types in the textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = e.target.value;
        setInput(input);
        onChange(input);
        try {
            const ast = parse_latex(input);
            createIdentifiers(ast);
            const vars = Object.fromEntries(identifiers.map(([key, value]) => [key, value.toJson()]));
            console.log(ast);
            const calculated = JSON.parse(calculate_expression(ast, vars));
            console.log("calculated", calculated);
            setAst(calculated);
        } catch (error: any) {
            setAst({ error: error.message });
        }
    };

    // Use KaTeX to convert the LaTeX input to HTML
    let renderedHTML = "";
    try {
        renderedHTML = katex.renderToString(input, {
            throwOnError: false,
            displayMode: true,
        });
    } catch (error) {
        renderedHTML = `<span style="color:red;">Error rendering LaTeX</span>`;
    }

    const handleVectorAdd = (name: string, value: R300) => {
        threejsRef.current?.addVector(name, value);
    };

    const handleVectorRemove = (name: string) => {
        threejsRef.current?.removeVector(name);
    };

    return (
        <div className="latex-editor-container">
            <div className="latex-header">
                <h1>Interactive LaTeX Editor</h1>
                <p>Type your LaTeX equations in the editor and see them rendered in real-time with step-by-step breakdown.</p>
                <div className="example-equations">
                    <h3>Example equations:</h3>
                    <ul>
                        <li><code>{'\\frac{a+b}{c}'}</code> - Simple fraction</li>
                        <li><code>{'a \\wedge b'}</code> - Wedge product</li>
                    </ul>
                </div>
            </div>
            <div className="latex-content">
                <div className="editor-section">
                    <div className="latex-input">
                        <h2>Editor</h2>
                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Enter LaTeX here..."
                            spellCheck="false"
                        />
                    </div>
                    <div className="ast-section">
                        <h2>AST Preview</h2>
                        <pre className="ast-box">
                            {JSON.stringify(ast, null, 2)}
                        </pre>
                    </div>
                    <div className="threejs-section">
                        <h2>3D Visualization</h2>
                        <ThreeJs3DSpace ref={threejsRef} />
                    </div>
                </div>
                <div className="preview-section">
                    <div className="preview-box">
                        <h2>Preview</h2>
                        <div className="preview-content" dangerouslySetInnerHTML={{ __html: renderedHTML }} />
                    </div>
                    <div className="visualization-section">
                        <h2>AST Visualization</h2>
                        <ASTTreeVisualization
                            ast={ast}
                            input={input}
                            onVectorAdd={handleVectorAdd}
                            onVectorRemove={handleVectorRemove}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LatexEditor;