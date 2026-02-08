import React, { useState } from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface NewProjectDialogProps {
    onClose: () => void;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ onClose }) => {
    const { controller } = useController();
    const [projectName, setProjectName] = useState('');
    const [machineType, setMachineType] = useState('Lathe');

    const handleCreate = () => {
        if (controller) {
            controller.createProject({ projectName, machineType });
            onClose();
        }
    };

    return (
        <DialogBase title="New Project" onClose={onClose}
            buttons={
                <>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={handleCreate}>
                        <span className="ui-button-text">Create</span>
                    </button>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                        <span className="ui-button-text">Cancel</span>
                    </button>
                </>
            }>
            <form id="menuNewProject">
                <ul>
                    <li>
                        <label htmlFor="projectName">Project Name</label>
                        <input type="text" name="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                    </li>
                    <li>
                        <label htmlFor="machineType">Machine</label>
                        <input type="radio" name="machineType" value="Lathe" checked={machineType === 'Lathe'} onChange={() => setMachineType('Lathe')} /> Lathe
                        <input type="radio" name="machineType" value="Mill" checked={machineType === 'Mill'} onChange={() => setMachineType('Mill')} /> Mill
                    </li>
                </ul>
            </form>
        </DialogBase>
    );
};

export default NewProjectDialog;
