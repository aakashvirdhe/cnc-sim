
import React from 'react';

const TopBar: React.FC = () => {
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
            <span id="machineIcon"></span>
        </div>
    );
};

export default TopBar;
