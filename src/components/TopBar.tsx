
import React from 'react';

const TopBar: React.FC = () => {
    const [projectInfo, setProjectInfo] = React.useState({ name: '', machine: '' });

    React.useEffect(() => {
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
            if ((window as any).controller && (window as any).controller.storage) {
                const storage = (window as any).controller.storage;
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
    }, []);

    return (
        <div id="topMenu">
            <nav>
                <ul>
                    <li>
                        <div><span title="File" className="icon icon-folder-open"></span>File</div>
                        <ul>
                            <li>
                                <div title="New Project">New</div>
                            </li>
                            <li>
                                <div title="Open Project">Open</div>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <div><span title="Machine" className="icon icon-cogs"></span>Machine</div>
                        <ul>
                            <li>
                                <div title="Open Machine">Open Machine</div>
                            </li>
                            <li>
                                <div title="Tool">Tool</div>
                            </li>
                        </ul>
                    </li>
                    <li>
                        <div><span title="Workpiece" className="icon icon-codepen"></span>Workpiece</div>
                        <ul>
                            <li>
                                <div id="openWorkpiece" title="Workpiece dimensions">Dimensions</div>
                            </li>
                        </ul>
                    </li>
                </ul>
            </nav>

            <div id="projectInfoDisplay">
                Project: {projectInfo.name} - {projectInfo.machine}
            </div>

            <span id="machineIcon"></span>
        </div>
    );
};

export default TopBar;
