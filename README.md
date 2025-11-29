# Test Builder – Mini Layout/Template Editor (React + JSON Export)

A small but powerful **drag & drop layout builder** built with React and plain HTML/CSS – designed as a **technical test project** and as a demo of:

- Component-based UI design
- Drag & drop mechanics
- Collision detection & grid snapping
- JSON layout export + validation

No build step, no CRA, no Webpack – just open it locally with a tiny static server and it runs.

---

## 🎯 What This Tool Does

The app simulates a **mini page builder / test builder**:

- A **sidebar** on the right with available elements
- A **canvas** on the left where you drag and drop elements
- A **live JSON export** panel that reflects the current layout and validates it

Supported element types:

- `Header`
- `Footer`
- `Card`
- `Text Content`
- `Slider`

You can drag, move, resize, delete, change z-index, and export a structured JSON representation of the layout.

---

## 🧪 Implemented Requirements / Test Cases

### 1. Drag & Drop Mechanism

**TC-001: Element Drag Start**

- Dragging from the sidebar:
  - Element becomes visually “active” (opacity change, `cursor: grab`)
  - `dragstart` logic fires and attaches element data to `dataTransfer`
- Implemented in:
  - `Sidebar` → `onDragStart`
  - `App` → `handleDragStart`

**TC-002: Drop Zone Detection**

- Canvas highlights valid/invalid drop zones:
  - Green outline for **allowed** drop (`.drop-allowed`)
  - Red outline for **not allowed** drop (`.drop-not-allowed`)
- Collision detection:
  - New element preview is checked against existing elements with `isOverlapping`
- Implemented in:
  - `Canvas` + `App.handleDragOverCanvas`

**TC-003: Element Placement and Position Calculation**

- Drop coordinates are converted into:
  - **Absolute position**: `x`, `y` inside the canvas
  - **Snapped to grid**: using a configurable `GRID_SIZE`
  - **Relative position**: stored as `percentX`, `percentY` (0–100%) based on canvas dimensions
- Implemented in:
  - `App.handleDropOnCanvas`  
  - Helper functions: `getElementSize`, `isOverlapping`

---

### 2. Selecting and Editing Elements

**Selection**

- Click on an element to select it.
- Selected element:
  - Gets a blue outline
  - Shows a resize handle in the bottom-right
  - Is displayed in the sidebar as `Selected: type (id: X)`

**Move**

- Click and drag a selected element to move it.
- Movement:
  - Constrained to stay inside the canvas
  - Updates `x`, `y`, `percentX`, `percentY` in state
- Implemented via:
  - `CanvasElement` → `onMouseDown`
  - Global mouse listeners in `App` (`moveState`)

**Resize**

- Drag the small square **resize handle** in the bottom-right.
- Resize:
  - Keeps the element inside canvas bounds
  - Preserves the aspect ratio
- Implemented via:
  - `CanvasElement` → `onMouseDown` on `.resize-handle`
  - Global mouse listeners in `App` (`resizeState`)

**Delete**

- Press **Delete** or **Backspace** key to remove the selected element.
- Also available via the `Delete` button in the sidebar.
- Implemented via:
  - `App` → `useEffect` keyboard listener
  - `Sidebar` → `onDeleteSelected`

**Z-Index (Bring to Front / Send to Back)**

- `Bring to Front`:
  - Sets the selected element’s `zIndex` above all others
- `Send to Back`:
  - Sets the selected element’s `zIndex` below all others
- On export, z-indices are normalized to a sequential range 1..N.
- Implemented in:
  - `App.bringToFront`
  - `App.sendToBack`
  - `buildExportJson` (normalization)

---

### 3. JSON Export Format & Validation

The right-hand JSON panel shows a **structured export** of the current layout, with this shape:

```json
{
  "project": {
    "name": "Test Builder Layout",
    "version": "1.0",
    "created": "2024-01-15T10:30:00Z",
    "lastModified": "2024-01-15T11:45:00Z"
  },
  "canvas": {
    "width": 1200,
    "height": 800,
    "grid": {
      "enabled": true,
      "size": 10,
      "snap": true
    }
  },
  "elements": [
    {
      "id": "elem_header_001",
      "type": "header",
      "content": { },
      "position": { },
      "responsive": { }
    }
  ],
  "metadata": {
    "totalElements": 1,
    "exportFormat": "json",
    "exportVersion": "2.0"
  }
}
