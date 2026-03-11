import { useRef, useEffect, useState } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { MonacoBinding } from 'y-monaco';
import randomColor from 'randomcolor';
import * as monaco from 'monaco-editor';

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

const USER_KEY = 'underleaf_user_profile';

const getOrCreateUser = (): UserAwareness => {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as UserAwareness;
    } catch (e) {
      console.error("Failed to parse stored user profile", e);
    }
  }

  const newUser: UserAwareness = {
    name: getRandomName(),
    color: randomColor({ luminosity: 'dark' }),
    id: Math.random().toString(36).substring(7)
  };

  localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  return newUser;
};

export function Editor({ roomName, onCompile, isCompiling }: EditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const docRef = useRef<Y.Doc | null>(null);

  const [connected, setConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<UserAwareness[]>([]);

  const handleEditorDidMount: OnMount = (editor, monacoLib) => {
    editorRef.current = editor;

    // 1. Create a new Yjs document
    const ydoc = new Y.Doc();
    docRef.current = ydoc;

    // 2. Connect to the custom Hocuspocus server
    // By default, points to the local server running on port 1234.
    // In production, you can set VITE_WS_URL to your hosted server (e.g., wss://api.yourdomain.com/ws)
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:1234';
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: roomName,
      document: ydoc,
    });
    providerRef.current = provider;

    provider.on('status', (event: { status: string }) => {
      setConnected(event.status === 'connected');
    });

    // 3. Setup Awareness (Avatars & Cursors)
    const user = getOrCreateUser();

    provider.awareness.setLocalStateField('user', user);

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      const users = states
        .map((state: Record<string, unknown>) => state.user)
        .filter((u): u is UserAwareness => Boolean(u && typeof u === 'object' && 'id' in u));
      
      // Ensure uniqueness by ID in case of duplicates
      const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
      setConnectedUsers(uniqueUsers);
    });

    // 4. Define a shared text type
    const ytext = ydoc.getText('monaco');

    // 5. Bind Yjs to the Monaco Editor
    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
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
    editor.addCommand(monacoLib.KeyMod.CtrlCmd | monacoLib.KeyCode.Enter, () => {
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
