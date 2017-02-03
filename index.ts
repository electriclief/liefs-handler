import { liefsError, TypeOf, CheckArgTypes, throwType, isStart, argsObj, setArgsObj, isUniqueSelector, directiveSetStyles, px } from "liefs-lib";
import { Coord } from "liefs-coordinates";
import { Item, I, v, h, items, getItem } from "liefs-item";
import { Container, containers, getContainer } from "liefs-container";
import { Layout } from "liefs-layout";

export class Handler {
    static handlers: Array<Handler> = [];
    static isActive: boolean = false;
    static callbackThrottleId: any;
    static resizeCallbackThrottle: number = 0;
    static delayUntilStart: number = 200; // milliseconds
    static showObj: { [index: string]: { show: boolean; el: Element; } } = {};

    label: string;
    myArgsObj: any;
    setArgsObj: Function = setArgsObj;
    position: Coord = new Coord();
    el: any;
    isActive: boolean = true;
    layouts: Array<Layout>;
    activeContainer: Container;
    selector = () => { return "#" + this.label; };

    constructor(...Arguments: any[]) {
        this.myArgsObj = argsObj(arguments);
        this.label = this.setArgsObj("string", 0, "LayoutGroup ");

        if ("array_Layout" in this.myArgsObj) {
            if ("Layout" in this.myArgsObj) liefsError.badArgs("Layouts, OR Arrays of Layouts", "Got Both", "new Handler()");
            this.layouts = this.myArgsObj.array_Layout.shift();
            if (this.myArgsObj.array_Layout.length) new Handler(this.myArgsObj.array_Layout);
        } else if ("Layout" in this.myArgsObj)
            this.layouts = this.myArgsObj.Layout;
        else liefsError.badArgs("Layouts, OR Arrays of Layouts", "Got Both", "new Handler()");

        if (isUniqueSelector(this.selector())) this.el = document.querySelectorAll(this.selector())[0];

        Handler.handlers.push(this);
    }
    static watchForResizeEvent(): void {
        window.onresize = (e: Event) => {
            window.clearTimeout(Handler.callbackThrottleId);
            Handler.callbackThrottleId = window.setTimeout(Handler.resizeEvent(e), Handler.resizeCallbackThrottle);
        };
    }
    static activate() {
        if (!(Handler.isActive)) {
            Handler.isActive = true;
            setTimeout(() => { if (Handler.isActive) Handler.startHandler(); }, Handler.delayUntilStart);
        }
    }
    static createDivList() {
        for (let id of Object.keys(Item.items))
            if (Item.items[id][0].el) Handler.showObj[id] = { el: Item.items[id][0].el, show: false };
        for (let id of Object.keys(Container.containers))
            if (Container.containers[id].el) Handler.showObj[id] = { el: Container.containers[id].el, show: false };
        for (let handler of Handler.handlers)
            if (handler.el) Handler.showObj[handler.label] = { el: handler.el, show: false };
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
    static resizeEvent(e: Event = null) {
        console.log("Resize Event");
        Handler.Hide();
        for (let eachHandler of Handler.handlers) {
            eachHandler.chooseContainer();
            eachHandler.update();
        }
        for (let eachKey of Object.keys(Handler.showObj))
            if (!Handler.showObj[eachKey].show) {
                console.log("before Hidden"); console.log(Handler.showObj[eachKey].el);
                directiveSetStyles(Handler.showObj[eachKey].el, {
                    visibility: "hidden", left: "1px", top: "1px", width: "1px", height: "1px"
                });
                console.log("After Hidden"); console.log(Handler.showObj[eachKey].el);
            }
    }
    static Hide() { for (let eachKey of Object.keys(Handler.showObj)) Handler.showObj[eachKey].show = false; }
    update() {
        let coord: Coord;
        this.activeContainer.update(this.position.width, this.position.height, this.position.x, this.position.y);
        for (let eachKey of Object.keys(this.activeContainer.lastUpdate)) {
//            console.log(eachKey + " of " + Object.keys(this.activeContainer.lastUpdate));
            if (eachKey in Handler.showObj) {
                coord = this.activeContainer.lastUpdate[eachKey];
                Handler.showObj[eachKey].show = true;
                console.log("before Show"); console.log(Handler.showObj[eachKey].el);
                directiveSetStyles(Handler.showObj[eachKey].el, {
                    visibility: "visible", left: px(coord.x), top: px(coord.y), width: px(coord.width), height: px(coord.height)
                });
                console.log("After Show"); console.log(Handler.showObj[eachKey].el);
            }
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
export function H(...Arguments: Array<any>) { return new Handler(...Arguments); }
