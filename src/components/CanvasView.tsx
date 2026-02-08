
import React from 'react';

const CanvasView: React.FC = () => {
    return (
        <div id="canvasContainer" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <div id="messages"></div>
        </div>
    );
};

export default CanvasView;
