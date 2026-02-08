import React, { useState, useEffect } from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface ToolDialogProps {
    onClose: () => void;
}

const ToolDialog: React.FC<ToolDialogProps> = ({ onClose }) => {
    const { controller } = useController();
    const [tool, setTool] = useState<any>({});
    const [machineType, setMachineType] = useState<string>('');

    useEffect(() => {
        if (controller) {
            setMachineType(controller.getMachineType() || '');

            const machine = controller.getMachine();
            if (machine && machine.tool) {
                setTool({ ...machine.tool });
            }
        }
    }, [controller]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTool({ ...tool, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (controller) {
            const values: any = {};
            // Map keys back to what setMachineTool expects (toolradius, toolangle)
            if (tool.radius !== undefined) values['toolradius'] = parseFloat(tool.radius);
            if (tool.angle !== undefined) values['toolangle'] = parseFloat(tool.angle);

            controller.setMachineTool(values);
            onClose();
        }
    };

    if (machineType !== 'Lathe' && machineType !== 'Mill') {
        return (
            <DialogBase title="Tool" onClose={onClose}
                buttons={
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                        <span className="ui-button-text">Ok</span>
                    </button>
                }>
                <ul><li>{machineType} does not support tool settings</li></ul>
            </DialogBase>
        );
    }

    return (
        <DialogBase title="Tool" onClose={onClose}
            buttons={
                <>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={handleSave}>
                        <span className="ui-button-text">Save</span>
                    </button>
                    <button type="button" className="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only" onClick={onClose}>
                        <span className="ui-button-text">Cancel</span>
                    </button>
                </>
            }>
            <form id="menuTool">
                <ul>
                    <li>
                        <label htmlFor="radius">Tool radius</label>
                        <input type="text" name="radius" value={tool.radius || ''} onChange={handleChange} />
                    </li>
                    {machineType === 'Mill' && (
                        <li>
                            <label htmlFor="angle">Tool angle</label>
                            <input type="text" name="angle" value={tool.angle || ''} onChange={handleChange} />
                        </li>
                    )}
                </ul>
            </form>
        </DialogBase>
    );
};

export default ToolDialog;
