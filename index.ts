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

  label: string;
  myArgsObj: any;
  setArgsObj: Function = setArgsObj;
  position: Coord = new Coord();
  el: any;
  isActive: boolean = true;
  layouts: Array<Layout>;
  activeContainer: Container;

  constructor(...Arguments: any[]) {
    this.myArgsObj = argsObj(arguments);
    this.label = this.setArgsObj("string", 0 , "LayoutGroup ");

    if ("array_Layout" in this.myArgsObj) {
      if ("Layout" in this.myArgsObj) liefsError.badArgs("Layouts, OR Arrays of Layouts", "Got Both", "new Handler()");
      this.layouts = this.myArgsObj.array_Layout.shift();
      if (this.myArgsObj.array_Layout.length) new Handler(this.myArgsObj.array_Layout);
    } else if ("Layout" in this.myArgsObj)
      this.layouts = this.myArgsObj.Layout;
    else liefsError.badArgs("Layouts, OR Arrays of Layouts", "Got Both", "new Handler()");

    if (this.label) this.el = document.getElementById(this.label);
    Handler.handlers.push(this);
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
      H("defaultHandler",  L("defaultLayout", Container.root(), (x, y) => {return true; }));
    Handler.watchForResizeEvent();
    Handler.resizeEvent();
  }

  static resizeEvent(e: Event = null) {
    console.log("Resize Event");
    for (let eachHandler of Handler.handlers) {

//      console.log( Coord.byWin() );
    }
//        checkWinWH();                       // get latest co-ordinates from system
//        establishCurrentContainer();        // Figure out what Master Container to use
//        mapContainer();                      // update Dom
    }
  static watchForResizeEvent(): void {
    window.onresize = (e: Event) => {
      window.clearTimeout(Handler.callbackThrottleId);
      Handler.callbackThrottleId = window.setTimeout(Handler.resizeEvent(e), Handler.resizeCallbackThrottle);
    };
  }
}
export function H(...Arguments: Array<any>) { return new Handler(...Arguments); }
