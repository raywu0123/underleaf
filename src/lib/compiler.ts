import { BusyTexRunner, PdfLatex } from 'texlyre-busytex';

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

  async compile(code: string): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
    await this.init();

    if (!this.pdflatex) {
      return { success: false, error: "Compiler not initialized" };
    }

    try {
      const result = await this.pdflatex.compile({
        input: code,
      });

      if (result.success && result.pdf) {
        const blob = new Blob([result.pdf as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        return { success: true, pdfUrl: url };
      } else {
        return { success: false, error: result.log };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Unknown compilation error' };
    }
  }
}

export const compiler = new LatexCompiler();
