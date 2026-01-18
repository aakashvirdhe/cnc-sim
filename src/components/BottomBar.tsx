import React, { useState } from 'react';

const BottomBar: React.FC = () => {
    // State to track active toggles
    const [activeToggles, setActiveToggles] = useState<{ [key: string]: boolean }>({
        toolpath: false,
        jobPreview: false
    });

    const toggle = (key: string) => {
        setActiveToggles(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div id="bottomMenu">
            <span title="Simulate" id="runAnimationIcon">
                Simulate
            </span>

            <span
                title="Toggle Toolpath"
                id="run2DIcon"
                className={activeToggles.toolpath ? 'active' : ''}
                onClick={() => toggle('toolpath')}
            >
                Toolpath
            </span>

            <span
                title="Toggle Job Preview"
                id="run3DIcon"
                className={activeToggles.jobPreview ? 'active' : ''}
                onClick={() => toggle('jobPreview')}
            >
                Job Preview
            </span>

            <span title="Save Project" id="saveIcon">
                Save
            </span>
        </div>
    );
};

export default BottomBar;
