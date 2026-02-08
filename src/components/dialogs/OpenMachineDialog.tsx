import React from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface OpenMachineDialogProps {
    onClose: () => void;
}

const OpenMachineDialog: React.FC<OpenMachineDialogProps> = ({ onClose }) => {
    const { controller } = useController();

    const handleOpen = (machineName: string) => {
        if (controller) {
            controller.openMachine(machineName);
            onClose();
        }
    };

    return (
        <DialogBase title="Open Machine" onClose={onClose}
            buttons={
                <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                    <span className="ui-button-text">Cancel</span>
                </button>
            }>
            <ul className="tableList">
                <li onClick={() => handleOpen('Lathe')} style={{ cursor: 'pointer' }}><span className="icon icon-lathe"></span>Lathe</li>
                <li onClick={() => handleOpen('Mill')} style={{ cursor: 'pointer' }}><span className="icon icon-mill"></span>Mill</li>
            </ul>
        </DialogBase>
    );
};

export default OpenMachineDialog;
