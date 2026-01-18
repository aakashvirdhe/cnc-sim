import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface NewProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    controller: any;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ isOpen, onClose, controller }) => {
    const [projectName, setProjectName] = useState('');
    const [machineType, setMachineType] = useState('Lathe');

    const handleCreate = () => {
        if (!projectName.trim()) {
            alert('Please enter a project name');
            return;
        }

        controller.createProject({
            projectName,
            machineType
        });
        onClose();
        // Reset form for next time
        setProjectName('');
        setMachineType('Lathe');
    };

    return (
        <Modal title="New Project" isOpen={isOpen} onClose={onClose}>
            <div className="dialog-form">
                <div className="form-group">
                    <label htmlFor="np_projectName">Project Name</label>
                    <input
                        type="text"
                        id="np_projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Machine</label>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                name="machineType"
                                value="Lathe"
                                checked={machineType === 'Lathe'}
                                onChange={(e) => setMachineType(e.target.value)}
                            /> Lathe
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="machineType"
                                value="Mill"
                                checked={machineType === 'Mill'}
                                onChange={(e) => setMachineType(e.target.value)}
                            /> Mill
                        </label>
                    </div>
                </div>
                <div className="dialog-buttons">
                    <button onClick={handleCreate}>Create</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </Modal>
    );
};
