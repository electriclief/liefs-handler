import { liefsError, TypeOf, CheckArgTypes, throwType, isStart, argsObj, setArgsObj, isUniqueSelector } from "liefs-lib";
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
    static DivIdsInvisible: Array<string> = [];
    static DivIdsVisible: Array<string> = [];

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
    static startHandler() {
        console.log("Handler Started");
        if (!Handler.handlers.length)
            H("defaultHandler", L("defaultLayout", Container.root(), (x, y) => { return true; }));
        Handler.watchForResizeEvent();
        Handler.resizeEvent();
    }
    static resizeEvent(e: Event = null) {
        console.log("Resize Event");
        let showIds: Array<string> = [];
        for (let eachHandler of Handler.handlers) {
            eachHandler.chooseContainer();
            eachHandler.update();
            showIds = uniqueArray(showIds, Object.keys(eachHandler.activeContainer.lastUpdate));
            ;
        }
    }

    ShowAndHide(): void {
        let index;
        Handler.DivIdsInvisible = [];
        Handler.DivIdsVisible = [];
        for (let key in items) if (el(key)) DivIdsInvisible.push(key);

        for (let itemId in update(1000, 1000, container)) {
            index = DivIdsInvisible.indexOf(itemId);
            if (index > -1) {
                DivIdsInvisible.splice(index, 1);
                DivIdsVisible.push(itemId);

                smallit(el(itemId), "visible");
                if (isItIn(itemId, dragBars)) smallit(el(itemId + "_dragBar"), "visible");
            }
        }
        for (let ItemId of DivIdsInvisible) {
            smallit(el(ItemId), "hidden");
            if (isItIn(ItemId, dragBars)) smallit(el(ItemId + "_dragBar"), "hidden");
        }
    }

    smallit(e: HTMLElement, visibility: string): void {
        let stylesObj: any;
        if (visibility === "hidden") stylesObj = {visibility: "hidden", left: "1px", top: "1px", width: "1px", height: "1px"};
        else stylesObj = {visibility: "visible"};
        directiveSetStyles(e, stylesObj);
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
export function H(...Arguments: Array<any>) { return new Handler(...Arguments); }
