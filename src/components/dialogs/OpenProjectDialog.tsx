import React, { useState, useEffect } from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface OpenProjectDialogProps {
    onClose: () => void;
}

const OpenProjectDialog: React.FC<OpenProjectDialogProps> = ({ onClose }) => {
    const { controller } = useController();
    const [projects, setProjects] = useState<string[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        if (controller) {
            setProjects(Object.keys(controller.listProjects()));
        }
    }, [controller]);

    const handleOpen = (projectName: string) => {
        if (controller) {
            controller.openProject(projectName);
            onClose();
        }
    };

    const toggleSelection = (projectName: string) => {
        const newSelection = new Set(selectedProjects);
        if (newSelection.has(projectName)) {
            newSelection.delete(projectName);
        } else {
            newSelection.add(projectName);
        }
        setSelectedProjects(newSelection);
    };

    const selectAll = () => setSelectedProjects(new Set(projects));
    const selectNone = () => setSelectedProjects(new Set());

    const handleDelete = () => {
        if (selectedProjects.size > 0) {
            setShowConfirmDelete(true);
        } else {
            alert("Select projects to delete");
        }
    };

    const confirmDelete = () => {
        if (controller) {
            controller.deleteProjects(Array.from(selectedProjects));
            setProjects(Object.keys(controller.listProjects())); // Refresh list
            setSelectedProjects(new Set());
            setShowConfirmDelete(false);
        }
    };

    if (showConfirmDelete) {
        return (
            <DialogBase title="Confirm Deletion" onClose={() => setShowConfirmDelete(false)}
                buttons={
                    <>
                        <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={confirmDelete}>
                            <span className="ui-button-text">Delete</span>
                        </button>
                        <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={() => setShowConfirmDelete(false)}>
                            <span className="ui-button-text">Cancel</span>
                        </button>
                    </>
                }>
                <div style={{ padding: '10px' }}>
                    <p>Are you sure you want to delete the following projects?</p>
                    <ul className="tableList" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '10px' }}>
                        {Array.from(selectedProjects).map(p => (
                            <li key={p}><span className="icon icon-file-text2"></span>{p}</li>
                        ))}
                    </ul>
                </div>
            </DialogBase>
        );
    }

    return (
        <DialogBase title="Open Project (Select to Delete)" onClose={onClose} width="450px"
            buttons={
                <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                    <span className="ui-button-text">Cancel</span>
                </button>
            }>
            <div style={{ marginBottom: '10px', padding: '5px', borderBottom: '1px solid var(--border-color)' }}>
                <button className="ui-button" style={{ marginRight: '5px', fontSize: '0.8em', width: 'auto' }} onClick={selectAll}>All</button>
                <button className="ui-button" style={{ marginRight: '5px', fontSize: '0.8em', width: 'auto' }} onClick={selectNone}>None</button>
                <button className="ui-button" style={{ marginLeft: '10px', fontSize: '0.8em', backgroundColor: 'var(--danger-color)', color: 'white', width: 'auto' }} onClick={handleDelete}>Delete</button>
            </div>
            <ul className="tableList">
                {projects.map(p => (
                    <li key={p} style={{ position: 'relative', paddingLeft: '40px', cursor: 'pointer' }} onClick={() => handleOpen(p)}>
                        <input type="checkbox" className="project-checkbox" checked={selectedProjects.has(p)}
                            onClick={(e) => { e.stopPropagation(); toggleSelection(p); }}
                            onChange={() => { }} // Managed via onClick to allow row click separation
                            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 'auto', margin: 0, zIndex: 10 }} />
                        <span className="icon icon-file-text2"></span>{p}
                    </li>
                ))}
            </ul>
        </DialogBase>
    );
};

export default OpenProjectDialog;
