# MailArchitect — AI Project Context

This file serves as a persistent context for AI agents working on this repository. It defines the architecture, patterns, and current state to reduce token usage and improve precision.

> [!IMPORTANT]
> **AI AGENT REQUIREMENT**: Read this file on every request. Update this file whenever significant architectural changes, new features, or important patterns are introduced.

## Project Overview
**MailArchitect** is a professional MJML-based email builder built with Vue 3. It features:
- Drag-and-drop structural building.
- Class-based styling (no inline styles).
- Live MJML-to-HTML preview with dark mode support.
- Undo/Redo functionality and localStorage persistence.

## Technical Architecture
- **Framework**: Vue 3 (CDN version).
- **Core Libraries**:
  - `mjml-browser`: Client-side MJML compilation.
  - `vuedraggable`: Handle structural and palette drag-and-drop.
  - `js-beautify`: Cleanup generated HTML.
  - `font-awesome`: Iconography.

### File Structure
- `index.html`: Main entry point and data-driven shell.
- `css/style.css`: All application styles.
- `js/constants.js`: Data structures (component library, icon maps, attribute schemas).
- `js/utils.js`: Non-framework logic (UID, MJML compilation, color helpers, string processing).
- `js/components.js`: Vue components (primarily `tree-node`).
- `js/main.js`: Main Vue app setup and state management.

## Key Logic Patterns
1. **Node Structure**: Nodes are objects with `id`, `type`, `classes` (array), `attrs` (object), `content` (string), and optional `children` (array).
2. **Styling Flow**: Users define `mj-class` tokens in the "Classes" tab. These are applied to nodes and compiled into the MJML `<mj-head>` block.
3. **Preview Interaction**: The preview is an iframe. Direct DOM access is used from the main window to the iframe for hover highlights and click-to-select functionality.
4. **MJML Compilation**: Done in `mjmlSource` computed property. Internal targeting classes (`mja-{id}`) are added for builder functionality and stripped in `cleanMjmlSource`.

## Recent Changes (2026-04-12)
- **Refactoring**: Split the monolithic `email-builder.html` into a modular structure (`index.html`, `css/`, `js/`).
- **Externalized Assets**: Moved logic to dedicated JS files to improve maintainability.
- **AI Context**: Initialized `AI_CONTEXT.md` to streamline agent interactions.

## Focus Areas for Future Work
- Improving component nesting reliability.
- Expanding the component library (e.g., more social icons, navbar presets).
- Enhancing the Rich Text Editor (RTE) with more MJML-specific features.
