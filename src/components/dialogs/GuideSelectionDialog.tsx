import React from 'react';
import DialogBase from './DialogBase';

interface GuideSelectionDialogProps {
    onClose: () => void;
    onSelectGuide: (guideType: 'USAGE' | 'GCODE') => void;
}

const GuideSelectionDialog: React.FC<GuideSelectionDialogProps> = ({ onClose, onSelectGuide }) => {
    return (
        <DialogBase title="Help & Guides" onClose={onClose}
            buttons={
                <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                    <span className="ui-button-text">Close</span>
                </button>
            }>
            <div style={{ display: 'flex', gap: '20px', padding: '10px' }}>
                <div
                    onClick={() => onSelectGuide('USAGE')}
                    style={{
                        flex: 1,
                        border: '1px solid #444',
                        borderRadius: '8px',
                        padding: '20px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,122,204,0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                >
                    <span className="icon icon-info" style={{ fontSize: '32px', marginBottom: '10px', display: 'block', color: '#007acc' }}></span>
                    <h3>Simulator Usage</h3>
                    <p style={{ color: '#aaa', fontSize: '13px' }}>Learn about 3D controls, camera movement, and simulator UI.</p>
                </div>

                <div
                    onClick={() => onSelectGuide('GCODE')}
                    style={{
                        flex: 1,
                        border: '1px solid #444',
                        borderRadius: '8px',
                        padding: '20px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,122,204,0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                >
                    <span className="icon icon-file-text2" style={{ fontSize: '32px', marginBottom: '10px', display: 'block', color: '#4caf50' }}></span>
                    <h3>G-Code Guide</h3>
                    <p style={{ color: '#aaa', fontSize: '13px' }}>Reference for supported G-codes, M-codes, and syntax.</p>
                </div>
            </div>
        </DialogBase>
    );
};

export default GuideSelectionDialog;
