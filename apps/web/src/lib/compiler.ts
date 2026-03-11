import { BusyTexRunner, PdfLatex } from 'texlyre-busytex';

export type ProgressCallback = (msg: string) => void;

interface BusyTexMessage {
  print?: string;
}

// Monkey-patch Worker to capture BusyTeX initialization prints
const OriginalWorker = window.Worker;
window.Worker = class extends OriginalWorker {
  constructor(stringUrl: string | URL, options?: WorkerOptions) {
    super(stringUrl, options);
    this.addEventListener('message', (e: MessageEvent<BusyTexMessage>) => {
      if (typeof e.data?.print === 'string' && e.data.print.includes('Downloading data')) {
        window.dispatchEvent(new CustomEvent('busytex-download', { detail: e.data.print }));
      }
    });
  }
} as unknown as typeof OriginalWorker;

export class LatexCompiler {
  private runner: BusyTexRunner | null = null;
  private pdflatex: PdfLatex | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.runner) return;
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = (async () => {
      this.runner = new BusyTexRunner({
        busytexBasePath: import.meta.env.BASE_URL + 'core/busytex',
        verbose: false
      });
      
      // Use web worker if possible to not block UI
      await this.runner.initialize(true);
      this.pdflatex = new PdfLatex(this.runner);
    })();

    await this.initPromise;
    this.isInitializing = false;
  }

  async compile(code: string, onProgress?: ProgressCallback): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    const handleProgress = (e: Event) => {
      if (onProgress) onProgress((e as CustomEvent<string>).detail);
    };
    
    if (onProgress) {
      window.addEventListener('busytex-download', handleProgress);
      onProgress('Initializing compiler...');
    }

    try {
      await this.init();

      if (onProgress) {
        onProgress('Compiling...');
      }

      if (!this.pdflatex) {
        return { success: false, error: "Compiler not initialized" };
      }

      const result = await this.pdflatex.compile({
        input: code,
      });

      if (result.success && result.pdf) {
        const blob = new Blob([result.pdf as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        return { success: true, pdfUrl: url };
      } else {
        return { success: false, error: result.log };
      }
    } catch (e) {
      const error = e as Error;
      return { success: false, error: error.message || 'Unknown compilation error' };
    } finally {
      if (onProgress) {
        window.removeEventListener('busytex-download', handleProgress);
      }
    }
  }
}

export const compiler = new LatexCompiler();
