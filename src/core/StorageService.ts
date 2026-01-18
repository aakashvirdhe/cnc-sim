
import { ProjectFactory, type ProjectData, type ProjectHeader } from './ProjectFactory';

// Declare LZString globally
declare const LZString: any;

export interface StorageOptions {
    useCompression?: boolean;
    useLocalStorage?: boolean;
}

export class StorageService {
    useCompression: boolean;
    useLocalStorage: boolean;
    storage: any;
    isAvailable: boolean = false;
    isFirstRun: boolean = false;
    currentProjectHeaderCache: Partial<ProjectHeader> = {};
    projectsNameCache: { [key: string]: string } = {};

    constructor(options: StorageOptions = {}) {
        this.useCompression = options.useCompression !== undefined ? options.useCompression : true;
        this.useLocalStorage = options.useLocalStorage !== undefined ? options.useLocalStorage : true;
        this.storage = {};

        this.storageAvailable();
        this.storageCheckKeys();
    }

    get code(): string {
        return this.getData("currentProjectCode");
    }
    set code(val: string) {
        this.saveCurrentProjectCode(val);
    }

    get machine() {
        return this.currentProjectHeaderCache.machine;
    }
    set machine(val: any) {
        if (this.currentProjectHeaderCache) {
            this.currentProjectHeaderCache.machine = val;
            this.saveCurrentProjectHeader(this.currentProjectHeaderCache as ProjectHeader);
        }
    }

    get machineType(): string | undefined {
        return this.currentProjectHeaderCache.machine?.mtype;
    }
    set machineType(val: string) {
        if (this.currentProjectHeaderCache && this.currentProjectHeaderCache.machine) {
            this.currentProjectHeaderCache.machine.mtype = val;
            this.saveCurrentProjectHeader(this.currentProjectHeaderCache as ProjectHeader);
        }
    }

    get workpiece() {
        return this.currentProjectHeaderCache.workpiece;
    }
    set workpiece(val: any) {
        if (this.currentProjectHeaderCache) {
            this.currentProjectHeaderCache.workpiece = val;
            this.saveCurrentProjectHeader(this.currentProjectHeaderCache as ProjectHeader);
        }
    }

    get header() {
        return this.currentProjectHeaderCache;
    }
    set header(val: any) {
        this.saveCurrentProjectHeader(this.currentProjectHeaderCache as ProjectHeader);
    }

    get projectNames() {
        return this.projectsNameCache;
    }

    storageAvailable() {
        if (this.useLocalStorage) {
            this.storage = window.localStorage;
            try {
                const x = '__storage_test__';
                this.storage.setItem(x, x);
                this.storage.removeItem(x);
                this.isAvailable = true;
            } catch (e) {
                this.useLocalStorage = false;
            }
        }

        if (!this.useLocalStorage) {
            this.storage = {
                data: {} as any,
                getItem: function (key: string) {
                    return (this.data[key] || null);
                },
                setItem: function (key: string, data: any) {
                    this.data[key] = data;
                },
                removeItem: function (key: string) {
                    delete this.data[key];
                },
            };
            this.isAvailable = false;
        }
    }

    storageCheckKeys() {
        let data = this.storage.getItem("currentProjectCode");
        if (data === null) {
            data = "";
            this.saveData("currentProjectCode", data);
            this.isFirstRun = true;
        }

        data = this.storage.getItem("projects");
        if (data === null) {
            data = {};
            this.saveData("projects", data);
            this.isFirstRun = true;
        }
        const projectsData = this.getData("projects");
        this.projectsNameCache = {};
        for (const i in projectsData) {
            this.projectsNameCache[i] = projectsData[i].header.machine.mtype;
        }

        data = this.storage.getItem("ideSettings");
        if (data === null) {
            data = {};
            this.saveData("ideSettings", data);
            this.isFirstRun = true;
        }

        data = this.storage.getItem("currentProjectHeader");
        if (data === null) {
            data = {};
            this.saveData("currentProjectHeader", data);
            this.isFirstRun = true;
        }
        const headerData = this.getData("currentProjectHeader");
        this.currentProjectHeaderCache = headerData;
        if (headerData.name !== undefined) {
            // Safe cast or check
            this.projectsNameCache[headerData.name] = headerData.machine.mtype;
        }
    }

    getData(key: string): any {
        let data = this.storage.getItem(key);
        if (this.useCompression) {
            data = LZString.decompress(data);
        }
        // Handle null/empty data safely
        if (!data) return null;
        return JSON.parse(data);
    }

    saveData(key: string, data: any) {
        let _data = JSON.stringify(data);
        if (this.useCompression) {
            _data = LZString.compress(_data);
        }
        this.storage.setItem(key, _data);
    }

    saveCurrentProjectCode(code: string) {
        this.saveData("currentProjectCode", code);
    }

    saveCurrentProjectHeader(header: ProjectHeader) {
        this.currentProjectHeaderCache = header;
        this.saveData("currentProjectHeader", header);
    }

    saveProjects(projects: any) {
        this.projectsNameCache = {};
        for (const i in projects) {
            this.projectsNameCache[i] = projects[i].header.machine.mtype;
        }
        this.saveData("projects", projects);
    }

    createNewProject(projectName: string, machine: string, saveCurrent: boolean = true): string {
        if (saveCurrent) {
            this.saveCurrentProjectToProjectsList();
        }
        const project = ProjectFactory.createDefaultProject(machine);
        project.header.name = this.getUniqueProjectName(projectName);

        this.saveCurrentProjectCode(project.code);
        this.saveCurrentProjectHeader(project.header);

        // Update cache immediately
        if (project.header.name && project.header.machine) {
            this.projectsNameCache[project.header.name] = project.header.machine.mtype;
        }

        return project.header.name || projectName; // Fallback
    }

    loadProject(projectName: string, saveCurrent: boolean = true) {
        if (saveCurrent) {
            this.saveCurrentProjectToProjectsList();
        }
        const projects = this.getData("projects");
        if (projects && projects[projectName] !== undefined) {
            this.saveCurrentProjectHeader(projects[projectName].header);
            this.saveCurrentProjectCode(projects[projectName].code);
        }
    }

    saveCurrentProjectToProjectsList() {
        const currentProject: any = {};
        currentProject.header = this.getData("currentProjectHeader");
        if (currentProject.header === null || currentProject.header.name === undefined)
            return;
        currentProject.code = this.getData("currentProjectCode");

        const projects = this.getData("projects") || {};
        projects[currentProject.header.name] = currentProject;
        this.saveProjects(projects);
    }

    deleteProject(projectName: string) {
        const projects = this.getData("projects");
        if (projects && projects[projectName] !== undefined) {
            delete projects[projectName];
            this.saveProjects(projects);
        }
    }

    getUniqueProjectName(projectName: string): string {
        if (projectName in this.projectsNameCache) {
            let i = 0;
            let key;
            do {
                i++;
                key = projectName + "(" + i + ")";
            } while (key in this.projectsNameCache);
            projectName = key;
        }
        return projectName;
    }

    reset() {
        if (this.storage.clear) {
            this.storage.clear();
        } else {
            // Memory storage fallback reset if needed
            this.storage.data = {};
        }
    }
}
