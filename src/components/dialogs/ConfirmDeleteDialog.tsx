import React from 'react';
import { Modal } from '../common/Modal';

interface ConfirmDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    projects: string[];
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
    isOpen,
    onClose,
    projects,
    onConfirm,
    onCancel
}) => {
    return (
        <Modal
            title="Confirm Deletion"
            isOpen={isOpen}
            onClose={onClose}
            width="450px"
        >
            <div className="dialog-content">
                <p>Are you sure you want to delete the following projects?</p>
                <ul className="tableList confirm-list" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
                    {projects.map(p => (
                        <li key={p}>
                            <span className="icon icon-file-text2"></span> {p}
                        </li>
                    ))}
                </ul>
                <div className="dialog-buttons">
                    <button onClick={onConfirm} className="btn-danger">Delete</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </Modal>
    );
};
