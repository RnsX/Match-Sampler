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
- Appends new CSV uploads into the existing dataset instead of replacing prior rows
- Lets the user choose whether each uploaded CSV contains `good actors` or `bad actors`
- Lets users preview and maintain each source list directly in the UI
- Lets users tag any source row as a bad actor row
- Supports separate free-text tags on uploaded and individual source rows
- Filters source lists and generated payment samples by tag
- Generates synthetic person records from uploaded names and surnames
- Generates SEPA SCT INST payment messages from the uploaded source data
- Exports generated data as:
  - ZIP archive of `.xml` payment files
  - CSV with one base64-encoded SEPA message per row
  - CSV of bad actor source-row IDs used in generated payments
- Analyzes arbitrary screening-result CSVs against bad actor references
- Calculates overall and per-tag confusion matrices, accuracy, precision, recall, and F1
- Exports and imports the complete application state as JSON

## Main Workflow

1. Load one or more CSV files into each required source list in the `Inputs` section.
2. For each upload, choose whether that CSV contains `good actors` or `bad actors` and optionally assign free-text tags.
3. Review, add, edit, delete, retag, or filter individual source rows.
4. Configure generation settings in the `Generation` section.
5. Generate people and payment samples.
6. Export the generated output from the `Exports` section.
7. Load screening results in the `Analyze results` section, configure match conditions, and review quality metrics.
8. Export or import the complete workspace as JSON when the work needs to be saved or transferred.

## Source Lists

Each source list is stored in application state with:

- a stable internal row ID
- the row value
- a bad actor flag
- zero or more free-text tags

Source lists support both:

- file-level classification during CSV import
- file-level free-text tags applied to every imported row
- row-level maintenance after import
- row-level tag editing and tag-based filtering

Loading another CSV into the same source list appends new rows to the existing dataset.

Bad actor classification and free-text tags are separate. A source row can be a good or bad actor and independently have any number of tags.

If a bad actor row is used during payment generation, its source-row ID and tags are carried into the bad actor export. Generated payment previews can also be filtered by tags inherited from their source rows.

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
- comma-delimited source tags

Tagged rows can come from any supported source list, including narratives, if those rows are used in a generated payment.

## Results Analyzer

The `Analyze results` tab compares screening-system output against known bad actor payment references.

### Screening Results CSV

The results file can use any CSV schema, provided that:

- the first row contains column names
- each following row represents one payment and its screening result
- one column can be selected as the payment ID column

### Bad Actor List CSV

The analyzer can use either the bad actors from generated payments or a separately uploaded CSV. Uploaded bad actor files require these columns:

- `actor_id`
- `value`
- `payment_id`
- `message_id`

An optional `tags` column contains comma-delimited free-text tags.

### Match Conditions

Match conditions define when a screening result is considered a positive hit. Conditions can be combined using `AND` or `OR` logic and support:

- equals and does not equal
- greater than and greater than or equal
- less than and less than or equal
- contains and does not contain

Condition values can be:

- literal values, such as `OPEN` or `75`
- another result field, using `result.column_name`
- a bad actor value for the current or referenced payment, using `getBadActor(payment_id)`

The analyzer compares the configured screening hit against whether the payment exists in the bad actor list and assigns:

- true positive
- false positive
- true negative
- false negative

It calculates overall accuracy, precision, recall, and F1 score. It also creates one-vs-rest confusion matrices and metrics for every free-text tag found on bad actor rows.

## Workspace State

The `Exports` tab supports exporting and importing the complete application state as JSON.

The state file includes:

- all source datasets, bad actor flags, and tags
- generation settings
- generated people and payment samples
- loaded analyzer results and bad actor references
- analyzer match conditions

Importing a state JSON file replaces the current workspace with the imported data. State exports remain entirely client-side.

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

Create the standalone single-file runnable build explicitly:

```bash
npm run build:single-html
```

Preview the production build:

```bash
npm run preview
```

## Build Output

The production build is configured to inline the application into a single HTML file:

- `dist/index.html`

This makes it suitable for internal distribution where a standalone client-side artifact is preferred.
