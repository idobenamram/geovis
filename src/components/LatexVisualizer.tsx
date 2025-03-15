import React, { useState, useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { parse_latex } from 'latex-expr-parser';
import { find_identifiers, R300, calculate_expression } from 'geo-calc';
import ASTTreeVisualization from './ASTTreeVisualization';
import ThreeJs3DSpace, { ThreeJs3DSpaceRef } from './ThreeJs3DSpace';

interface LatexVisualizerProps {
    latex: string;
    className?: string;
}

enum VisualizationMode {
    NONE = 'none',
    THREEJS = 'threejs',
    AST = 'ast'
}

const LatexVisualizer: React.FC<LatexVisualizerProps> = ({ latex, className }) => {
    const [ast, setAst] = useState<any>(null);
    const [identifiers, setIdentifiers] = useState<[string, R300][]>([]);
    const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>(VisualizationMode.NONE);
    const threejsRef = useRef<ThreeJs3DSpaceRef>(null);

    // Parse LaTeX and create AST
    useEffect(() => {
        try {
            const parsedAst = parse_latex(latex);
            const ids = find_identifiers(parsedAst);
            const uniqueIds = new Set(ids);

            // Create random vectors for identifiers
            const newIdentifiers: [string, R300][] = [];
            uniqueIds.forEach(id => {
                const x = Math.random() * 10 - 5; // Range: -5 to 5
                const y = Math.random() * 10 - 5;
                const z = Math.random() * 10 - 5;
                const vector = R300.vector(x, y, z);
                newIdentifiers.push([id, vector]);
            });

            setIdentifiers(newIdentifiers);

            // Calculate the expression with the random vectors
            const vars = Object.fromEntries(newIdentifiers.map(([key, value]) => [key, value.toJson()]));
            const calculated = JSON.parse(calculate_expression(parsedAst, vars));
            setAst(calculated);
        } catch (error: any) {
            setAst({ error: error.message });
        }
    }, [latex]);

    // Render LaTeX using KaTeX
    let renderedHTML = "";
    try {
        renderedHTML = katex.renderToString(latex, {
            throwOnError: false,
            displayMode: true,
        });
    } catch (error) {
        renderedHTML = `<span style="color:red;">Error rendering LaTeX</span>`;
    }

    // Handle vector visualization
    const handleVectorAdd = (name: string, value: R300) => {
        threejsRef.current?.addVector(name, value);
    };

    const handleVectorRemove = (name: string) => {
        threejsRef.current?.removeVector(name);
    };

    // Toggle visualization mode
    const toggleThreeJS = () => {
        setVisualizationMode(
            visualizationMode === VisualizationMode.THREEJS
                ? VisualizationMode.NONE
                : VisualizationMode.THREEJS
        );
    };

    const toggleAST = () => {
        setVisualizationMode(
            visualizationMode === VisualizationMode.AST
                ? VisualizationMode.NONE
                : VisualizationMode.AST
        );
    };

    return (
        <div className={`latex-visualizer ${className || ''}`}>
            <div className="latex-header-container">
                <div className="latex-display">
                    <div className="latex-content" dangerouslySetInnerHTML={{ __html: renderedHTML }} />
                </div>
                <div className="visualization-controls">
                    <button
                        className={`viz-button ${visualizationMode === VisualizationMode.THREEJS ? 'active' : ''}`}
                        onClick={toggleThreeJS}
                    >
                        3D Visualization
                    </button>
                    <button
                        className={`viz-button ${visualizationMode === VisualizationMode.AST ? 'active' : ''}`}
                        onClick={toggleAST}
                    >
                        AST
                    </button>
                </div>
            </div>

            {visualizationMode !== VisualizationMode.NONE && (
                <div className="visualization-container">
                    {visualizationMode === VisualizationMode.THREEJS && (
                        <div className="threejs-container">
                            <ThreeJs3DSpace ref={threejsRef} />
                        </div>
                    )}

                    {visualizationMode === VisualizationMode.AST && (
                        <div className="ast-container">
                            <ASTTreeVisualization
                                ast={ast}
                                onVectorAdd={handleVectorAdd}
                                onVectorRemove={handleVectorRemove}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LatexVisualizer; 