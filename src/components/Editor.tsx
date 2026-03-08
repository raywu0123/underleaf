import { useRef, useEffect, useState } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import YPartyKitProvider from 'y-partykit/provider';
import { MonacoBinding } from 'y-monaco';
import randomColor from 'randomcolor';

interface EditorProps {
  roomName: string;
  onCompile: (content: string) => void;
  isCompiling: boolean;
}

interface UserAwareness {
  name: string;
  color: string;
  id: string;
}

const ANIMALS = ['Panda', 'Tiger', 'Penguin', 'Koala', 'Fox', 'Rabbit', 'Lion', 'Bear', 'Wolf', 'Owl', 'Dolphin', 'Eagle', 'Turtle', 'Cheetah', 'Elephant', 'Monkey'];
const getRandomName = () => `Anonymous ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`;

export function Editor({ roomName, onCompile, isCompiling }: EditorProps) {
  const editorRef = useRef<any>(null);
  const providerRef = useRef<YPartyKitProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const docRef = useRef<Y.Doc | null>(null);

  const [connected, setConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<UserAwareness[]>([]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // 1. Create a new Yjs document
    const ydoc = new Y.Doc();
    docRef.current = ydoc;

    // 2. Connect to a highly reliable PartyKit WebSocket provider
    // Note: We are using a demo/public PartyKit server URL here for demonstration.
    // For a real production app, you would deploy your own backend using 'npx partykit deploy'
    const provider = new YPartyKitProvider(
      "yjs.partykit.dev", 
      roomName, 
      ydoc
    );
    providerRef.current = provider;

    provider.on('status', (event: any) => {
      // PartyKit fires status 'connected' when the WebSocket connects
      setConnected(event === 'connected');
    });

    // 3. Setup Awareness (Avatars & Cursors)
    const userColor = randomColor({ luminosity: 'dark' });
    const userName = getRandomName();
    const userId = Math.random().toString(36).substring(7);

    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: userColor,
      id: userId
    });

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states.map((state: any) => state.user).filter(Boolean);
      // Ensure uniqueness by ID in case of duplicates
      const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
      setConnectedUsers(uniqueUsers);
    });

    // 4. Define a shared text type
    const ytext = ydoc.getText('monaco');

    // 5. Bind Yjs to the Monaco Editor
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
        <div className="editor-header-left">
          <span className="room-info">
            Room: <strong>{roomName}</strong> 
            <span className={connected ? 'status connected' : 'status'}>
              {connected ? ' (Connected)' : ' (Connecting...)'}
            </span>
          </span>
        </div>
        
        <div className="editor-header-right">
          <div className="avatars-container">
            {connectedUsers.map(user => (
              <div 
                key={user.id} 
                className="user-avatar" 
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.split(' ')[1]?.[0] || user.name[0]}
              </div>
            ))}
          </div>

          <button 
            className="compile-btn" 
            onClick={() => onCompile(docRef.current?.getText('monaco').toString() || '')}
            disabled={isCompiling}
          >
            {isCompiling ? 'Compiling...' : 'Compile (⌘+Enter)'}
          </button>
        </div>
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
