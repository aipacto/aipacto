# @aipacto/harvesting-cluster

This package provides the foundational workflows for harvesting data from websites.

---

## Overview

The harvesting cluster is responsible for:

- **Discovery**: Finding new URLs or resources to process.
- **Extraction**: Downloading and extracting content from discovered URLs.
- **Document Processing**: Handling downloaded documents, including storage and embedding creation.
- **Publisher**: Publishing harvesting-related events.

All workflows are defined as composable, idempotent activities, with clear error handling and payload schemas.

---

## Architecture

### Directory Structure
