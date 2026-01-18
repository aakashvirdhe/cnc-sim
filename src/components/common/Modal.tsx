import React, { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
    showCloseIcon?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    title,
    isOpen,
    onClose,
    children,
    width = '400px',
    showCloseIcon = true
}) => {
    if (!isOpen) return null;

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ width }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3>{title}</h3>
                    {showCloseIcon && (
                        <button className="modal-close-btn" onClick={onClose}>
                            &times;
                        </button>
                    )}
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};
