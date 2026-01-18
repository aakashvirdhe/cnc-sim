import React, { useEffect, useState, useRef, useCallback } from 'react';
import './App.css'
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import CanvasView from './components/CanvasView';
import CodeEditor from './components/CodeEditor';

function App() {
  const [editorWidth, setEditorWidth] = useState(400);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize controller and UI (existing logic)
  useEffect(() => {
    setTimeout(() => {
      // TODO
      // Lathe tool
      // Check input forms
      (window as any).controller = new (window as any).CWS.Controller(
        new (window as any).CWS.CodeEditor(),
        new (window as any).CWS.Storage({ useCompression: true, useLocalStorage: true }),
        new (window as any).CWS.Renderer("renderer1"),
        new (window as any).CWS.Motion(),
        true
      );

      (window as any).ui = new (window as any).CWS.UI((window as any).controller);
      var stats = (window as any).ui.createStats(true);

      function onWindowResize() {
        (window as any).controller.windowResize();
        (window as any).ui.resize();
      }

      function animate() {
        requestAnimationFrame(animate);
        stats.update();
        (window as any).controller.motion.run();
        (window as any).controller.render();
      }
      animate();

      window.addEventListener('resize', onWindowResize, false);
      (window as any).controller.runInterpreter();
    }, 100);
  }, []);

  // Handle Resizing Logic
  useEffect(() => {
    if ((window as any).controller) {
      (window as any).controller.windowResize();
      if ((window as any).ui) (window as any).ui.resize();
    }
  }, [editorWidth, isCollapsed]);

  const startResizing = useCallback(() => {
    setIsDragging(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resize = useCallback((mouseEvent: MouseEvent) => {
    if (isDragging) {
      // Calculate new width from right edge
      const newWidth = window.innerWidth - mouseEvent.clientX;
      const maxLimit = window.innerWidth * 0.5; // 50% of screen

      // Min 200px, Max 50%
      if (newWidth > 200 && newWidth <= maxLimit) {
        setEditorWidth(newWidth);
        if (isCollapsed) setIsCollapsed(false);
      } else if (newWidth > maxLimit) {
        // Clamp to max if dragged beyond
        setEditorWidth(maxLimit);
        if (isCollapsed) setIsCollapsed(false);
      }
    }
  }, [isDragging, isCollapsed]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      // Saving previous width could be added, but defaulting to current `editorWidth` state preservation is fine
      // Actually when collapsed, width effectively becomes 0 for the column, but we handle that in render/style
    }
  };

  const currentEditorWidth = isCollapsed ? 0 : editorWidth;
  const gridTemplateColumns = `1fr auto ${currentEditorWidth}px`;

  return (
    <div id="app-root" style={{
      display: 'grid',
      gridTemplateColumns: gridTemplateColumns,
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-family)'
    }}>
      <div className="control-column">
        <TopBar />
        <CanvasView />
        <BottomBar />
      </div>

      <div
        className={`resizer-gutter ${isDragging ? 'dragging' : ''}`}
        onMouseDown={startResizing}
      >
        <button
          className="collapse-btn"
          onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
          title={isCollapsed ? "Expand Editor" : "Collapse Editor"}
        >
          {isCollapsed ? "◀" : "▶"}
        </button>
      </div>

      <div className="editor-column" style={{ width: currentEditorWidth, display: isCollapsed ? 'none' : 'block' }}>
        <CodeEditor />
      </div>
    </div>
  )
}

export default App
