import { useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { Copy, Check, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Editor } from '../components/Editor';
import { Preview } from '../components/Preview';
import { compiler } from '../lib/compiler';
import { store } from '../lib/store';

export function Document() {
  const { id } = useParams<{ id: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);

  const documents = useMemo(() => store.getDocuments(), []);
  
  // Use state for title to trigger re-renders
  const [docTitle, setDocTitle] = useState(() => {
    if (!id) return 'Untitled Document';
    const doc = documents.find(d => d.id === id);
    return doc ? doc.title : 'Untitled Document';
  });

  const titleRef = useRef<Y.Text | null>(null);

  const handleDocReady = (ydoc: Y.Doc, provider: HocuspocusProvider) => {
    const ytitle = ydoc.getText('title');
    titleRef.current = ytitle;

    ytitle.observe(() => {
      const newTitle = ytitle.toString();
      if (newTitle) {
        setDocTitle(newTitle);
        if (id) {
          store.upsertDocument(id, newTitle);
        }
      }
    });

    // Wait for the provider to sync with the server before initializing empty title
    provider.on('synced', () => {
      if (ytitle.toString() === '') {
        const initialTitle = documents.find(d => d.id === id)?.title || 'Untitled Document';
        ytitle.insert(0, initialTitle);
      }
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setDocTitle(newTitle);
    if (titleRef.current) {
      const ytitle = titleRef.current;
      ydocTitleUpdate(ytitle, newTitle);
    }
    if (id) {
      store.upsertDocument(id, newTitle);
    }
  };

  const ydocTitleUpdate = (yText: Y.Text, newString: string) => {
    yText.doc?.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, newString);
    });
  };

  const handleCompile = async (content: string) => {
    if (isCompiling || !id) return;
    
    setIsCompiling(true);
    setProgressMsg("Initializing compiler...");
    setError(null);
    store.updateDocumentDate(id);
    
    const result = await compiler.compile(content, (msg) => {
      setProgressMsg(msg);
    });
    
    if (result.success && result.pdfUrl) {
      setPdfUrl(result.pdfUrl);
      setError(null);
    } else {
      setError(result.error || 'Unknown error occurred');
    }
    
    setIsCompiling(false);
    setProgressMsg(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleEditor = () => {
    if (!isEditorCollapsed) {
      setIsEditorCollapsed(true);
      setIsPreviewCollapsed(false); // Ensure at least one is open
    } else {
      setIsEditorCollapsed(false);
    }
  };

  const togglePreview = () => {
    if (!isPreviewCollapsed) {
      setIsPreviewCollapsed(true);
      setIsEditorCollapsed(false); // Ensure at least one is open
    } else {
      setIsPreviewCollapsed(false);
    }
  };

  if (!id) {
    return <div>Document not found</div>;
  }

  return (
    <div className="app-container">
      <header className="app-navbar">
        <div className="logo">
          <Link to="/" className="home-link">
            <h1>Underleaf</h1>
          </Link>
          <span className="doc-title-separator">/</span>
          {isEditingTitle ? (
            <input
              type="text"
              className="doc-title-input"
              value={docTitle}
              onChange={handleTitleChange}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <span className="doc-title" onDoubleClick={() => setIsEditingTitle(true)} title="Double click to edit">
              {docTitle}
            </span>
          )}
        </div>
        <div className="navbar-right">
          <div className="layout-controls">
            <button 
              className={`layout-btn ${isEditorCollapsed ? 'active' : ''}`}
              onClick={toggleEditor}
              title={isEditorCollapsed ? "Show Editor" : "Collapse Editor"}
            >
              {isEditorCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <button 
              className={`layout-btn ${isPreviewCollapsed ? 'active' : ''}`}
              onClick={togglePreview}
              title={isPreviewCollapsed ? "Show Preview" : "Collapse Preview"}
            >
              {isPreviewCollapsed ? <PanelRightOpen size={18} /> : <PanelRightClose size={18} />}
            </button>
          </div>
          <div className="room-sharing" title="Share this link to collaborate">
            <input 
              type="text" 
              readOnly 
              value={window.location.href} 
              onClick={e => e.currentTarget.select()} 
            />
            <button className="copy-link-btn" onClick={handleCopyLink} aria-label="Copy link">
              {isCopied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="pane editor-pane" style={{ display: isEditorCollapsed ? 'none' : 'flex' }}>
          <Editor 
            roomName={`underleaf-doc-${id}`} 
            onCompile={handleCompile} 
            isCompiling={isCompiling} 
            onDocReady={handleDocReady}
          />
        </div>
        
        <div className="pane preview-pane" style={{ display: isPreviewCollapsed ? 'none' : 'flex' }}>
          <Preview 
            pdfUrl={pdfUrl} 
            error={error} 
            isCompiling={isCompiling} 
            progressMsg={progressMsg}
          />
        </div>
      </main>
    </div>
  );
}
