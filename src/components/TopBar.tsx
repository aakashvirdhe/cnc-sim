import React, { useState, useEffect } from 'react';
import './TopBar.css';
import { useController } from '../contexts/ControllerContext';
import NewProjectDialog from './dialogs/NewProjectDialog';
import OpenProjectDialog from './dialogs/OpenProjectDialog';
import OpenMachineDialog from './dialogs/OpenMachineDialog';
import WorkpieceDimensionsDialog from './dialogs/WorkpieceDimensionsDialog';
import MaterialSettingsDialog from './dialogs/MaterialSettingsDialog';
import ToolDialog from './dialogs/ToolDialog';
import GuideSelectionDialog from './dialogs/GuideSelectionDialog';
import SaveAsDialog from './dialogs/SaveAsDialog';
import AddFromLocalDialog from './dialogs/AddFromLocalDialog';
import ErrorDialog from './dialogs/ErrorDialog';

type DialogType = 'NEW_PROJECT' | 'OPEN_PROJECT' | 'OPEN_MACHINE' | 'WORKPIECE' | 'MATERIAL' | 'TOOL' | 'GUIDE_SELECTION' | 'SAVE_AS' | null;

const TopBar: React.FC = () => {
    const { controller } = useController();
    const [projectInfo, setProjectInfo] = useState({ name: '', machine: '' });
    const [activeDialog, setActiveDialog] = useState<DialogType>(null);
    const [localFileData, setLocalFileData] = useState<{name: string, content: string} | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                if (!content || content.trim().length === 0) {
                    setErrorMsg("File is empty or could not be read.");
                    return;
                }
                if (content.indexOf('\0') !== -1) {
                    setErrorMsg("File appears to be binary and cannot be processed.");
                    return;
                }
                // Close any active dialogs like Open or New Project
                setActiveDialog(null);
                setLocalFileData({ name: file.name, content });
            } catch (err) {
                setErrorMsg("Error parsing file content.");
            }
        };
        reader.onerror = () => {
            setErrorMsg("Failed to read the file. It may be corrupted or permission denied.");
        };
        reader.readAsText(file);
        
        e.target.value = '';
    };

    const triggerLocalFileLoad = () => {
        fileInputRef.current?.click();
    };

    useEffect(() => {
        const handleProjectUpdate = (e: CustomEvent) => {
            if (e.detail) {
                setProjectInfo({
                    name: e.detail.projectName,
                    machine: e.detail.machineType
                });
            }
        };

        window.addEventListener('projectUpdated', handleProjectUpdate as EventListener);

        // Initial check if controller exists (might be racing)
        const checkController = setInterval(() => {
            if (controller && controller.storage) {
                const storage = controller.storage;
                if (storage.header) {
                    setProjectInfo({
                        name: storage.header.name || 'Untitled',
                        machine: storage.machineType || 'Lathe'
                    });
                    clearInterval(checkController);
                }
            }
        }, 500);

        return () => {
            window.removeEventListener('projectUpdated', handleProjectUpdate as EventListener);
            clearInterval(checkController);
        };
    }, [controller]);
    return (
        <div id="topMenu">
            <nav>
                <ul>
                    <li>
                        <div><span title="File" className="icon icon-folder-open"></span>File</div>
                        <ul>
                            <li onClick={() => setActiveDialog('NEW_PROJECT')}>
                                <div title="New Project">New</div>
                            </li>
                            <li onClick={triggerLocalFileLoad}>
                                <div title="Browse">Browse</div>
                            </li>
                            <li onClick={() => setActiveDialog('OPEN_PROJECT')}>
                                <div title="Open Project">Open</div>
                            </li>
                            <li onClick={() => setActiveDialog('SAVE_AS')}>
                                <div title="Save As">Save As...</div>
                            </li>
                            <li onClick={() => {
                                if (controller && controller.storage) {
                                    controller.storage.downloadCurrentGCode();
                                }
                            }}>
                                <div title="Download G-Code">Download G-Code</div>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <div><span title="Machine" className="icon icon-cogs"></span>Machine</div>
                        <ul>
                            <li onClick={() => setActiveDialog('OPEN_MACHINE')}>
                                <div title="Open Machine">Open Machine</div>
                            </li>
                            <li onClick={() => setActiveDialog('TOOL')}>
                                <div title="Tool">Tool</div>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <div><span title="Workpiece" className="icon icon-codepen"></span>Workpiece</div>
                        <ul>
                            <li onClick={() => setActiveDialog('WORKPIECE')}>
                                <div id="openWorkpiece" title="Workpiece dimensions">Dimensions</div>
                            </li>
                            <li onClick={() => setActiveDialog('MATERIAL')}>
                                <div title="Material Settings">Material</div>
                            </li>
                        </ul>
                    </li>
                    <li onClick={() => setActiveDialog('GUIDE_SELECTION')}>
                        <div title="Help & Guides"><span className="icon icon-info"></span>Guide</div>
                    </li>
                </ul >
            </nav >

            <div id="projectInfoDisplay">
                Project: {projectInfo.name} - {projectInfo.machine}
            </div>

            <span id="machineIcon" className={`icon-${projectInfo.machine.toLowerCase()}`}></span>

            <input type="file" style={{ display: 'none' }} ref={fileInputRef} accept=".nc,.txt,.gcode" onChange={handleFileSelected} />

            {activeDialog === 'NEW_PROJECT' && <NewProjectDialog onClose={() => setActiveDialog(null)} onAddFromLocal={triggerLocalFileLoad} />}
            {activeDialog === 'OPEN_PROJECT' && <OpenProjectDialog onClose={() => setActiveDialog(null)} onAddFromLocal={triggerLocalFileLoad} />}
            {activeDialog === 'SAVE_AS' && <SaveAsDialog onClose={() => setActiveDialog(null)} />}
            {activeDialog === 'OPEN_MACHINE' && <OpenMachineDialog onClose={() => setActiveDialog(null)} />}
            {activeDialog === 'WORKPIECE' && <WorkpieceDimensionsDialog onClose={() => setActiveDialog(null)} />}
            {activeDialog === 'MATERIAL' && <MaterialSettingsDialog onClose={() => setActiveDialog(null)} />}
            {activeDialog === 'TOOL' && <ToolDialog onClose={() => setActiveDialog(null)} />}
            {activeDialog === 'GUIDE_SELECTION' && (
                <GuideSelectionDialog
                    onClose={() => setActiveDialog(null)}
                    onSelectGuide={(type) => {
                        setActiveDialog(null);
                        window.dispatchEvent(new CustomEvent('openSpecificGuide', { detail: type }));
                    }}
                />
            )}
            {localFileData && <AddFromLocalDialog fileData={localFileData} onClose={() => setLocalFileData(null)} />}
            {errorMsg && <ErrorDialog message={errorMsg} onClose={() => setErrorMsg(null)} />}
        </div >
    );
};

export default TopBar;
