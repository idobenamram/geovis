import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import ThreeJSEnvironment from './ThreeJSEnvironment';
import LatexVisualizer from './LatexVisualizer';
import ReactDOM from 'react-dom/client';

interface DocumentationProps {
  markdownContent: string;
  onCodeClick: (code: string) => void;
}

const Documentation: React.FC<DocumentationProps> = ({ markdownContent, onCodeClick }) => {
  const [renderedContent, setRenderedContent] = useState('');
  const [threeJSExamples, setThreeJSExamples] = useState<Map<string, string>>(new Map());
  const [latexExpressions, setLatexExpressions] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const examples = new Map<string, string>();
    const latexExprs = new Map<string, string>();
    const renderer = new marked.Renderer();

    renderer.code = (code: string, language?: string) => {
      if (language === 'animate') {
        const containerId = `preview-${Math.random().toString(36).substring(2, 9)}`;
        examples.set(containerId, code);

        const highlightedCode = hljs.highlight(code, { language: 'javascript' }).value;
        return `
          <div class="preview-wrapper" data-code="${containerId}">
            <div id="${containerId}" class="preview-container"></div>
            <pre><code class="language-javascript">${highlightedCode}</code></pre>
            <button class="run-button" data-code="${containerId}">Edit in IDE</button>
          </div>
        `;
      }

      // Handle LaTeX expressions with visualization
      if (language === 'latexvis') {
        const containerId = `latex-${Math.random().toString(36).substring(2, 9)}`;
        latexExprs.set(containerId, code);

        return `
          <div class="latex-wrapper" data-latex="${containerId}">
            <div id="${containerId}" class="latex-container"></div>
          </div>
        `;
      }

      // Handle other code blocks
      const highlightedCode = language && hljs.getLanguage(language)
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value;

      return `<pre><code class="hljs ${language || ''}">${highlightedCode}</code></pre>`;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true
    });

    const renderContent = async () => {
      try {
        const content = await Promise.resolve(marked(markdownContent));
        setRenderedContent(content as string);
        setThreeJSExamples(examples);
        setLatexExpressions(latexExprs);

        // If there's only one example, automatically show it in the editor
        if (examples.size === 1) {
          const firstExample = Array.from(examples.values())[0];
          onCodeClick(firstExample);
        }
      } catch (error) {
        console.error('Error rendering markdown:', error);
        setRenderedContent('Error rendering content');
      }
    };

    renderContent();
  }, [markdownContent, onCodeClick]);

  useEffect(() => {
    // Add click handlers for code blocks
    const codeBlocks = document.querySelectorAll('.preview-wrapper');
    codeBlocks.forEach(block => {
      const containerId = block.getAttribute('data-code');
      if (containerId) {
        const code = threeJSExamples.get(containerId);
        if (code) {
          // Render Three.js example
          const container = document.getElementById(containerId);
          if (container) {
            const threeJSEnv = <ThreeJSEnvironment code={code} containerId={containerId} />;
            ReactDOM.createRoot(container).render(threeJSEnv);
          }

          // Add click handler to the edit button
          const editButton = block.querySelector(`button[data-code="${containerId}"]`);
          if (editButton) {
            editButton.addEventListener('click', (e) => {
              e.stopPropagation();
              onCodeClick(code);
            });
          }
        }
      }
    });

    // Render LaTeX expressions with visualizations
    const latexBlocks = document.querySelectorAll('.latex-wrapper');
    latexBlocks.forEach(block => {
      const containerId = block.getAttribute('data-latex');
      if (containerId) {
        const latex = latexExpressions.get(containerId);
        if (latex) {
          const container = document.getElementById(containerId);
          if (container) {
            const latexVisualizer = <LatexVisualizer latex={latex} />;
            ReactDOM.createRoot(container).render(latexVisualizer);
          }
        }
      }
    });
  }, [renderedContent, threeJSExamples, latexExpressions, onCodeClick]);

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default Documentation; 