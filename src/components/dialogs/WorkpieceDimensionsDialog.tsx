import React, { useState, useEffect } from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface WorkpieceDimensionsDialogProps {
    onClose: () => void;
}

const WorkpieceDimensionsDialog: React.FC<WorkpieceDimensionsDialogProps> = ({ onClose }) => {
    const { controller } = useController();
    const [dimensions, setDimensions] = useState<any>({});
    const [machineType, setMachineType] = useState<string>('');

    useEffect(() => {
        if (controller) {
            setMachineType(controller.getMachineType() || '');

            setDimensions({ ...controller.getWorkpiece() });
        }
    }, [controller]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDimensions({ ...dimensions, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        if (controller) {
            const values: any = {};
            for (const key in dimensions) {
                // Ensure we only pass relevant keys and convert to float
                if (key === 'x' || key === 'y' || key === 'z')
                    values[key] = parseFloat(dimensions[key]);
            }
            controller.setWorkpieceDimensions(values);
            onClose();
        }
    };

    return (
        <DialogBase title="Workpiece Dimensions" onClose={onClose}
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
            <form id="workpieceDimensions">
                <ul>
                    {machineType === 'Lathe' && (
                        <>
                            <li>
                                <label htmlFor="x">Diameter</label>
                                <input type="text" name="x" value={dimensions.x || ''} onChange={handleChange} />
                                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', paddingLeft: '110px' }}>
                                    Specifies the total diameter of the cylinder (Radius = X / 2).
                                </div>
                            </li>
                            <li>
                                <label htmlFor="z">Length</label>
                                <input type="text" name="z" value={dimensions.z || ''} onChange={handleChange} />
                            </li>
                        </>
                    )}
                    {machineType === 'Mill' && (
                        <>
                            <li>
                                <label htmlFor="x">Size X</label>
                                <input type="text" name="x" value={dimensions.x || ''} onChange={handleChange} />
                            </li>
                            <li>
                                <label htmlFor="y">Size Y</label>
                                <input type="text" name="y" value={dimensions.y || ''} onChange={handleChange} />
                            </li>
                            <li>
                                <label htmlFor="z">Size Z</label>
                                <input type="text" name="z" value={dimensions.z || ''} onChange={handleChange} />
                            </li>
                        </>
                    )}
                </ul>
            </form>
        </DialogBase>
    );
};

export default WorkpieceDimensionsDialog;
