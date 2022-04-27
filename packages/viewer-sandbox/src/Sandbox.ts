import { Viewer } from '@speckle/viewer';
import { Pane } from 'tweakpane'

export default class Sandbox {
    private viewer: Viewer;
    private pane: Pane;

    public constructor(viewer: Viewer) {
        this.viewer = viewer;
        this.pane = new Pane({ title: 'Sandbox', expanded: true});
    }


    public makeGenericUI() {
        const clearButton = this.pane.addButton({
            title: 'Clear All',
          });
          
        clearButton.on('click', () => {
            this.viewer.unloadAll();
        });
    }
}