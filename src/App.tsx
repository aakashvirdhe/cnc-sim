import { useState, useEffect, useCallback } from 'react';
import './assets/jquery-ui.css';
import './assets/icons.css';
import './components/dialogs/DialogStyles.css';
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
// import { Printer } from './core/machines/Printer';
import { ControllerProvider } from './contexts/ControllerContext';

import Stats from 'stats.js';

import CodeGuide from './components/CodeGuide';
import SimulatorUsageGuide from './components/dialogs/SimulatorUsageGuide';

function App() {
  const [editorWidth, setEditorWidth] = useState(400);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [controller, setController] = useState<Controller | null>(null);
  const [showCodeGuide, setShowCodeGuide] = useState(false);
  const [showSimulatorGuide, setShowSimulatorGuide] = useState(false);
  const [projectName, setProjectName] = useState("Untitled");

  useEffect(() => {
    const handleCodeGuideToggle = (e: CustomEvent) => {
      setShowCodeGuide(e.detail);
    };

    const handleSpecificGuide = (e: CustomEvent) => {
      if (e.detail === 'GCODE') {
        setShowCodeGuide(true);
        setShowSimulatorGuide(false);
      } else if (e.detail === 'USAGE') {
        setShowSimulatorGuide(true);
        setShowCodeGuide(false);
      }
    };

    // Also listen for project updates to show correct name in guide
    const handleProjectUpdate = (e: CustomEvent) => {
      if (e.detail && e.detail.projectName) {
        setProjectName(e.detail.projectName);
      }
    };

    window.addEventListener('toggleCodeGuide', handleCodeGuideToggle as EventListener);
    window.addEventListener('openSpecificGuide', handleSpecificGuide as EventListener);
    window.addEventListener('projectUpdated', handleProjectUpdate as EventListener);
    return () => {
      window.removeEventListener('toggleCodeGuide', handleCodeGuideToggle as EventListener);
      window.removeEventListener('openSpecificGuide', handleSpecificGuide as EventListener);
      window.removeEventListener('projectUpdated', handleProjectUpdate as EventListener);
    };
  }, []);

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
    // (window as any).CWS.Printer = Printer; // Shim Printer
    (window as any).CWS.SHADER = {};

    setTimeout(() => {
      // TODO
      // Lathe tool
      // Check input forms
      const newController = new Controller(
        new EditorService(),
        new StorageService({ useCompression: true, useLocalStorage: true }),
        new Renderer("renderer1"),
        new Motion()
      );
      (window as any).controller = newController;
      setController(newController);

      // Update local state with initial project name
      if (newController.storage && newController.storage.header) {
        setProjectName(newController.storage.header.name || "Untitled");
      }

      // Initialize Stats
      const stats = new Stats();
      stats.dom.style.position = 'absolute';
      stats.dom.style.bottom = '0px';
      stats.dom.style.right = '0px';
      stats.dom.style.top = 'auto'; // Override default
      stats.dom.style.left = 'auto'; // Override default

      // Wait for DOM to be ready if showing code guide immediately (unlikely but safe)
      // stats appending moved to inside render or effect when container exists

      // We only append stats if canvas container exists
      const container = document.getElementById("canvasContainer");
      if (container) container.appendChild(stats.dom);

      function onWindowResize() {
        newController.windowResize();
      }

      function animate() {
        requestAnimationFrame(animate);
        stats.update();
        if (newController && newController.motion) newController.motion.run();
        if (newController) newController.render();
      }
      animate();

      window.addEventListener('resize', onWindowResize, false);
      newController.runInterpreter();
    }, 100);
  }, []);

  // Handle Resizing Logic
  useEffect(() => {
    if (controller) {
      controller.windowResize();
      if ((window as any).ui) (window as any).ui.resize();
    }
  }, [editorWidth, isCollapsed, controller, showCodeGuide]); // Added showCodeGuide dependency to trigger resize when switching back

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
  };

  const currentEditorWidth = isCollapsed ? 0 : editorWidth;
  const gridTemplateColumns = `1fr auto ${currentEditorWidth}px`;

  return (
    <ControllerProvider controller={controller}>
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
        <div className="control-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: showCodeGuide ? 'none' : 'flex', flexDirection: 'column', height: '100%' }}>
            <TopBar />
            <CanvasView />
            <BottomBar />
          </div>
          {showCodeGuide && (
            <CodeGuide onBack={() => setShowCodeGuide(false)} currentProjectName={projectName} />
          )}
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

        {showSimulatorGuide && (
          <SimulatorUsageGuide onClose={() => setShowSimulatorGuide(false)} />
        )}
      </div>
    </ControllerProvider>
  )
}

export default App
