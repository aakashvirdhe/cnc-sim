import { useEffect } from 'react';
import './App.css'

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
      <div id="editor">
      </div>
      <div id="topMenu">
        <nav>
          <ul>
            <li>
              <div><span title="File" className="icon icon-folder-open"></span>File</div>
              <ul>
                <li>
                  <div title="New Project">New</div>
                </li>
                <li>
                  <div title="Open Project">Open</div>
                </li>
              </ul>
            </li>
            <li>
              <div><span title="Machine" className="icon icon-cogs"></span>Machine</div>
              <ul>
                <li>
                  <div title="Open Machine">Open Machine</div>
                </li>
                <li>
                  <div title="Tool">Tool</div>
                </li>
              </ul>
            </li>
            <li>
              <div><span title="Workpiece" className="icon icon-codepen"></span>Workpiece</div>
              <ul>
                <li>
                  <div title="Workpiece dimensions">Dimensions</div>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
        <span id="machineIcon"></span>
      </div>
      <div id="canvasContainer">
        <div id="messages"></div>
      </div>
      <div id="bottomMenu">
        <span title="Run" id="runIcon" className="icon-play3"></span>
        <span title="Run Animation" id="runAnimationIcon" className="icon-film"></span>
        <span title="Display wireframe" id="wireframeIcon" className="icon-codepen"></span>
        <span title="Auto Run" id="autoRunIcon" className="icon-spinner9"></span>
        <span title="Save" id="saveIcon" className="icon-floppy-disk"></span>
        <span title="Simulate 2D" id="run2DIcon">2D</span>
        <span title="Simulate 3D" id="run3DIcon">3D</span>
      </div>
    </>
  )
}

export default App
