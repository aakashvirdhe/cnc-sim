import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { openDialog } from '../DialogManager';

interface OpenProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    controller: any;
}

export const OpenProjectDialog: React.FC<OpenProjectDialogProps> = ({ isOpen, onClose, controller }) => {
    const [projects, setProjects] = useState<string[]>([]);
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

    // Refresh project list when dialog opens
    useEffect(() => {
        if (isOpen && controller) {
            const projectList = Object.keys(controller.listProjects());
            setProjects(projectList);
            setSelectedProjects(new Set());
        }
    }, [isOpen, controller]);

    const handleOpen = (projectName: string) => {
        controller.openProject(projectName);
        onClose();
    };

    const handleSelect = (projectName: string, checked: boolean) => {
        const newSelected = new Set(selectedProjects);
        if (checked) {
            newSelected.add(projectName);
        } else {
            newSelected.delete(projectName);
        }
        setSelectedProjects(newSelected);
    };

    const handleSelectAll = () => {
        setSelectedProjects(new Set(projects));
    };

    const handleSelectNone = () => {
        setSelectedProjects(new Set());
    };

    const handleDelete = () => {
        if (selectedProjects.size === 0) {
            // User requested no alert window if nothing is selected
            return;
        }

        // Trigger confirmation dialog (requires ConfirmDialog component, 
        // essentially just another call to openDialog or a sub-modal)
        // For now, let's use a native confirm or a dedicated simple confirm mode
        // But adhering to the plan, we should be triggering a confirmation dialog.
        // Let's implement a simple inline confirmation or switch modes? 
        // ui.js used a separate dialog instance. Here we can use `openDialog` to switch.

        openDialog('CONFIRM_DELETE', {
            projects: Array.from(selectedProjects),
            onConfirm: () => {
                controller.deleteProjects(Array.from(selectedProjects));
                // Refresh list if we were to stay open, but we probably close or re-open
                // The legacy behavior re-opened the list. 
                // We'll let the DialogManager handle the flow if we trigger OPEN_PROJECT again.
                openDialog('OPEN_PROJECT');
            },
            onCancel: () => {
                openDialog('OPEN_PROJECT');
            }
        });
    };

    return (
        <Modal
            title="Open Project (Select to Delete)"
            isOpen={isOpen}
            onClose={onClose}
            width="450px"
        >
            <div className="dialog-toolbar">
                <button onClick={handleSelectAll} className="btn-small">All</button>
                <button onClick={handleSelectNone} className="btn-small">None</button>
                <button onClick={handleDelete} className="btn-small btn-danger">Delete</button>
            </div>

            <ul className="project-list">
                {projects.map(p => (
                    <li key={p} className="project-item">
                        <input
                            type="checkbox"
                            checked={selectedProjects.has(p)}
                            onChange={(e) => handleSelect(p, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <span
                            className="project-name"
                            onClick={() => handleOpen(p)}
                        >
                            <span className="icon icon-file-text2"></span> {p}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="dialog-buttons">
                <button onClick={onClose}>Cancel</button>
            </div>
        </Modal>
    );
};
