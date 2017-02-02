import { liefsError, argsObj, setArgsObj } from "liefs-lib";
import { Coord } from "liefs-coordinates";
import { Container } from "liefs-container";
export class Handler {
    constructor(...Arguments) {
        this.setArgsObj = setArgsObj;
        this.position = new Coord();
        this.isActive = true;
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
        if (this.label)
            this.el = document.getElementById(this.label);
        Handler.handlers.push(this);
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
        }
        //        checkWinWH();                       // get latest co-ordinates from system
        //        establishCurrentContainer();        // Figure out what Master Container to use
        //        mapContainer();                      // update Dom
    }
    static watchForResizeEvent() {
        window.onresize = (e) => {
            window.clearTimeout(Handler.callbackThrottleId);
            Handler.callbackThrottleId = window.setTimeout(Handler.resizeEvent(e), Handler.resizeCallbackThrottle);
        };
    }
}
Handler.handlers = [];
Handler.isActive = false;
Handler.resizeCallbackThrottle = 0;
Handler.delayUntilStart = 200; // milliseconds
export function H(...Arguments) { return new Handler(...Arguments); }
