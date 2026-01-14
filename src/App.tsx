import './App.css'

function App() {

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
        <span title="Simulate 2D" id="run2DIcon">2D Path Simulation</span>
        <span title="Simulate 3D" id="run3DIcon">Final 3D Preview</span>
      </div>
    </>
  )
}

export default App
