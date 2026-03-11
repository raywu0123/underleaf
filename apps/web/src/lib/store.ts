import { v4 as uuidv4 } from 'uuid';

export interface DocumentInfo {
  id: string;
  title: string;
  createdAt: number;
  lastModifiedAt: number;
}

const STORAGE_KEY = 'underleaf_documents';

export const store = {
  getDocuments: (): DocumentInfo[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Error loading documents from local storage", e);
    }
    return [];
  },

  createDocument: (title: string): DocumentInfo => {
    const newDoc: DocumentInfo = {
      id: uuidv4(),
      title,
      createdAt: Date.now(),
      lastModifiedAt: Date.now(),
    };
    
    const docs = store.getDocuments();
    docs.push(newDoc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    return newDoc;
  },

  deleteDocument: (id: string): void => {
    const docs = store.getDocuments().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  },

  updateDocumentDate: (id: string): void => {
    const docs = store.getDocuments();
    const doc = docs.find(d => d.id === id);
    if (doc) {
      doc.lastModifiedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    }
  },

  upsertDocument: (id: string, title: string): void => {
    const docs = store.getDocuments();
    const doc = docs.find(d => d.id === id);
    if (doc) {
      doc.title = title;
      doc.lastModifiedAt = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } else {
      const newDoc: DocumentInfo = {
        id,
        title,
        createdAt: Date.now(),
        lastModifiedAt: Date.now(),
      };
      docs.push(newDoc);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    }
  }
};
