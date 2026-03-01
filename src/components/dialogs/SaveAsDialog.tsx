import React, { useState, useEffect } from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface SaveAsDialogProps {
    onClose: () => void;
}

const SaveAsDialog: React.FC<SaveAsDialogProps> = ({ onClose }) => {
    const { controller } = useController();
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (controller && controller.storage && controller.storage.header) {
            setProjectName(controller.storage.header.name || 'Untitled');
        }
    }, [controller]);

    const handleSaveAs = () => {
        if (!projectName.trim()) {
            setError('Project name cannot be empty');
            return;
        }

        if (controller && controller.storage) {
            const currentMachine = controller.getMachineType() || 'Lathe';

            // Create a new project which sets the new name and saves the current state
            // But we want to duplicate current code and workpiece too
            const currentCode = controller.storage.code;
            const currentHeader = { ...controller.storage.header };

            // Generate unique name
            const newName = controller.storage.getUniqueProjectName(projectName);

            // Save as essentially creates a new project header but keeps the same code
            currentHeader.name = newName;

            controller.storage.saveCurrentProjectHeader(currentHeader);
            controller.storage.saveCurrentProjectCode(currentCode);
            controller.storage.saveCurrentProjectToProjectsList();

            // Notify other components
            window.dispatchEvent(new CustomEvent('projectUpdated', {
                detail: {
                    projectName: newName,
                    machineType: currentMachine
                }
            }));

            onClose();
        }
    };

    return (
        <DialogBase title="Save Project As" onClose={onClose}
            buttons={
                <>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={handleSaveAs}>
                        <span className="ui-button-text">Save</span>
                    </button>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                        <span className="ui-button-text">Cancel</span>
                    </button>
                </>
            }>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveAs(); }}>
                <ul>
                    <li>
                        <label htmlFor="projectName">New Name</label>
                        <input
                            type="text"
                            name="projectName"
                            value={projectName}
                            onChange={(e) => { setProjectName(e.target.value); setError(''); }}
                            autoFocus
                        />
                    </li>
                    {error && (
                        <li>
                            <span style={{ color: '#f44336', fontSize: '12px' }}>{error}</span>
                        </li>
                    )}
                </ul>
            </form>
        </DialogBase>
    );
};

export default SaveAsDialog;
