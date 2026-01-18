import { useEffect, useState, useCallback } from 'react';
import './App.css'
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import CanvasView from './components/CanvasView';
import CodeEditor from './components/CodeEditor';

// Import new Core classes
import { ProjectFactory } from './core/ProjectFactory';
import { StorageService } from './core/StorageService';
import { EditorService } from './core/EditorService';
import { Renderer } from './core/graphics/Renderer';
import { Machine } from './core/machines/Machine';
import { Lathe } from './core/machines/Lathe';
import { Mill } from './core/machines/Mill';
import { Motion } from './core/Motion';
import { Controller } from './core/Controller';
import { DialogManager } from './components/DialogManager';
import { Printer } from './core/machines/Printer';

function App() {
  const [editorWidth, setEditorWidth] = useState(400);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [controller, setController] = useState<any>(null);

  // Initialize controller and UI (existing logic)
  useEffect(() => {
    // Shim Legacy Globals
    if (!(window as any).CWS) (window as any).CWS = {};
    (window as any).CWS.Project = ProjectFactory;
    (window as any).CWS.Storage = StorageService;
    (window as any).CWS.CodeEditor = EditorService;
    (window as any).CWS.Renderer = Renderer;
    (window as any).CWS.Motion = Motion;
    (window as any).CWS.Controller = Controller; // Shim Controller

    // Machine Utils
    (window as any).CWS.Machine = Machine;
    (window as any).CWS.Lathe = Lathe;
    (window as any).CWS.Mill = Mill;
    (window as any).CWS.Printer = Printer; // Shim Printer
    (window as any).CWS.SHADER = {}; // Shaders are internal to TS now, but if legacy code accesses CWS.SHADER, we might need to expose it.
    // controller.js doesn't access CWS.SHADER directly except maybe passing it? 
    // Actually machine.js accessed it. But we migrated machine.js.
    // So as long as controller.js doesn't use it, we are fine.

    setTimeout(() => {
      // TODO
      // Lathe tool
      // Check input forms
      const ctrl = new Controller(
        new EditorService(),
        new StorageService({ useCompression: true, useLocalStorage: true }),
        new Renderer("renderer1"),
        new Motion(),
        true
      );
      (window as any).controller = ctrl;
      setController(ctrl); // Store controller for React

      // Stats setup
      let stats: any = { update: () => { } };
      if (typeof (window as any).Stats !== 'undefined') {
        const s = new (window as any).Stats();
        s.domElement.style.position = 'absolute';
        s.domElement.style.bottom = '0px';
        s.domElement.style.right = '0px';
        const container = document.getElementById("canvasContainer");
        if (container) container.appendChild(s.domElement);
        stats = s;
      }

      function onWindowResize() {
        if ((window as any).controller) (window as any).controller.windowResize();
        // UI resize no longer needed as CSS handles it
      }

      function animate() {
        requestAnimationFrame(animate);
        stats.update();
        if ((window as any).controller && (window as any).controller.motion) {
          (window as any).controller.motion.run();
        }
        if ((window as any).controller) {
          (window as any).controller.render();
        }
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
        {controller && <DialogManager controller={controller} />}
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
