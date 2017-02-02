import { liefsError, argsObj, setArgsObj, isUniqueSelector } from "liefs-lib";
import { Coord } from "liefs-coordinates";
import { Item, items } from "liefs-item";
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
                Handler.DivObj[id] = Item.items[id][0].el;
        for (let id of Object.keys(Container.containers))
            if (Container.containers[id].el)
                Handler.DivObj[id] = Container.containers[id].el;
        for (let handler of Handler.handlers)
            if (handler.el)
                Handler.DivObj[handler.label] = handler.el;
    }
    static startHandler() {
        console.log("Handler Started");
        if (!Handler.handlers.length)
            H("defaultHandler", L("defaultLayout", Container.root(), (x, y) => { return true; }));
        Handler.createDivList();
        console.log(Handler.DivObj);
        Handler.watchForResizeEvent();
        Handler.resizeEvent();
    }
    static resizeEvent(e = null) {
        console.log("Resize Event");
        //        let fullUpdate: { [index: string]: Container; } = {};
        let showIds = [];
        for (let eachHandler of Handler.handlers) {
            eachHandler.chooseContainer();
            eachHandler.update();
        }
        //        Handler.showAndHide(showIds);
    }
    static showAndHide() {
        let index;
        Handler.DivIdsInvisible = Object.keys(Item.items).concat(Object.keys(Container.containers)).concat();
        uniqueArray(Object.keys(Item.items), Object.keys(Container.containers));
        Handler.DivIdsVisible = [];
        for (let key in items)
            if (el(key))
                DivIdsInvisible.push(key);
        for (let itemId in update(1000, 1000, container)) {
            index = DivIdsInvisible.indexOf(itemId);
            if (index > -1) {
                DivIdsInvisible.splice(index, 1);
                DivIdsVisible.push(itemId);
                smallit(el(itemId), "visible");
                if (isItIn(itemId, dragBars))
                    smallit(el(itemId + "_dragBar"), "visible");
            }
        }
        for (let ItemId of DivIdsInvisible) {
            smallit(el(ItemId), "hidden");
            if (isItIn(ItemId, dragBars))
                smallit(el(ItemId + "_dragBar"), "hidden");
        }
    }
    smallit(e, visibility) {
        let stylesObj;
        if (visibility === "hidden")
            stylesObj = { visibility: "hidden", left: "1px", top: "1px", width: "1px", height: "1px" };
        else
            stylesObj = { visibility: "visible" };
        directiveSetStyles(e, stylesObj);
    }
    update() {
        this.activeContainer.update(this.position.width, this.position.height, this.position.x, this.position.y);
        //      console.log(this.activeContainer.lastUpdate);
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
Handler.DivObj = {};
Handler.DivIdsInvisible = [];
Handler.DivIdsVisible = [];
export function H(...Arguments) { return new Handler(...Arguments); }
