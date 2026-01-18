import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

interface MaterialDialogProps {
    isOpen: boolean;
    onClose: () => void;
    controller: any;
}

export const MaterialDialog: React.FC<MaterialDialogProps> = ({ isOpen, onClose, controller }) => {
    const [color, setColor] = useState('#ffffff');
    const [emissive, setEmissive] = useState('#000000');
    const [metalness, setMetalness] = useState(0.5);
    const [roughness, setRoughness] = useState(0.5);

    useEffect(() => {
        if (isOpen && controller && controller.material3D) {
            const mat = controller.material3D;
            setColor('#' + mat.color.getHexString());
            setEmissive('#' + mat.emissive.getHexString());
            setMetalness(mat.metalness);
            setRoughness(mat.roughness);
        }
    }, [isOpen, controller]);

    // Live updates
    useEffect(() => {
        if (isOpen && controller && controller.material3D) {
            const mat = controller.material3D;
            mat.color.setHex(parseInt(color.replace('#', '0x'), 16));
            mat.emissive.setHex(parseInt(emissive.replace('#', '0x'), 16));
            mat.metalness = metalness;
            mat.roughness = roughness;
            // Force render update if needed
        }
    }, [color, emissive, metalness, roughness, isOpen, controller]);

    return (
        <Modal
            title="Material Configuration"
            isOpen={isOpen}
            onClose={onClose}
            width="300px"
        >
            <div className="dialog-form">
                <div className="form-group">
                    <label htmlFor="mat_color">Color (Hex)</label>
                    <input
                        type="color"
                        id="mat_color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: '100%', height: '40px' }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="mat_emissive">Emissive (Hex)</label>
                    <input
                        type="color"
                        id="mat_emissive"
                        value={emissive}
                        onChange={(e) => setEmissive(e.target.value)}
                        style={{ width: '100%', height: '40px' }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="mat_metalness">Metalness: {metalness}</label>
                    <input
                        type="range"
                        id="mat_metalness"
                        min="0"
                        max="1"
                        step="0.1"
                        value={metalness}
                        onChange={(e) => setMetalness(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="mat_roughness">Roughness: {roughness}</label>
                    <input
                        type="range"
                        id="mat_roughness"
                        min="0"
                        max="1"
                        step="0.1"
                        value={roughness}
                        onChange={(e) => setRoughness(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
            {/* No buttons needed as changes are live, standard for material pickers */}
        </Modal>
    );
};
