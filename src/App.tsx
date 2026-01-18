import { useEffect } from 'react';
import './App.css'
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import CanvasView from './components/CanvasView';
import CodeEditor from './components/CodeEditor';

function App() {
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

  return (
    <>
      <div className="control-column">
        <TopBar />
        <CanvasView />
        <BottomBar />
      </div>
      <div className="editor-column">
        <CodeEditor />
      </div>
    </>
  )
}

export default App
