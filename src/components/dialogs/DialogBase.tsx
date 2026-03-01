import React from 'react';
import { createPortal } from 'react-dom';

interface DialogBaseProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    buttons?: React.ReactNode;
    width?: string;
}

const DialogBase: React.FC<DialogBaseProps> = ({ title, children, onClose, buttons, width = '400px' }) => {
    return createPortal(
        <div className="ui-dialog ui-widget ui-widget-content ui-corner-all ui-front ui-dialog-buttons ui-draggable ui-resizable"
            style={{
                position: 'fixed',
                height: 'auto',
                width: width,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                display: 'block',
                backgroundColor: '#fff', // Ensure background is opaque
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)' // Add shadow for visibility over canvas
            }}>
            <div className="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix ui-draggable-handle">
                <span className="ui-dialog-title">{title}</span>
                <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close"
                    title="Close" onClick={onClose}>
                    <span className="ui-button-icon-primary ui-icon ui-icon-closethick"></span>
                    <span className="ui-button-text">Close</span>
                </button>
            </div>
            <div className="ui-dialog-content ui-widget-content" style={{ width: 'auto', minHeight: '0px', maxHeight: 'none', height: 'auto' }}>
                {children}
            </div>
            <div className="ui-dialog-buttonpane ui-widget-content ui-helper-clearfix">
                <div className="ui-dialog-buttonset">
                    {buttons}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DialogBase;
