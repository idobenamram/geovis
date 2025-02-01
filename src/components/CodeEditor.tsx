import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    editorRef.current = monaco.editor.create(containerRef.current, {
      value,
      language: 'typescript',
      theme: 'vs-dark',
      minimap: { enabled: false },
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      roundedSelection: false,
      padding: { top: 10 },
    });

    editorRef.current.onDidChangeModelContent(() => {
      if (onChange) {
        onChange(editorRef.current?.getValue() || '');
      }
    });

    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return <div ref={containerRef} className="editor-container" style={{ width: '100%', height: '100%' }} />;
};

export default CodeEditor; 