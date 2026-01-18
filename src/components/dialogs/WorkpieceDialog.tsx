import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

interface WorkpieceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    controller: any;
}

export const WorkpieceDialog: React.FC<WorkpieceDialogProps> = ({ isOpen, onClose, controller }) => {
    const [machineType, setMachineType] = useState<string>('Lathe');
    const [values, setValues] = useState<any>({});

    useEffect(() => {
        if (isOpen && controller) {
            setMachineType(controller.getMachineType());
            const wp = controller.getWorkpiece();
            // Clone values to avoid direct mutation
            setValues({ ...wp });
        }
    }, [isOpen, controller]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues({
            ...values,
            [e.target.name]: parseFloat(e.target.value) || 0
        });
    };

    const handleSave = () => {
        controller.setWorkpieceDimensions(values);
        onClose();
    };

    return (
        <Modal
            title="Workpiece Dimensions"
            isOpen={isOpen}
            onClose={onClose}
            width="400px"
        >
            <div className="dialog-form">
                {machineType === 'Lathe' ? (
                    <>
                        <div className="form-group">
                            <label htmlFor="wp_x">Diameter</label>
                            <input
                                type="number"
                                id="wp_x"
                                name="x"
                                value={values.x || ''}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="wp_z">Length</label>
                            <input
                                type="number"
                                id="wp_z"
                                name="z"
                                value={values.z || ''}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="form-group">
                            <label htmlFor="wp_x">Size X</label>
                            <input
                                type="number"
                                id="wp_x"
                                name="x"
                                value={values.x || ''}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="wp_y">Size Y</label>
                            <input
                                type="number"
                                id="wp_y"
                                name="y"
                                value={values.y || ''}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="wp_z">Size Z</label>
                            <input
                                type="number"
                                id="wp_z"
                                name="z"
                                value={values.z || ''}
                                onChange={handleChange}
                                className="form-control"
                            />
                        </div>
                    </>
                )}

                <div className="dialog-buttons">
                    <button onClick={handleSave}>Save</button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </Modal>
    );
};
