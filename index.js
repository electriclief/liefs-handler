import { liefsError, argsObj, setArgsObj, isUniqueSelector, directiveSetStyles, px } from "liefs-lib";
import { Coord } from "liefs-coordinates";
import { Item } from "liefs-item";
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
    static createDivList() {
        for (let id of Object.keys(Item.items))
            if (Item.items[id][0].el)
                Handler.showObj[id] = { el: Item.items[id][0].el, show: false };
        for (let id of Object.keys(Container.containers))
            if (Container.containers[id].el)
                Handler.showObj[id] = { el: Container.containers[id].el, show: false };
        for (let handler of Handler.handlers)
            if (handler.el)
                Handler.showObj[handler.label] = { el: handler.el, show: false };
    }
    static startHandler() {
        console.log("Handler Started");
        if (!Handler.handlers.length)
            H("defaultHandler", L("defaultLayout", Container.root(), (x, y) => { return true; }));
        Handler.createDivList();
        console.log(Handler.showObj);
        Handler.watchForResizeEvent();
        Handler.resizeEvent();
    }
    static resizeEvent(e = null) {
        console.log("Resize Event");
        Handler.Hide();
        for (let eachHandler of Handler.handlers) {
            eachHandler.chooseContainer();
            eachHandler.update();
        }
    }
    static Hide() { for (let eachKey of Object.keys(Handler.showObj))
        Handler.showObj[eachKey].show = false; }
    /*
        smallit(e: HTMLElement, visibility: string): void {
            let stylesObj: any;
            if (visibility === "hidden") stylesObj = {visibility: "hidden", left: "1px", top: "1px", width: "1px", height: "1px"};
            else stylesObj = {visibility: "visible"};
            directiveSetStyles(e, stylesObj);
        }
    */
    update() {
        let coord;
        this.activeContainer.update(this.position.width, this.position.height, this.position.x, this.position.y);
        for (let eachKey of Object.keys(this.activeContainer.lastUpdate))
            if (eachKey in Handler.showObj) {
                coord = this.activeContainer.lastUpdate[eachKey];
                Handler.showObj[eachKey].show = true;
                directiveSetStyles(Handler.showObj[eachKey].el, {
                    visible: true,
                    left: px(coord.x),
                    top: px(coord.y),
                    width: px(coord.width),
                    height: px(coord.height)
                });
            }
    }
    chooseContainer() {
        let isSwitch = false;
        this.position.getSource(this.el);
        for (let eachLayout of this.layouts)
            if (eachLayout.conditionalFunction(this.position.width, this.position.height)) {
                if (!this.activeContainer) {
                    console.log("Starting With Container: " + eachLayout.container.label);
                    isSwitch = true;
                }
                else if (this.activeContainer.label !== eachLayout.container.label) {
                    isSwitch = true;
                    console.log("Switched From Container :" + this.activeContainer.label + " to " + eachLayout.container.label);
                    this.activeContainer = eachLayout.container;
                    break;
                }
                if (!this.activeContainer) {
                    isSwitch = true;
                    this.activeContainer = (this.layouts[this.layouts.length - 1]).container;
                    console.log("All Layout conditionalFunctions failed! Choosing last in list: " + this.activeContainer.label);
                }
            }
        return isSwitch;
    }
}
Handler.handlers = [];
Handler.isActive = false;
Handler.resizeCallbackThrottle = 0;
Handler.delayUntilStart = 200; // milliseconds
Handler.showObj = {};
export function H(...Arguments) { return new Handler(...Arguments); }
