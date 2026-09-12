import { NOTEBOOK_SECTIONS } from '../data/notebookContent';

export function generateJupyterNotebookJson(): string {
  const cells: any[] = [
    {
      cell_type: 'markdown',
      metadata: {},
      source: [
        '# Retail Sales Exploratory Data Analysis (EDA)\n',
        '## Comprehensive Exploratory Data Analysis on Retail Sales Data\n',
        '---\n',
        '**Domain:** Retail Sales & Business Intelligence\n',
        '**Dataset:** `retail_sales_dataset.csv` (1,000 retail transactions)\n',
        '**Objective:** Perform comprehensive Exploratory Data Analysis (EDA) uncovering customer behavior, sales trends, and actionable business intelligence.\n',
        '---\n'
      ]
    }
  ];

  NOTEBOOK_SECTIONS.forEach((section) => {
    // Markdown cell
    cells.push({
      cell_type: 'markdown',
      metadata: {},
      source: section.markdownExplanation.split('\n').map((line, idx, arr) => 
        idx === arr.length - 1 ? line : line + '\n'
      )
    });

    // Code cell
    const outputs: any[] = [];
    if (section.textOutput) {
      outputs.push({
        name: 'stdout',
        output_type: 'stream',
        text: section.textOutput.split('\n').map((line, idx, arr) => 
          idx === arr.length - 1 ? line : line + '\n'
        )
      });
    }

    cells.push({
      cell_type: 'code',
      execution_count: section.id,
      metadata: {},
      outputs,
      source: section.pythonCode.split('\n').map((line, idx, arr) => 
        idx === arr.length - 1 ? line : line + '\n'
      )
    });
  });

  const notebook = {
    cells,
    metadata: {
      language_info: {
        name: 'python',
        codemirror_mode: {
          name: 'ipython',
          version: 3
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        pygments_lexer: 'ipython3',
        version: '3.10.12'
      },
      kernelspec: {
        display_name: 'Python 3 (ipykernel)',
        language: 'python',
        name: 'python3'
      },
      orig_nbformat: 4
    },
    nbformat: 4,
    nbformat_minor: 5
  };

  return JSON.stringify(notebook, null, 2);
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
