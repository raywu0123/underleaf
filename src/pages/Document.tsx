import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Editor } from '../components/Editor';
import { Preview } from '../components/Preview';
import { compiler } from '../lib/compiler';
import { store } from '../lib/store';

export function Document() {
  const { id } = useParams<{ id: string }>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [docTitle, setDocTitle] = useState('Untitled Document');

  useEffect(() => {
    if (id) {
      const docs = store.getDocuments();
      const doc = docs.find(d => d.id === id);
      if (doc) {
        setDocTitle(doc.title);
      }
    }
  }, [id]);

  const handleCompile = async (content: string) => {
    if (isCompiling || !id) return;
    
    setIsCompiling(true);
    setError(null);
    store.updateDocumentDate(id);
    
    const result = await compiler.compile(content);
    
    if (result.success && result.pdfUrl) {
      setPdfUrl(result.pdfUrl);
      setError(null);
    } else {
      setError(result.error || 'Unknown error occurred');
    }
    
    setIsCompiling(false);
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
          <span className="doc-title">{docTitle}</span>
        </div>
        <div className="room-sharing">
          Share this link to collaborate: 
          <input 
            type="text" 
            readOnly 
            value={window.location.href} 
            onClick={e => e.currentTarget.select()} 
          />
        </div>
      </header>
      
      <main className="main-content">
        <div className="pane editor-pane">
          <Editor 
            roomName={`underleaf-doc-${id}`} 
            onCompile={handleCompile} 
            isCompiling={isCompiling} 
          />
        </div>
        
        <div className="pane preview-pane">
          <Preview 
            pdfUrl={pdfUrl} 
            error={error} 
            isCompiling={isCompiling} 
          />
        </div>
      </main>
    </div>
  );
}
