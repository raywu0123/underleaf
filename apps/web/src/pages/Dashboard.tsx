import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../lib/store';

export function Dashboard() {
  const [documentsState, setDocumentsState] = useState(() => store.getDocuments());
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  // Compute sorted documents derived from state
  const sortedDocuments = useMemo(() => {
    return [...documentsState].sort((a, b) => b.lastModifiedAt - a.lastModifiedAt);
  }, [documentsState]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    const newDoc = store.createDocument(newTitle.trim());
    navigate(`/doc/${newDoc.id}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document?')) {
      store.deleteDocument(id);
      setDocumentsState(store.getDocuments());
    }
  };

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Underleaf - Your Documents</h1>
      </header>

      <main className="dashboard-main">
        <section className="create-section">
          <h2>Create New Document</h2>
          <form onSubmit={handleCreate} className="create-form">
            <input 
              type="text" 
              placeholder="Document Title" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="title-input"
              autoFocus
            />
            <button type="submit" className="create-btn" disabled={!newTitle.trim()}>
              Create
            </button>
          </form>
        </section>

        <section className="documents-section">
          <h2>Recent Documents</h2>
          
          {sortedDocuments.length === 0 ? (
            <div className="no-docs">
              <p>You haven't created any documents yet. Create one above to get started!</p>
            </div>
          ) : (
            <div className="documents-grid">
              {sortedDocuments.map(doc => (
                <Link to={`/doc/${doc.id}`} key={doc.id} className="document-card">
                  <div className="doc-card-content">
                    <h3>{doc.title}</h3>
                    <p className="doc-date">Modified: {formatDate(doc.lastModifiedAt)}</p>
                  </div>
                  <div className="doc-card-actions">
                    <button 
                      onClick={(e) => handleDelete(doc.id, e)} 
                      className="delete-btn"
                      title="Delete document"
                    >
                      Delete
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="dashboard-footer">
        <p>Version: {__COMMIT_HASH__} (Built: {__BUILD_TIME__})</p>
      </footer>
    </div>
  );
}
