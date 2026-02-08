import React, { useState, useEffect } from 'react';
import DialogBase from './DialogBase';
import { useController } from '../../contexts/ControllerContext';

interface MaterialSettingsDialogProps {
    onClose: () => void;
}

const MaterialSettingsDialog: React.FC<MaterialSettingsDialogProps> = ({ onClose }) => {
    const { controller } = useController();
    const [color, setColor] = useState('#aaaaaa');
    const [metalness, setMetalness] = useState(0.7);
    const [roughness, setRoughness] = useState(0.3);
    const [emissive, setEmissive] = useState('#000000');

    useEffect(() => {
        if (controller && controller.material3D) {
            const mat = controller.material3D;
            setColor('#' + mat.color.getHexString());
            setEmissive('#' + mat.emissive.getHexString());
            setMetalness(mat.metalness);
            setRoughness(mat.roughness);
        }
    }, [controller]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setColor(val);
        if (controller && controller.material3D) {
            controller.material3D.color.setHex(val.replace('#', '0x'));
        }
    };

    const handleEmissiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEmissive(val);
        if (controller && controller.material3D) {
            controller.material3D.emissive.setHex(val.replace('#', '0x'));
        }
    };

    const handleMetalnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setMetalness(val);
        if (controller && controller.material3D) {
            controller.material3D.metalness = val;
        }
    };

    const handleRoughnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setRoughness(val);
        if (controller && controller.material3D) {
            controller.material3D.roughness = val;
        }
    };

    return (
        <DialogBase title="Material Configuration" onClose={onClose} width="300px">
            <div style={{ padding: '10px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                    Color (Hex):
                    <input type="color" value={color} onChange={handleColorChange} style={{ width: '100%', height: '40px', marginTop: '5px' }} />
                </label>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                    Emissiveness (Hex):
                    <input type="color" value={emissive} onChange={handleEmissiveChange} style={{ width: '100%', height: '40px', marginTop: '5px' }} />
                </label>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                    Metalness: <span id="valMetal">{metalness}</span><br />
                    <input type="range" min="0" max="1" step="0.1" value={metalness} onChange={handleMetalnessChange} style={{ width: '100%' }} />
                </label>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                    Roughness: <span id="valRough">{roughness}</span><br />
                    <input type="range" min="0" max="1" step="0.1" value={roughness} onChange={handleRoughnessChange} style={{ width: '100%' }} />
                </label>
            </div>
        </DialogBase>
    );
};

export default MaterialSettingsDialog;
