import React, { useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { parse } from "@unified-latex/unified-latex-util-parse";

interface LatexEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const LatexEditor: React.FC<LatexEditorProps> = ({ value, onChange }) => {
    const [ast, setAst] = useState<any>(null);

    // Called when the user types in the textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = e.target.value;
        onChange(input);
        try {
            const parsedAST = parse(input);
            setAst(parsedAST);
        } catch (error: any) {
            // On parse error, save the error message
            setAst({ error: error.message });
        }
    };

    // Use KaTeX to convert the LaTeX input to HTML.
    let renderedHTML = "";
    try {
        renderedHTML = katex.renderToString(value, {
            throwOnError: false,
            displayMode: true,
        });
    } catch (error) {
        renderedHTML = `<span style="color:red;">Error rendering LaTeX</span>`;
    }

    return (
        <div className="latex-editor-container">
            <div className="latex-header">
                <h1>Interactive LaTeX Editor</h1>
                <p>Type your LaTeX equations in the editor and see them rendered in real-time.</p>
                <div className="example-equations">
                    <h3>Example equations:</h3>
                    <ul>
                        <li><code>{'\\frac{a+b}{c}'}</code> - Simple fraction</li>
                        <li><code>{'\\int_{a}^{b} x^2 dx'}</code> - Integral</li>
                        <li><code>{'\\sum_{i=1}^{n} i^2'}</code> - Summation</li>
                    </ul>
                </div>
            </div>
            <div className="latex-content">
                <div className="latex-input">
                    <h2>Editor</h2>
                    <textarea
                        value={value}
                        onChange={handleInputChange}
                        placeholder="Enter LaTeX here..."
                        spellCheck="false"
                    />
                </div>
                <div className="latex-output">
                    <div className="preview-section">
                        <h2>Preview</h2>
                        <div className="preview-box" dangerouslySetInnerHTML={{ __html: renderedHTML }} />
                    </div>
                    <div className="ast-section">
                        <h2>AST Preview</h2>
                        <pre className="ast-box">
                            {JSON.stringify(ast, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LatexEditor;