# Screening Sampler

Screening Sampler is a client-side web application for generating synthetic SEPA SCT INST payment samples for screening and sanctions-testing scenarios.

The application runs entirely in the browser. It does not use an API or backend service. Production build output is bundled into a single runnable HTML file.

## What It Does

- Loads CSV source lists for:
  - person names
  - person surnames
  - company names
  - BIC codes
  - addresses
  - countries
  - narratives
- Lets users preview and maintain each source list directly in the UI
- Lets users tag any source row as a bad actor row
- Generates synthetic person records from uploaded names and surnames
- Generates SEPA SCT INST payment messages from the uploaded source data
- Exports generated data as:
  - ZIP archive of `.xml` payment files
  - CSV with one base64-encoded SEPA message per row
  - CSV of bad actor source-row IDs used in generated payments

## Main Workflow

1. Load the required CSV source files in the `Inputs` section.
2. Review, add, edit, or delete source rows.
3. Mark any source rows that should be treated as bad actors.
4. Configure generation settings in the `Generation` section.
5. Generate people and payment samples.
6. Export the generated output from the `Exports` section.

## Source Lists

Each source list is stored in application state with:

- a stable internal row ID
- the row value
- a bad actor flag

If a tagged row is used during payment generation, its source-row ID is carried into the bad actor export.

## Exports

### XML ZIP

Exports one SEPA SCT INST XML file per generated payment inside a ZIP archive.

### Base64 CSV

Exports one generated payment per CSV row. Each row contains the message payload encoded as base64.

### Bad Actor ID CSV

Exports tagged source-row IDs that were actually used in generated payments, including:

- source row ID
- source row value
- generated payment ID
- generated message ID

## Tech Stack

- React
- TypeScript
- Vite
- Redux Toolkit
- React Redux
- Radix UI
- JSZip
- `vite-plugin-singlefile`

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Build Output

The production build is configured to inline the application into a single HTML file:

- `dist/index.html`

This makes it suitable for internal distribution where a standalone client-side artifact is preferred.
