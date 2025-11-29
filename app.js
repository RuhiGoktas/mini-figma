// Config ve Ebatlar

const GRID_SIZE = 20;

const ELEMENT_DEFS = [
  {
    type: "header",
    label: "Header",
    description: "Başlık alanı",
    meta: "Width: 100%, Height: 80px, Position: sticky top"
  },
  {
    type: "footer",
    label: "Footer",
    description: "Alt bilgi alanı",
    meta: "Width: 100%, Height: 60px, Position: bottom"
  },
  {
    type: "card",
    label: "Card",
    description: "İçerik kartı",
    meta: "Width: 300px, Height: 200px, Position: relative"
  },
  {
    type: "text",
    label: "Text Content",
    description: "Metin alanı",
    meta: "Width: auto, Height: auto, Position: relative"
  },
  {
    type: "slider",
    label: "Slider",
    description: "Görsel slider",
    meta: "Width: 100%, Height: 400px, Position: relative"
  }
];

const ALLOWED_TYPES = [
  "header",
  "footer",
  "card",
  "text-content",
  "slider"
];

// Json validasyonları

function buildExportJson(elements) {
  const now = new Date().toISOString();

  const canvas = {
    width: 1200,
    height: 800,
    grid: {
      enabled: true,
      size: GRID_SIZE,
      snap: true
    }
  };

  const project = {
    name: "Test Builder Layout",
    version: "1.0",
    created: now,
    lastModified: now
  };

  
  const sorted = [...elements].sort(
    (a, b) => (a.zIndex || 1) - (b.zIndex || 1)
  );

  const mappedElements = sorted.map((el, index) => {
    const padded = String(index + 1).padStart(3, "0");
    let exportType = el.type === "text" ? "text-content" : el.type;

    let content = {};
    let responsive;

    switch (el.type) {
      case "header":
        content = { text: "Site Title", style: "default" };
        responsive = {
          mobile: { width: "100%", height: 60 },
          tablet: { width: "100%", height: 70 }
        };
        break;
      case "card":
        content = {
          title: `Card ${index + 1}`,
          description: "Content description",
          image: null
        };
        responsive = {
          mobile: { x: 10, width: "calc(100% - 20px)" },
          tablet: { x: 30, width: 350 }
        };
        break;
      case "text":
        content = {
          html: "Text content goes here",
          plainText: "Text content goes here"
        };
        break;
      case "footer":
        content = {
          copyright: `© ${new Date().getFullYear()} Test Builder`,
          links: []
        };
        break;
      default:
        content = {};
    }

    let position = {
      x: Math.round(el.x),
      y: Math.round(el.y),
      width: Math.round(el.width),
      height: Math.round(el.height),
      zIndex: index + 1
    };

    
    if (el.type === "header") {
      position = {
        x: 0,
        y: Math.round(el.y),
        width: "100%",
        height: Math.round(el.height),
        zIndex: index + 1
      };
    }

    if (el.type === "footer") {
      position = {
        x: 0,
        y: Math.round(el.y),
        width: "100%",
        height: Math.round(el.height),
        zIndex: index + 1,
        fixed: true
      };
    }

    const jsonEl = {
      id: `elem_${exportType}_${padded}`,
      type: exportType,
      content,
      position
    };

    if (responsive) jsonEl.responsive = responsive;

    return jsonEl;
  });

  const metadata = {
    totalElements: mappedElements.length,
    exportFormat: "json",
    exportVersion: "2.0"
  };

  return {
    project,
    canvas,
    elements: mappedElements,
    metadata
  };
}

function isPercentString(v) {
  return (
    typeof v === "string" &&
    /^\d+(\.\d+)?%$/.test(v.trim())
  );
}

function validateExportJson(json) {
  const errors = [];

  if (!json || typeof json !== "object") {
    errors.push("Root JSON is not an object.");
    return { isValid: false, errors };
  }

  const required = ["project", "canvas", "elements", "metadata"];
  for (const key of required) {
    if (!(key in json)) errors.push(`Missing root key: ${key}`);
  }

  if (!Array.isArray(json.elements)) {
    errors.push("elements must be an array.");
    return { isValid: false, errors };
  }

  const ids = new Set();
  const zValues = [];

  json.elements.forEach((el, index) => {
    if (!el.id) errors.push(`Element[${index}] missing id.`);
    if (!el.type) errors.push(`Element[${index}] missing type.`);
    if (!el.position) errors.push(`Element[${index}] missing position.`);

    if (!el.id || !el.position) return;

    // id uniqueness + pattern
    if (ids.has(el.id)) errors.push(`Duplicate id: ${el.id}`);
    ids.add(el.id);

    const pattern = new RegExp(
      `^elem_(${ALLOWED_TYPES.join("|")})_\\d{3}$`
    );
    if (!pattern.test(el.id)) {
      errors.push(`ID ${el.id} does not match pattern elem_[type]_NNN.`);
    }

    if (!ALLOWED_TYPES.includes(el.type)) {
      errors.push(`Invalid type: ${el.type}`);
    }

    const pos = el.position;

    if (typeof pos.x === "number" && pos.x < 0) {
      errors.push(`Element[${index}] x is negative.`);
    }
    if (typeof pos.y === "number" && pos.y < 0) {
      errors.push(`Element[${index}] y is negative.`);
    }

    const widthValid =
      typeof pos.width === "number" || isPercentString(pos.width);
    const heightValid =
      typeof pos.height === "number" ||
      pos.height === "auto" ||
      isPercentString(pos.height);

    if (!widthValid) errors.push(`Element[${index}] invalid width.`);
    if (!heightValid) errors.push(`Element[${index}] invalid height.`);

    if (typeof pos.zIndex !== "number") {
      errors.push(`Element[${index}] missing numeric zIndex.`);
    } else {
      zValues.push(pos.zIndex);
    }
  });

  if (zValues.length > 0) {
    const sorted = [...new Set(zValues)].sort((a, b) => a - b);
    const expected = Array.from(
      { length: sorted.length },
      (_, i) => i + 1
    );
    if (sorted.toString() !== expected.toString()) {
      errors.push(
        `zIndex must be sequential 1..N. Got: [${sorted.join(", ")}]`
      );
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Geometrik yardımcılar

function getElementSize(type, canvasWidth) {
  switch (type) {
    case "header":
      return { width: canvasWidth, height: 80 };
    case "footer":
      return { width: canvasWidth, height: 60 };
    case "card":
      return { width: 300, height: 200 };
    case "text":
      return { width: Math.min(400, canvasWidth * 0.6), height: 100 };
    case "slider":
      return { width: canvasWidth, height: 400 };
    default:
      return { width: 200, height: 100 };
  }
}

function isOverlapping(a, b) {
  return !(
    a.x + a.width <= b.x ||
    a.x >= b.x + b.width ||
    a.y + a.height <= b.y ||
    a.y >= b.y + b.height
  );
}

// Elemanlar

function CanvasElement({
  element,
  isSelected,
  onSelect,
  onMoveStart,
  onResizeStart
}) {
  const style = {
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex
  };

  let className = "element-box";
  if (element.type === "header") className += " element-header";
  else if (element.type === "footer") className += " element-footer";
  else if (element.type === "card") className += " element-card";
  else if (element.type === "text") className += " element-text";
  else if (element.type === "slider") className += " element-slider";
  if (isSelected) className += " element-selected";

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    onSelect(element.id);
    onMoveStart(e, element);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    onSelect(element.id);
    onResizeStart(e, element);
  };

  return (
    <div className={className} style={style} onMouseDown={handleMouseDown}>
      <strong>{element.type.toUpperCase()}</strong>
      <div className="element-meta">
        id: {element.id} | z: {element.zIndex} | abs:(
        {Math.round(element.x)}, {Math.round(element.y)}) | %:(
        {element.percentX.toFixed(1)}%, {element.percentY.toFixed(1)}%)
      </div>
      {isSelected && (
        <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
      )}
    </div>
  );
}

function Sidebar({
  onDragStart,
  onDragEnd,
  draggingType,
  selectedElement,
  onBringFront,
  onSendBack,
  onDeleteSelected,
  exportJson,
  isValid,
  errors
}) {
  const handleCopyJson = () => {
    const text = JSON.stringify(exportJson, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        alert("Clipboard error, but JSON is visible below.");
      });
    } else {
      alert("Clipboard API not available, but JSON is visible below.");
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob(
      [JSON.stringify(exportJson, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-builder-layout.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sidebar">
      <div>
        <h2>Element Listesi</h2>
        {ELEMENT_DEFS.map((def) => (
          <button
            key={def.type}
            className={
              "element-button" +
              (draggingType === def.type ? " dragging" : "")
            }
            draggable
            onDragStart={(e) => onDragStart(e, def.type)}
            onDragEnd={onDragEnd}
          >
            <div>
              <strong>{def.label}</strong> – {def.description}
            </div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>{def.meta}</div>
          </button>
        ))}
      </div>

      <div className="sidebar-panel">
        <div>
          <strong>Selected:</strong>{" "}
          {selectedElement
            ? `${selectedElement.type} (id: ${selectedElement.id})`
            : "none"}
        </div>
        <div>
          <button onClick={onBringFront} disabled={!selectedElement}>
            Bring to Front
          </button>
          <button onClick={onSendBack} disabled={!selectedElement}>
            Send to Back
          </button>
          <button onClick={onDeleteSelected} disabled={!selectedElement}>
            Delete
          </button>
        </div>

        <div style={{ marginTop: "8px", fontSize: "11px" }}>
          JSON valid: <strong>{isValid ? "yes" : "no"}</strong>
          {!isValid && errors.length > 0 && (
            <ul style={{ marginTop: "4px", paddingLeft: "16px" }}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: "6px" }}>
            <button
              style={{ marginRight: "4px", padding: "4px 8px", fontSize: "11px" }}
              onClick={handleCopyJson}
            >
              Copy JSON
            </button>
            <button
              style={{ padding: "4px 8px", fontSize: "11px" }}
              onClick={handleDownloadJson}
            >
              Download JSON
            </button>
          </div>
        </div>

        <div className="json-preview">
          {JSON.stringify(exportJson, null, 2)}
        </div>
      </div>
    </div>
  );
}

function Canvas({
  elements,
  draggingType,
  onDragOverCanvas,
  onDropOnCanvas,
  dropState,
  selectedId,
  onSelectElement,
  onMoveStart,
  onResizeStart
}) {
  const canvasRef = React.useRef(null);

  const handleDragOver = (e) => {
    if (!draggingType) return;
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    onDragOverCanvas(e, rect);
  };

  const handleDrop = (e) => {
    if (!draggingType) return;
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    onDropOnCanvas(e, rect);
  };

  const handleMoveStartInternal = (event, element) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    onMoveStart(event, element, rect);
  };

  const handleResizeStartInternal = (event, element) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    onResizeStart(event, element, rect);
  };

  let canvasClass = "canvas-inner";
  if (dropState.isOver) {
    canvasClass += dropState.valid ? " drop-allowed" : " drop-not-allowed";
  }

  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      onSelectElement(null);
    }
  };

  return (
    <div className="canvas">
      <div
        ref={canvasRef}
        className={canvasClass}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseDown={handleCanvasClick}
      >
        {elements.length === 0 && (
          <div className="canvas-placeholder">
            Sağdaki listeden bir element sürükleyip bu alana bırakın.
          </div>
        )}
        {elements.map((el) => (
          <CanvasElement
            key={el.id}
            element={el}
            isSelected={el.id === selectedId}
            onSelect={onSelectElement}
            onMoveStart={handleMoveStartInternal}
            onResizeStart={handleResizeStartInternal}
          />
        ))}
      </div>
    </div>
  );
}

// Uygulama

function App() {
  const [elements, setElements] = React.useState([]);
  const [draggingType, setDraggingType] = React.useState(null);
  const [dropState, setDropState] = React.useState({
    isOver: false,
    valid: false
  });
  const [selectedId, setSelectedId] = React.useState(null);
  const [moveState, setMoveState] = React.useState(null);
  const [resizeState, setResizeState] = React.useState(null);

  const nextIdRef = React.useRef(1);

  // Delete / Backspace
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        setElements((prev) => prev.filter((el) => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  // Taşıma ve boyutlandırma
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (moveState) {
        const dx = e.clientX - moveState.startMouseX;
        const dy = e.clientY - moveState.startMouseY;
        let newX = moveState.startX + dx;
        let newY = moveState.startY + dy;

        const rect = moveState.canvasRect;
        const maxX = rect.width - moveState.width;
        const maxY = rect.height - moveState.height;
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== moveState.id) return el;
            const percentX = (newX / rect.width) * 100;
            const percentY = (newY / rect.height) * 100;
            return { ...el, x: newX, y: newY, percentX, percentY };
          })
        );
      } else if (resizeState) {
        const dx = e.clientX - resizeState.startMouseX;
        let newWidth = resizeState.startWidth + dx;
        newWidth = Math.max(40, newWidth);
        let newHeight = newWidth / resizeState.aspect;

        const rect = resizeState.canvasRect;
        const maxWidth = rect.width - resizeState.startX - 2;
        const maxHeight = rect.height - resizeState.startY - 2;

        if (newWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = newWidth / resizeState.aspect;
        }
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = newHeight * resizeState.aspect;
        }

        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== resizeState.id) return el;
            return {
              ...el,
              width: newWidth,
              height: newHeight
            };
          })
        );
      }
    };

    const handleMouseUp = () => {
      if (moveState) setMoveState(null);
      if (resizeState) setResizeState(null);
    };

    if (moveState || resizeState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [moveState, resizeState]);

  const handleDragStart = (event, type) => {
    setDraggingType(type);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/json", JSON.stringify({ type }));
  };

  const handleDragEnd = () => {
    setDraggingType(null);
    setDropState({ isOver: false, valid: false });
  };

  const handleDragOverCanvas = (event, rect) => {
    if (!draggingType) return;

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const localX = mouseX - rect.left;
    const localY = mouseY - rect.top;

    const inside =
      localX >= 0 &&
      localY >= 0 &&
      localX <= rect.width &&
      localY <= rect.height;

    if (!inside) {
      event.dataTransfer.dropEffect = "none";
      setDropState({ isOver: false, valid: false });
      return;
    }

    const size = getElementSize(draggingType, rect.width);
    const snappedX = Math.round(localX / GRID_SIZE) * GRID_SIZE;
    const snappedY = Math.round(localY / GRID_SIZE) * GRID_SIZE;

    const candidate = {
      x: snappedX,
      y: snappedY,
      width: size.width,
      height: size.height
    };

    let hasCollision = false;
    for (const el of elements) {
      const elBox = {
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height
      };
      if (isOverlapping(candidate, elBox)) {
        hasCollision = true;
        break;
      }
    }

    if (hasCollision) {
      event.dataTransfer.dropEffect = "none";
      setDropState({ isOver: true, valid: false });
    } else {
      event.dataTransfer.dropEffect = "copy";
      setDropState({ isOver: true, valid: true });
    }
  };

  const handleDropOnCanvas = (event, rect) => {
    if (!draggingType) return;

    const mouseX = event.clientX;
    const mouseY = event.clientY;
    const localX = mouseX - rect.left;
    const localY = mouseY - rect.top;

    const size = getElementSize(draggingType, rect.width);
    let snappedX = Math.round(localX / GRID_SIZE) * GRID_SIZE;
    let snappedY = Math.round(localY / GRID_SIZE) * GRID_SIZE;

    let newBox = {
      x: snappedX,
      y: snappedY,
      width: size.width,
      height: size.height
    };

    let safety = 0;
    while (
      elements.some((el) =>
        isOverlapping(newBox, {
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height
        })
      )
    ) {
      newBox.y += GRID_SIZE;
      snappedY += GRID_SIZE;
      safety++;
      if (safety > 50) break;
    }

    const percentX = (newBox.x / rect.width) * 100;
    const percentY = (newBox.y / rect.height) * 100;

    const maxZ =
      elements.reduce((m, el) => Math.max(m, el.zIndex || 1), 1) || 1;

    const newElement = {
      id: nextIdRef.current++,
      type: draggingType,
      x: newBox.x,
      y: newBox.y,
      width: newBox.width,
      height: newBox.height,
      percentX,
      percentY,
      zIndex: maxZ + 1
    };

    setElements((prev) => [...prev, newElement]);
    setDropState({ isOver: false, valid: false });
  };

  const handleSelectElement = (id) => {
    setSelectedId(id);
  };

  const handleMoveStart = (event, element, rect) => {
    event.preventDefault();
    setMoveState({
      id: element.id,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startX: element.x,
      startY: element.y,
      width: element.width,
      height: element.height,
      canvasRect: rect
    });
  };

  const handleResizeStart = (event, element, rect) => {
    event.preventDefault();
    setResizeState({
      id: element.id,
      startMouseX: event.clientX,
      startMouseY: event.clientY,
      startWidth: element.width,
      startHeight: element.height,
      startX: element.x,
      startY: element.y,
      canvasRect: rect,
      aspect: element.width / element.height || 1
    });
  };

  const selectedElement =
    elements.find((el) => el.id === selectedId) || null;

  const bringToFront = () => {
    if (!selectedElement) return;
    const maxZ =
      elements.reduce((m, el) => Math.max(m, el.zIndex || 1), 1) || 1;
    const targetId = selectedElement.id;
    setElements((prev) =>
      prev.map((el) =>
        el.id === targetId ? { ...el, zIndex: maxZ + 1 } : el
      )
    );
  };

  const sendToBack = () => {
    if (!selectedElement) return;
    const minZ =
      elements.reduce((m, el) => Math.min(m, el.zIndex || 1), 1) || 1;
    const targetId = selectedElement.id;
    setElements((prev) =>
      prev.map((el) =>
        el.id === targetId ? { ...el, zIndex: minZ - 1 } : el
      )
    );
  };

  const deleteSelected = () => {
    if (!selectedElement) return;
    setElements((prev) =>
      prev.filter((el) => el.id !== selectedElement.id)
    );
    setSelectedId(null);
  };

  const exportJson = React.useMemo(
    () => buildExportJson(elements),
    [elements]
  );
  const { isValid, errors } = React.useMemo(
    () => validateExportJson(exportJson),
    [exportJson]
  );

  return (
    <div className="app">
      <Canvas
        elements={elements}
        draggingType={draggingType}
        onDragOverCanvas={handleDragOverCanvas}
        onDropOnCanvas={handleDropOnCanvas}
        dropState={dropState}
        selectedId={selectedId}
        onSelectElement={handleSelectElement}
        onMoveStart={handleMoveStart}
        onResizeStart={handleResizeStart}
      />
      <Sidebar
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        draggingType={draggingType}
        selectedElement={selectedElement}
        onBringFront={bringToFront}
        onSendBack={sendToBack}
        onDeleteSelected={deleteSelected}
        exportJson={exportJson}
        isValid={isValid}
        errors={errors}
      />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
