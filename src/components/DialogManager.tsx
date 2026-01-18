import React, { useState, useEffect } from 'react';
// Modal is used by fallback, so we keep it or uncomment fallback
import { Modal } from './common/Modal';
import { NewProjectDialog } from './dialogs/NewProjectDialog';
import { OpenProjectDialog } from './dialogs/OpenProjectDialog';
import { ConfirmDeleteDialog } from './dialogs/ConfirmDeleteDialog';
import { OpenMachineDialog } from './dialogs/OpenMachineDialog';
import { WorkpieceDialog } from './dialogs/WorkpieceDialog';
import { ToolDialog } from './dialogs/ToolDialog';
import { MaterialDialog } from './dialogs/MaterialDialog';
import './dialogs/Dialogs.css'; // Import shared styles

interface DialogManagerProps {
    controller: any; // Using any for now, will refine with proper types later
}

export type DialogType =
    | 'NONE'
    | 'NEW_PROJECT'
    | 'OPEN_PROJECT'
    | 'OPEN_MACHINE'
    | 'WORKPIECE_DIMENSIONS'
    | 'MATERIAL_SETTINGS'
    | 'TOOL_SETTINGS'
    | 'CONFIRM_DELETE';

export const DialogManager: React.FC<DialogManagerProps> = ({ controller }) => {
    const [currentDialog, setCurrentDialog] = useState<DialogType>('NONE');
    const [dialogProps, setDialogProps] = useState<any>({});

    useEffect(() => {
        const handleOpenDialog = (event: CustomEvent) => {
            const { type, props } = event.detail;
            setCurrentDialog(type);
            setDialogProps(props || {});
        };

        const handleCloseDialog = () => {
            // Clean up if needed
            setCurrentDialog('NONE');
            setDialogProps({});
        };

        window.addEventListener('openDialog', handleOpenDialog as EventListener);
        window.addEventListener('closeDialog', handleCloseDialog);

        return () => {
            window.removeEventListener('openDialog', handleOpenDialog as EventListener);
            window.removeEventListener('closeDialog', handleCloseDialog);
        };
    }, []);

    const closeDialog = () => {
        setCurrentDialog('NONE');
        setDialogProps({});
    };

    // Helper to open a specific dialog type
    // This is for internal use if one dialog opens another (like confirmation)
    // const openDialog = (type: DialogType, props?: any) => { ... }

    return (
        <>
            <NewProjectDialog
                isOpen={currentDialog === 'NEW_PROJECT'}
                onClose={closeDialog}
                controller={controller}
            />

            <OpenProjectDialog
                isOpen={currentDialog === 'OPEN_PROJECT'}
                onClose={closeDialog}
                controller={controller}
            />

            <ConfirmDeleteDialog
                isOpen={currentDialog === 'CONFIRM_DELETE'}
                onClose={closeDialog}
                projects={dialogProps.projects || []}
                onConfirm={() => {
                    if (dialogProps.onConfirm) dialogProps.onConfirm();
                    closeDialog();
                }}
                onCancel={() => {
                    if (dialogProps.onCancel) dialogProps.onCancel();
                    closeDialog();
                }}
            />

            <OpenMachineDialog
                isOpen={currentDialog === 'OPEN_MACHINE'}
                onClose={closeDialog}
                controller={controller}
            />

            <WorkpieceDialog
                isOpen={currentDialog === 'WORKPIECE_DIMENSIONS'}
                onClose={closeDialog}
                controller={controller}
            />

            <ToolDialog
                isOpen={currentDialog === 'TOOL_SETTINGS'}
                onClose={closeDialog}
                controller={controller}
            />

            <MaterialDialog
                isOpen={currentDialog === 'MATERIAL_SETTINGS'}
                onClose={closeDialog}
                controller={controller}
            />
        </>
    );
};

// Helper utility to dispatched events (can be imported by TopBar etc)
export const openDialog = (type: DialogType, props?: any) => {
    window.dispatchEvent(new CustomEvent('openDialog', {
        detail: { type, props }
    }));
};
