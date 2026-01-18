import React from 'react';
import { Modal } from '../common/Modal';

interface OpenMachineDialogProps {
    isOpen: boolean;
    onClose: () => void;
    controller: any;
}

export const OpenMachineDialog: React.FC<OpenMachineDialogProps> = ({ isOpen, onClose, controller }) => {

    const handleMachineSelect = (machine: string) => {
        controller.openMachine(machine);
        onClose();
    };

    return (
        <Modal
            title="Open Machine"
            isOpen={isOpen}
            onClose={onClose}
            width="400px"
        >
            <ul className="tableList project-list">
                <li onClick={() => handleMachineSelect('Lathe')} className="project-item">
                    <span className="icon icon-lathe"></span>
                    <span className="project-name">Lathe</span>
                </li>
                <li onClick={() => handleMachineSelect('Mill')} className="project-item">
                    <span className="icon icon-mill"></span>
                    <span className="project-name">Mill</span>
                </li>
            </ul>
            <div className="dialog-buttons">
                <button onClick={onClose}>Cancel</button>
            </div>
        </Modal>
    );
};
