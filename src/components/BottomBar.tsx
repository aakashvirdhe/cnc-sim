
import React from 'react';

const BottomBar: React.FC = () => {
    return (
        <div id="bottomMenu">
            <span title="Run" id="runIcon" className="icon-play3"></span>
            <span title="Run Animation" id="runAnimationIcon" className="icon-film"></span>
            <span title="Display wireframe" id="wireframeIcon" className="icon-codepen"></span>
            <span title="Auto Run" id="autoRunIcon" className="icon-spinner9"></span>
            <span title="Save" id="saveIcon" className="icon-floppy-disk"></span>
            <span title="Simulate 2D" id="run2DIcon">2D</span>
            <span title="Simulate 3D" id="run3DIcon">3D</span>
        </div>
    );
};

export default BottomBar;
