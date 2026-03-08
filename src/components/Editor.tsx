import { useRef, useEffect, useState } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';

interface EditorProps {
  roomName: string;
  onCompile: (content: string) => void;
  isCompiling: boolean;
}

export function Editor({ roomName, onCompile, isCompiling }: EditorProps) {
  const editorRef = useRef<any>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const docRef = useRef<Y.Doc | null>(null);

  const [connected, setConnected] = useState(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 1. Create a new Yjs document
    const ydoc = new Y.Doc();
    docRef.current = ydoc;

    // 2. Connect to a WebRTC provider
    // By using the same roomName, multiple clients will connect and sync.
    const provider = new WebrtcProvider(roomName, ydoc, {
      signaling: [
        'wss://yjs-webrtc-signaling-eu.herokuapp.com',
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com'
      ]
    });
    providerRef.current = provider;

    provider.on('status', (event: any) => {
      setConnected(event.status === 'connected');
    });

    // 3. Define a shared text type
    const ytext = ydoc.getText('monaco');

    // 4. Bind Yjs to the Monaco Editor
    const binding = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );
    bindingRef.current = binding;

    // Optionally set some default text if empty
    if (ytext.toString() === '') {
      ytext.insert(0, `\\documentclass{article}
\\usepackage{amsmath}

\\begin{document}
\\section{Collaborative LaTeX with WebAssembly}
Hello from the browser! You can edit this document together with others.

\\begin{equation}
E = mc^2
\\end{equation}

\\end{document}
`);
    }

    // Command to compile (e.g., Ctrl/Cmd + Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onCompile(ytext.toString());
    });
    
    // Initial compile
    setTimeout(() => {
      onCompile(ytext.toString());
    }, 1000);
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      providerRef.current?.destroy();
      docRef.current?.destroy();
    };
  }, []);

  return (
    <div className="editor-container">
      <div className="editor-header">
        <span className="room-info">
          Room: <strong>{roomName}</strong> 
          <span className={connected ? 'status connected' : 'status'}>
            {connected ? ' (Connected)' : ' (Connecting...)'}
          </span>
        </span>
        <button 
          className="compile-btn" 
          onClick={() => onCompile(docRef.current?.getText('monaco').toString() || '')}
          disabled={isCompiling}
        >
          {isCompiling ? 'Compiling...' : 'Compile (⌘+Enter)'}
        </button>
      </div>
      <div className="editor-body">
        <MonacoEditor
          height="100%"
          language="latex"
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            fontSize: 14,
          }}
        />
      </div>
    </div>
  );
}
