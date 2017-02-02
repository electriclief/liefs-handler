import { liefsError, argsObj, setArgsObj, isUniqueSelector } from "liefs-lib";
import { Coord } from "liefs-coordinates";
import { Container } from "liefs-container";
export class Handler {
    constructor(...Arguments) {
        this.setArgsObj = setArgsObj;
        this.position = new Coord();
        this.isActive = true;
        this.selector = () => { return "#" + this.label; };
        this.myArgsObj = argsObj(arguments);
        this.label = this.setArgsObj("string", 0, "LayoutGroup ");
        if ("array_Layout" in this.myArgsObj) {
            if ("Layout" in this.myArgsObj)
                liefsError.badArgs("Layouts, OR Arrays of Layouts", "Got Both", "new Handler()");
            this.layouts = this.myArgsObj.array_Layout.shift();
            if (this.myArgsObj.array_Layout.length)
                new Handler(this.myArgsObj.array_Layout);
        }
        else if ("Layout" in this.myArgsObj)
            this.layouts = this.myArgsObj.Layout;
        else
            liefsError.badArgs("Layouts, OR Arrays of Layouts", "Got Both", "new Handler()");
        if (isUniqueSelector(this.selector()))
            this.el = document.querySelectorAll(this.selector())[0];
        Handler.handlers.push(this);
    }
    static watchForResizeEvent() {
        window.onresize = (e) => {
            window.clearTimeout(Handler.callbackThrottleId);
            Handler.callbackThrottleId = window.setTimeout(Handler.resizeEvent(e), Handler.resizeCallbackThrottle);
        };
    }
    static activate() {
        if (!(Handler.isActive)) {
            Handler.isActive = true;
            setTimeout(() => { if (Handler.isActive)
                Handler.startHandler(); }, Handler.delayUntilStart);
        }
    }
    static startHandler() {
        console.log("Handler Started");
        if (!Handler.handlers.length)
            H("defaultHandler", L("defaultLayout", Container.root(), (x, y) => { return true; }));
        Handler.watchForResizeEvent();
        Handler.resizeEvent();
    }
    static resizeEvent(e = null) {
        console.log("Resize Event");
        for (let eachHandler of Handler.handlers) {
            eachHandler.chooseContainer();
            eachHandler.update();
        }
    }
    update() {
        this.activeContainer.update(this.position.width, this.position.height, this.position.x, this.position.y);
        console.log(this.activeContainer.lastUpdate);
    }
    chooseContainer() {
        this.position.getSource(this.el);
        for (let eachLayout of this.layouts)
            if (eachLayout.conditionalFunction(this.position.width, this.position.height)) {
                if (!this.activeContainer)
                    console.log("Starting With Container: " + eachLayout.container.label);
                else if (this.activeContainer.label !== eachLayout.container.label)
                    console.log("Switched From Container :" + this.activeContainer.label + " to " + eachLayout.container.label);
                this.activeContainer = eachLayout.container;
                break;
            }
        if (!this.activeContainer) {
            this.activeContainer = (this.layouts[this.layouts.length - 1]).container;
            console.log("All Layout conditionalFunctions failed! Choosing last in list: " + this.activeContainer.label);
        }
    }
}
Handler.handlers = [];
Handler.isActive = false;
Handler.resizeCallbackThrottle = 0;
Handler.delayUntilStart = 200; // milliseconds
export function H(...Arguments) { return new Handler(...Arguments); }
