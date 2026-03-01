import React from 'react';
import DialogBase from './DialogBase';

interface SimulatorUsageGuideProps {
    onClose: () => void;
}

const SimulatorUsageGuide: React.FC<SimulatorUsageGuideProps> = ({ onClose }) => {
    return (
        <DialogBase title="Simulator Usage Guide" onClose={onClose}
            buttons={
                <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                    <span className="ui-button-text">Close</span>
                </button>
            }>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px', color: '#ccc' }}>
                <h3 style={{ color: '#fff', borderBottom: '1px solid #444', paddingBottom: '8px' }}>3D Viewport Controls</h3>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Rotate Camera:</strong> Left-Click + Drag</li>
                    <li><strong>Pan Camera:</strong> Right-Click + Drag</li>
                    <li><strong>Zoom In / Out:</strong> Mouse Scroll Wheel</li>
                </ul>

                <h3 style={{ color: '#fff', borderBottom: '1px solid #444', paddingBottom: '8px' }}>Editor Shortcuts</h3>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Live Update:</strong> Code changes parse automatically.</li>
                    <li><strong>Line Execution:</strong> Blue highlighted line in editor shows current executing G-Code block.</li>
                </ul>

                <h3 style={{ color: '#fff', borderBottom: '1px solid #444', paddingBottom: '8px' }}>Simulation Controls (Bottom Bar)</h3>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '20px' }}>
                    <li><strong>Simulate / Stop:</strong> Start or stop the 3D simulation execution.</li>
                    <li><strong>Toolpath:</strong> Toggle visibility of the 2D projected G-Code path lines.</li>
                    <li><strong>Job Preview:</strong> Toggle visibility of the 3D solid material rendering.</li>
                    <li><strong>Mode: Multi / Single:</strong> Switch between continuous execution (Multi) and step-by-step execution (Single).</li>
                    <li><strong>Next Line:</strong> Execute the next single block of G-code (Available only in 'Mode: Single').</li>
                    <li><strong>Speed:</strong> Open a slider/menu to adjust the simulation animation speed.</li>
                    <li><strong>Save:</strong> Quick save the current project and settings to browser storage.</li>
                </ul>
            </div>
        </DialogBase>
    );
};

export default SimulatorUsageGuide;
