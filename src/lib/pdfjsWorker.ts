/**
 * Configure pdf.js worker to match react-pdf's bundled pdfjs-dist version.
 * Top-level `pdfjs-dist` must stay on the same version as react-pdf's dependency
 * (see package.json — pinned, not ^).
 */
import { pdfjs } from "react-pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export { pdfjs };
