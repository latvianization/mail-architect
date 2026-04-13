# MailArchitect — AI Project Context

This file serves as a persistent context for AI agents working on this repository. It defines the architecture, patterns, and current state to reduce token usage and improve precision.

> [!IMPORTANT]
> **AI AGENT REQUIREMENT**: Read this file on every request. Update this file whenever significant architectural changes, new features, or important patterns are introduced.


> [!IMPORTANT]
> **AI AGENT REQUIREMENT**: Do not open browser to check the app. Use the provided context and code to understand the current state.

## Project Overview
**MailArchitect** is a professional MJML-based email builder built with Vue 3. It features:
- Drag-and-drop structural building.
- Dual-mode styling: Class-based (global) and Inline CSS (local).
- Live MJML-to-HTML preview with smart scroll-into-view selection.
- Premium Component Gallery with live MJML hover previews.
- Robust persistence: 1s auto-save, `beforeunload` protection, and undo/redo.

## Technical Architecture
- **Framework**: Vue 3 (CDN version).
- **Core Libraries**:
  - `mjml-browser`: Client-side MJML compilation.
  - `vuedraggable`: Handle structural and palette drag-and-drop.
  - `font-awesome`: Iconography.

### File Structure
- `index.html`: Main entry point and data-driven shell.
- `css/style.css`: All application styles.
- `js/constants.js`: Component library, templateLib, icon maps, and attribute schemas.
- `js/utils.js`: MJML tree parsing (`parseMjmlToTree`), DOM helpers, and UID generation.
- `js/components.js`: Vue components (`tree-node`, `visual-editor`).
- `js/main.js`: Main state management, undo/redo, auto-save, and rendering loop.

## Key Logic Patterns
1. **Node Structure**: Nodes are objects with `id`, `type`, `classes` (array), `style` (object for inline CSS), `attrs` (object for standard MJML attributes), `content` (string), and `children` (array).
2. **Styling Flow**:
   - **Global**: Users define `mj-class` tokens in the "Classes" tab.
   - **Inline**: Users set local properties in the "Inline CSS" section of the inspector.
   - **Compilation**: `buildAttrs` (in `utils.js`) merges classes and inline styles into the final MJML output.
3. **Preview Interaction**: 
   - The preview is an iframe. 
   - **Select-toScroll**: Clicking a node in the tree triggers `scrollIntoView` for that node inside the iframe using internal `mja-{id}` classes.
4. **Resilience & Stability**:
   - **Root Protection**: The `mj-body` component is protected from deletion; clicking delete only clears its children.
   - **UI Guards**: Selection inspector uses `v-if="getClassObj(cname)"` to prevent crashes when components reference deleted/missing classes.
   - **Persistence**: Auto-save runs on a 1-second debounce and hooks into `beforeunload` to prevent data loss.
5. **Component Gallery**: Uses a mini-compilation loop to render live MJML previews of base components and templates when hovered in the "Add Block" popup.

