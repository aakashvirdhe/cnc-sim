import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

interface ToolDialogProps {
    isOpen: boolean;
    onClose: () => void;
    controller: any;
}

export const ToolDialog: React.FC<ToolDialogProps> = ({ isOpen, onClose, controller }) => {
    const [machineType, setMachineType] = useState<string>('Lathe');
    const [toolData, setToolData] = useState<any>({});
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (isOpen && controller) {
            const type = controller.getMachineType();
            setMachineType(type);

            if (type === 'Lathe' || type === 'Mill') {
                setIsSupported(true);
                const machine = controller.getMachine();
                if (machine && machine.tool) {
                    setToolData({ ...machine.tool });
                }
            } else {
                setIsSupported(false);
            }
        }
    }, [isOpen, controller]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setToolData({
            ...toolData,
            [e.target.name]: parseFloat(e.target.value) || 0
        });
    };

    const handleSave = () => {
        if (isSupported) {
            controller.setMachineTool(toolData);
        }
        onClose();
    };

    return (
        <Modal
            title="Tool Settings"
            isOpen={isOpen}
            onClose={onClose}
            width="400px"
        >
            <div className="dialog-form">
                {!isSupported ? (
                    <p>{machineType} does not support tool settings.</p>
                ) : (
                    <>
                        <div className="form-group">
                            <label htmlFor="tool_radius">Tool Radius</label>
                            <input
                                type="number"
                                id="tool_radius"
                                name="radius"
                                value={toolData.radius || 0}
                                onChange={handleChange}
                                className="form-control"
                                step="0.1"
                            />
                        </div>
                        {machineType === 'Mill' && (
                            <div className="form-group">
                                <label htmlFor="tool_angle">Tool Angle</label>
                                <input
                                    type="number"
                                    id="tool_angle"
                                    name="angle"
                                    value={toolData.angle || 0}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>
                        )}
                    </>
                )}

                <div className="dialog-buttons">
                    <button onClick={handleSave}>{isSupported ? 'Save' : 'Ok'}</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </Modal>
    );
};
