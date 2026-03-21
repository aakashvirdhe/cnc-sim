import React, { useState, useEffect } from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface AddFromLocalDialogProps {
    fileData: { name: string; content: string };
    onClose: () => void;
}

const AddFromLocalDialog: React.FC<AddFromLocalDialogProps> = ({ fileData, onClose }) => {
    const { controller } = useController();
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        // Strip extension from suggested project name
        const nameWithoutExt = fileData.name.replace(/\.[^/.]+$/, "");
        setFileName(nameWithoutExt || 'Imported_Project');
    }, [fileData]);

    const handleYes = () => {
        if (controller) {
            // Save as a new project
            controller.createProject({ projectName: fileName, machineType: 'Lathe' });
            controller.editor.setCode(fileData.content);
            controller.save(true);
            onClose();
        }
    };

    const handleNo = () => {
        if (controller) {
            // Just open without saving project
            controller.editor.setCode(fileData.content);
            controller.runInterpreter(); // Apply geometry changes
            onClose();
        }
    };

    return (
        <DialogBase title="Add from Local" onClose={onClose}
            buttons={
                <>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={handleYes}>
                        <span className="ui-button-text">Yes</span>
                    </button>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={handleNo}>
                        <span className="ui-button-text">No</span>
                    </button>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                        <span className="ui-button-text">Cancel</span>
                    </button>
                </>
            }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px' }}>
                <p>Would you like to save this in the simulator?</p>
                <div>
                    <label htmlFor="importProjectName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>File Name / Project Name</label>
                    <input
                        type="text"
                        id="importProjectName"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        className="text ui-widget-content ui-corner-all"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
            </div>
        </DialogBase>
    );
};

export default AddFromLocalDialog;
