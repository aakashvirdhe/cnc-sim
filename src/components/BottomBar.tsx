import React, { useState, useEffect } from 'react';
import { useController } from '../contexts/ControllerContext';

const BottomBar: React.FC = () => {
    const { controller } = useController();

    // State to track active toggles
    const [activeToggles, setActiveToggles] = useState<{ [key: string]: boolean }>({
        toolpath: true,
        jobPreview: true
    });

    const [speed, setSpeed] = useState(1.0);

    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

    useEffect(() => {
        if (controller) {
            // Sync initial state
            setActiveToggles({
                toolpath: controller.run2D,
                jobPreview: controller.run3D
            });
            setSpeed(controller.simulationSpeed);

            const handleSpeedChange = (e: any) => {
                setSpeed(e.detail);
            };
            window.addEventListener('simulationSpeedChanged', handleSpeedChange);

            const handleClickOutside = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                if (!target.closest('.speed-control-wrapper')) {
                    setShowSpeedMenu(false);
                }
            };
            window.addEventListener('click', handleClickOutside);

            return () => {
                window.removeEventListener('simulationSpeedChanged', handleSpeedChange);
                window.removeEventListener('click', handleClickOutside);
            };
        }
    }, [controller]);


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

    const selectSpeed = (s: number) => {
        if (controller) {
            controller.simulationSpeed = s;
            setShowSpeedMenu(false);
        }
    };

    const handleSpeedSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (controller) {
            controller.simulationSpeed = parseFloat(e.target.value);
        }
    };

    return (
        <div id="bottomMenu">
            <div className="bottom-left">
                <span title="Play Animation" className="bottom-btn" onClick={() => controller?.runAnimation(undefined)}>
                    Animate
                </span>

                <span
                    title="Toggle Toolpath"
                    id="run2DIcon"
                    className="bottom-btn toggle-btn"
                    style={{ color: activeToggles.toolpath ? '#007acc' : '#888', border: activeToggles.toolpath ? '1px solid #007acc' : '1px solid #444' }}
                    onClick={toggleToolpath}
                >
                    Toolpath
                </span>

                <span
                    title="Toggle Job Preview"
                    id="run3DIcon"
                    className="bottom-btn toggle-btn"
                    style={{ color: activeToggles.jobPreview ? '#007acc' : '#888', border: activeToggles.jobPreview ? '1px solid #007acc' : '1px solid #444' }}
                    onClick={toggleJobPreview}
                >
                    Job Preview
                </span>
            </div>

            <div className="bottom-center speed-control-wrapper">
                <span
                    className="bottom-btn speed-trigger-btn"
                    onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
                >
                    Speed
                </span>

                {showSpeedMenu && (
                    <div className="speed-menu-overlay" onClick={(e) => e.stopPropagation()}>
                        <div className="speed-slider-container">
                            <input
                                type="range"
                                min="0.1"
                                max="2.0"
                                step="0.05"
                                value={speed}
                                onChange={handleSpeedSlider}
                                className="youtube-slider"
                            />
                        </div>

                        <div className="speed-presets">
                            {speedOptions.map(opt => (
                                <div
                                    key={opt}
                                    className={`speed-preset-item ${speed === opt ? 'active' : ''}`}
                                    onClick={() => selectSpeed(opt)}
                                >
                                    {opt % 1 === 0 ? opt : opt.toFixed(2)}x
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bottom-right">
                <span title="Save Project" id="saveIcon" className="bottom-btn" onClick={handleSave} style={{ color: '#4caf50' }}>
                    Save
                </span>
            </div>
        </div>
    );
};

export default BottomBar;
