import { liefsError, argsObj, setArgsObj, isUniqueSelector, directiveSetStyles, px } from "liefs-lib"; /* , TypeOf, CheckArgTypes, throwType, isStart */
import { Coord } from "liefs-coordinates";
import { Item } from "liefs-item"; /* , I, v, h, items, getItem */
import { Container } from "liefs-container"; /* , containers, getContainer  */
import { Layout } from "liefs-layout";

export class Handler {
    static handlers: Array<Handler> = [];
    static isActive: boolean = false;
    static callbackThrottleId: any;
    static resizeCallbackThrottle: number = 0;
    static delayUntilStart: number = 200; // milliseconds
    static showObj: { [index: string]: { show: boolean; el: Element; } } = {};
    static pageTitle() { return "var Handler.pageTitle = function () { return 'Title ' + whatever}"; }
    static urlRoot: string;
    static urlSuffix: string;
    static urlCurrent: string;
    static pushPage() {

    }

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

        // let style = document.createElement("style");
        // style.type = "text/css";
        // style.innerHTML = ".Hdragbar { position: fixed; }";
        // style.innerHTML += ".Vdragbar { position: fixed; }";
        // document.getElementsByTagName("head")[0].appendChild(style);
//        Handler.urlCurrent = window.location.href;
//        if (Handler.urlCurrent.slice(0, 4) !== "file") (Handler.urlCurrent = "/" + myIndexOf(Handler.urlCurrent, "/", 2, 0));
        if (!Handler.handlers.length)
            H("defaultHandler", L("defaultLayout", Container.root(), (x, y) => { return true; }));
        Handler.createDivList();
        //        console.log(Handler.showObj);
        Handler.watchForResizeEvent();
        Handler.resizeEvent();
    }
    static resizeEvent(e: Event = null) {
//        console.log("Resize Event");
        Handler.Hide();
        for (let eachHandler of Handler.handlers) {
            eachHandler.chooseContainer();
            eachHandler.update();
        }
        for (let eachKey of Object.keys(Handler.showObj))
            if (!Handler.showObj[eachKey].show) {
                directiveSetStyles(Handler.showObj[eachKey].el, {
                    visibility: "hidden", left: "1px", top: "1px", width: "1px", height: "1px"
                });
            } else if (Item.get(eachKey) && Item.get(eachKey).dragBar) Item.get(eachKey).dragBar.update();
    }
    static Hide() { for (let eachKey of Object.keys(Handler.showObj)) Handler.showObj[eachKey].show = false; }
    update() {
        let coord: Coord; let pageItem: Item;
        this.activeContainer.update(this.position.width, this.position.height, this.position.x, this.position.y);
        for (let origKey of Object.keys(this.activeContainer.lastUpdate)) {
            if (origKey in Handler.showObj) {
                coord = this.activeContainer.lastUpdate[origKey];
                pageItem = Item.page(this.activeContainer.itemByLabel(origKey));
                Handler.showObj[pageItem.label].show = true;
                directiveSetStyles(pageItem.el, {
                    visibility: "visible", left: px(coord.x), top: px(coord.y), width: px(coord.width), height: px(coord.height)
                });
            }
        }
    }
    chooseContainer() {
        this.position.getSource(this.el);
        for (let eachLayout of this.layouts)
            if (eachLayout.conditionalFunction(this.position.width, this.position.height)) {
                if (!this.activeContainer) {
                    console.log("Starting With Container: " + eachLayout.container.label);
                }
                else if (this.activeContainer.label !== eachLayout.container.label) {
                    console.log("Switched From Container :" + this.activeContainer.label + " to " + eachLayout.container.label);
                }
                this.activeContainer = eachLayout.container;
                break;
            }
        if (!this.activeContainer) {
            this.activeContainer = (this.layouts[this.layouts.length - 1]).container;
            console.log("All Layout conditionalFunctions failed! Choosing last in list: " + this.activeContainer.label);
        }
    }
}
export function H(...Arguments: Array<any>) { return new Handler(...Arguments); }
