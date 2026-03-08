interface PreviewProps {
  pdfUrl: string | null;
  error: string | null;
  isCompiling: boolean;
  progressMsg?: string | null;
}

export function Preview({ pdfUrl, error, isCompiling, progressMsg }: PreviewProps) {
  return (
    <div className="preview-container">
      <div className="preview-header">
        <h2>PDF Preview</h2>
        {isCompiling && (
          <span className="compiling-indicator">
            {progressMsg ? progressMsg : 'Compiling...'}
          </span>
        )}
      </div>
      <div className="preview-body">
        {error ? (
          <div className="error-box">
            <h3>Compilation Error</h3>
            <pre>{error}</pre>
          </div>
        ) : pdfUrl ? (
          <iframe 
            src={pdfUrl} 
            title="PDF Preview"
            className="pdf-frame"
          />
        ) : (
          <div className="empty-state">
            <p>Compile to see PDF preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
