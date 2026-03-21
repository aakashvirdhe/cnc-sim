import React, { useState, useEffect } from 'react';
import DialogBase from './DialogBase';

interface ErrorDialogProps {
    title?: string;
    message: string;
    onClose: () => void;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({ title = "Error", message, onClose }) => {
    return (
        <DialogBase title={title} onClose={onClose} width="400px"
            buttons={
                <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                    <span className="ui-button-text">Close</span>
                </button>
            }>
            <div style={{ padding: '15px' }}>
                <p style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="icon-warning" style={{ fontSize: '1.5em' }}></span>
                    {message}
                </p>
            </div>
        </DialogBase>
    );
};

export default ErrorDialog;
