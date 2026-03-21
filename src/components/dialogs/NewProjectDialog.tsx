import React, { useState } from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface NewProjectDialogProps {
    onClose: () => void;
    onAddFromLocal?: () => void;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ onClose, onAddFromLocal }) => {
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
                    {onAddFromLocal && (
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onAddFromLocal}>
                        <span className="ui-button-text">Browse</span>
                    </button>
                    )}
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={handleCreate}>
                        <span className="ui-button-text">Create</span>
                    </button>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                        <span className="ui-button-text">Cancel</span>
                    </button>
                </>
            }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
                <div>
                    <label htmlFor="projectName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Project Name</label>
                    <input
                        type="text"
                        id="projectName"
                        name="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="text ui-widget-content ui-corner-all"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Machine Type</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="machineType"
                                value="Lathe"
                                checked={machineType === 'Lathe'}
                                onChange={() => setMachineType('Lathe')}
                            />
                            <span>Lathe</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="machineType"
                                value="Mill"
                                checked={machineType === 'Mill'}
                                onChange={() => setMachineType('Mill')}
                            />
                            <span>Mill</span>
                        </label>
                    </div>
                </div>
            </div>
        </DialogBase>
    );
};

export default NewProjectDialog;
