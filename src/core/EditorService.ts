
// Declare Ace global
declare const ace: any;

export class EditorService {
    editor: any;
    unsaved: boolean;
    codeChangedSubscribers: Array<(code: string, ev: any) => void>;

    constructor() {
        // Warning: This assumes a DOM element with id="editor" exists.
        // In the React lifecycle, this class should be instantiated inside useEffect 
        // after the component has mounted.
        this.editor = ace.edit("editor");
        this.editor.$blockScrolling = Infinity;
        this.editor.setTheme("ace/theme/monokai");
        this.editor.getSession().setMode("ace/mode/gcode");
        this.editor.getSession().setUseWrapMode(true);
        this.editor.getSession().setTabSize(4);
        this.editor.setFontSize(18);
        this.unsaved = false;
        this.codeChangedSubscribers = [];

        const context = this;
        this.editor.on("change", function (e: any) {
            if (e.isLarge)
                return;
            context.codeChanged(e);
        });
    }

    codeChanged(ev: any) {
        const code = this.getCode();
        for (let i = 0; i < this.codeChangedSubscribers.length; i++) {
            this.codeChangedSubscribers[i](code, ev);
        }
    }

    subscribeToCodeChanged(func: (code: string, ev: any) => void) {
        this.codeChangedSubscribers.push(func);
    }

    getCode(): string {
        return this.editor.getValue();
    }

    setCode(code: string) {
        this.editor.setValue(code, -1);
    }

    readOnly(ro: boolean) {
        this.editor.setReadOnly(ro);
    }
}
