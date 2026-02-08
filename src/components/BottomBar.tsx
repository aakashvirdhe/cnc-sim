import React, { useState, useEffect } from 'react';
import { useController } from '../contexts/ControllerContext';

const BottomBar: React.FC = () => {
    const { controller } = useController();

    // State to track active toggles
    const [activeToggles, setActiveToggles] = useState<{ [key: string]: boolean }>({
        toolpath: true,
        jobPreview: true
    });

    useEffect(() => {
        if (controller) {
            // Sync initial state
            setActiveToggles({
                toolpath: controller.run2D,
                jobPreview: controller.run3D
            });
        }
    }, [controller]);

    const handleSimulate = () => {
        if (controller) {
            // Force true for explicit user action
            controller.runInterpreter(true);
        } else {
            console.error("Controller not initialized");
        }
    };

    const toggleToolpath = () => {
        if (controller) {
            const newVal = !activeToggles.toolpath;
            controller.run2D = newVal;
            setActiveToggles(prev => ({ ...prev, toolpath: newVal }));
        }
    };

    const toggleJobPreview = () => {
        if (controller) {
            const newVal = !activeToggles.jobPreview;
            controller.run3D = newVal;
            setActiveToggles(prev => ({ ...prev, jobPreview: newVal }));
        }
    };

    const handleSave = () => {
        if (controller) {
            controller.save(true);
        }
    };

    return (
        <div id="bottomMenu">
            <span title="Run G-Code" id="runAnimationIcon" onClick={handleSimulate}>
                Simulate
            </span>

            <span title="Play Animation" onClick={() => controller?.runAnimation(undefined)}>
                Animate
            </span>

            <span
                title="Toggle Toolpath"
                id="run2DIcon"
                style={{ color: activeToggles.toolpath ? 'green' : 'red' }}
                onClick={toggleToolpath}
            >
                Toolpath
            </span>

            <span
                title="Toggle Job Preview"
                id="run3DIcon"
                style={{ color: activeToggles.jobPreview ? 'green' : 'red' }}
                onClick={toggleJobPreview}
            >
                Job Preview
            </span>

            <span title="Save Project" id="saveIcon" onClick={handleSave} style={{ color: 'green' }}>
                Save
            </span>
        </div>
    );
};

export default BottomBar;
