import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DocumentScannerRunner from './DocumentScannerRunner';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DocumentScannerRunner />
  </StrictMode>,
);
