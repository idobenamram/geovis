import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Documentation from './components/Documentation';
import CodeEditor from './components/CodeEditor';
import LatexEditor from './components/LatexEditor';
import './style.css';

const App: React.FC = () => {
  const [currentCode, setCurrentCode] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [latexContent, setLatexContent] = useState('');
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    fetch('/content/transformations.md')
      .then(response => response.text())
      .then(content => setMarkdownContent(content))
      .catch(error => console.error('Error loading markdown:', error));
  }, []);

  useEffect(() => {
    fetch('/content/ga_equations.md')
      .then(response => response.text())
      .then(content => setLatexContent(content))
      .catch(error => console.error('Error loading markdown:', error));
  }, []);

  const handleCodeClick = (code: string) => {
    setCurrentCode(code);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const container = document.querySelector('.content-wrapper');
    const editor = document.querySelector('.editor-panel');

    if (container && editor) {
      const containerRect = container.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const containerWidth = containerRect.width;

      // Calculate width as a percentage of container
      const widthPercentage = (newWidth / containerWidth) * 100;

      // Limit the editor width between 20% and 80%
      if (widthPercentage >= 20 && widthPercentage <= 80) {
        editor.setAttribute('style', `width: ${100 - widthPercentage}%`);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <Router>
      <div className="app">
        <nav className="top-nav">
          <div className="nav-content">
            <div className="nav-left">
              <Link to="/" className="logo">Three.js Interactive Docs</Link>
            </div>
            <div className="nav-right">
              <Link to="/" className="nav-link">Three.js Examples</Link>
              <Link to="/latex-docs" className="nav-link">LaTeX Content</Link>
              <Link to="/latex" className="nav-link">LaTeX Editor</Link>
            </div>
          </div>
        </nav>

        <div className="main-container">
          <div className="content-wrapper">
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <div className="docs-content">
                      <Documentation
                        markdownContent={markdownContent}
                        onCodeClick={handleCodeClick}
                      />
                    </div>
                    <div
                      className={`resizer ${isResizing ? 'resizing' : ''}`}
                      onMouseDown={handleMouseDown}
                    />
                    <div className="editor-panel">
                      <CodeEditor
                        value={currentCode}
                        onChange={setCurrentCode}
                      />
                    </div>
                  </>
                }
              />
              <Route
                path="/latex-docs"
                element={
                  <div className="docs-content full-width">
                    <Documentation
                      markdownContent={latexContent}
                      onCodeClick={handleCodeClick}
                    />
                  </div>
                }
              />
              <Route
                path="/latex"
                element={
                  <LatexEditor
                    value={"a \\wedge b"}
                    onChange={setLatexContent}
                  />
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App; 