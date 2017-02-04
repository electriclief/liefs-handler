
 class Handler {
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

        let style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = ".Hdragbar { position: fixed; }";
        style.innerHTML += ".Vdragbar { position: fixed; }";
        document.getElementsByTagName("head")[0].appendChild(style);

        document.body.onmousedown = function(e: Event) {
           let f = window.event ? event.srcElement : e.target;
           if (f["className"] && f["className"].indexOf("Hdragbar") !== -1) {
             console.log("MouseDown On");
             console.log(f);
           }
        };


        Handler.urlCurrent = window.location.href;
        if (Handler.urlCurrent.slice(0, 4) !== "file") (Handler.urlCurrent = "/" + myIndexOf(Handler.urlCurrent, "/", 2, 0));
        if (!Handler.handlers.length)
            H("defaultHandler", L("defaultLayout", Container.root(), (x, y) => { return true; }));
        Handler.createDivList();
        //        console.log(Handler.showObj);
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
 function H(...Arguments: Array<any>) { return new Handler(...Arguments); }
 interface Directive {
    el: Element;
    tagname: string;
}
 let liefsError = {
    matchLength: (expected: number, received: number, reference: string = "") => {
        let plus: string = "";
        if (expected < 0) { expected *= -1; plus = "or more "; }
        throw {
            message: "Expected " + plus + expected.toString() + " received " + received.toString() + ".",
            name: "Incorrect Number Of Arguments Error"
        };
    },
    typeMismatch: (expected: string, received: string, reference: string = "") => {
        let msg = reference + " Expected type " + expected.replace("|", " or ") + " received type " + received + ".";
        throw new TypeError(msg);
    },
    badArgs: (expected: string, received: string, reference: string = "") => {
        throw reference + " Expected " + expected + " received " + received + ".";
    }
};
 function onEvent (el: any, eventType: string, eventFunction: Function) {
  if (el.addEventListener) el.addEventListener(eventType, eventFunction, false);
  else if (el.attachEvent) el.attachEvent(eventType, eventFunction);
}
 function uniqueArray(array: Array<any>, optionalConcatArray: Array<any> = []) {
    let a = array.concat(optionalConcatArray);
    for (let i = 0; i < a.length; ++i) for (let j = i + 1; j < a.length; ++j) if (a[i] === a[j]) a.splice(j--, 1);
    return a;
}

 function nthIndex(str: string, pat: string, n: number): number {
    let L = str.length, i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

 function occurrences(thisString: string, subString: string, allowOverlapping: boolean = false): number {
    thisString += "";
    subString += "";
    if (subString.length <= 0) return (thisString.length + 1);
    let n = 0, pos = 0, step = allowOverlapping ? 1 : subString.length;
    while (true) {
        pos = thisString.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        } else break;
    }
    return n;
}
 function trimCompare(a: string, b: string): boolean {
    if (occurrences(b, ":") < occurrences(a, ":"))
        a = a.slice(0, nthIndex(a, ":", occurrences(b, ":") + 1));
    return (a === b);
}

 function isStart(value: string): boolean {
    return value.slice(-1) === "%" || value.slice(-2) === "px";
}

 function px(value: number): string { return value.toString() + "px"; }

 function TypeOf(value: any, match: string = undefined): string | boolean {
    let ctype: string = typeof value, temp: string;
    if (ctype === "object")
        if (Array.isArray(value)) ctype = "array:" + TypeOf(<Array<any>>value[0]);
        else if ((value["constructor"] && value.constructor["name"])
            && (typeof value["constructor"] === "function")
            && (["Object", "Array"].indexOf(value.constructor.name) === -1))
            ctype = value.constructor.name;
        else ctype = "object:" + TypeOf(<Object>value[Object.keys(value)[0]]);
    else if (ctype === "string") if (isStart(value)) ctype = "start";
    if (match)
        if (match.indexOf("|") === -1) return trimCompare(ctype, match);
        else {
            for (let each of match.split("|")) if (trimCompare(ctype, each)) return true;
            return false;
        }
    return ctype;
}

 function setArgsObj(key: string, index: number = 0, ref: string = ""): any {
    let target: any;
    if (!(this.myArgsObj)) throw "setArgsObj Empty";
    if ((key in this.myArgsObj) && (index < this.myArgsObj[key].length)) {
        /*    console.log(ref + "setting to " + this.myArgsObj[key][index]); */
        target = this.myArgsObj[key][index];
    } // else console.log("index fail -" + key);
    return target;
}

 function argsObj(args: IArguments): any {
    let retObj: any = {}, ctype: string;
    for (let i = 0; i < args.length; i++) {
        ctype = (<string>TypeOf(args[i])).replace(":", "_");
        if (!(ctype in retObj)) retObj[ctype] = [];
        retObj[ctype].push(args[i]);
    }
    return retObj;
}

 function CheckArgTypes(args: IArguments, types: string[], reference: string = "", checkLength: boolean = true): boolean {
    reference += " typeCheck";
    if (checkLength && args.length !== types.length)
        liefsError.matchLength(types.length, args.length, reference);
    for (let i = 0; i < types.length; i++)
        if (TypeOf(args[i]) !== types[i])
            liefsError.typeMismatch(types[i], args[i], reference);
    return true;
}

 function el(id: string): Element {
    CheckArgTypes(arguments, ["string"], "el()");
    return document.getElementById(id);
}

 function isUniqueSelector(selector: string) {
    return ((document.querySelectorAll(selector)).length === 1);
}

 function directive(querrySelectorAll: string, attributesList: Array<string>): Array<{}> {
    CheckArgTypes(arguments, ["string", "array:string"], "directive()");
    let returnArray: Array<{}> = [];
    let Obj: Directive;
    let NodeList = document.querySelectorAll(querrySelectorAll);
    for (let i = 0; i < NodeList.length; i++) {
        Obj = { el: NodeList[i], tagname: NodeList[i].tagName };
        for (let eachAttribute of attributesList)
            if (NodeList[i].getAttribute(eachAttribute) === undefined) {
                Obj[eachAttribute] = undefined;
                if (NodeList[i].id !== undefined)
                    for (let each in document.querySelectorAll("[" + eachAttribute + "]"))
                        if (each["id"] !== undefined)
                            if (each["id"] === NodeList[i].id)
                                Obj[eachAttribute] = true;
            }
            else
                Obj[eachAttribute] = NodeList[i].getAttribute(eachAttribute);
        returnArray.push(Objectassign(Obj));
    }
    return returnArray;
}

 function loadDoc(eid: string, page: string): void {
    CheckArgTypes(arguments, ["string", "string"], "loadDoc()");
    let e = document.getElementById(eid);
    if (e) {
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = () => {
            if (this.readyState === 4 && this.status === 200)
                e.innerHTML = this.responseText;
        };
        xhttp.open("GET", page, true);
        xhttp.send();
    }
}

 function directiveSetStyles(el: Element, stylesObject: {}): void {
    for (let key of Object.keys(stylesObject)) el["style"][key] = stylesObject[key];
}

 function waitForIt(conditionFunction: Function, actionFunction: Function): void {
    CheckArgTypes(arguments, ["function", "function"], "waitForIt()");
    if (!conditionFunction())
        window.setTimeout(waitForIt.bind(null, conditionFunction, actionFunction), 100);
    else
        actionFunction();
}
 function createElement(type: string): Element {
    CheckArgTypes(arguments, ["string"], "createElement()");
    return document.createElement(type);
}
 function fillDivWithText(text: string, element: Element): Element {
    return element["createTextNode"](text);
}
 function addAttribute(element: Element, name: string, value: string): Element {
    let att = document.createAttribute(name);
    att.value = value;
    element.setAttributeNode(att);
    return element;
}
 function obid(id: string): Element {
    CheckArgTypes(arguments, ["string"], "obid()");
    return document.getElementById(id);
}
 function pauseEvent(e: Event, key: string = "selection"): boolean { // makes it so so
    if (document[key]) {
        document[key].empty();
    } else if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }

    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
}
 function isItIn(key: string, object: {}) {
    //    CheckArgTypes(arguments, ["string", "object"], "isItIn()");
    let keys = Object.keys(object);
    if (keys.indexOf(key) === -1) return null;
    return object[key];
}

 function throwType(expected: string, received: string, reference: string = "") {
    CheckArgTypes(arguments, ["string", "string", "string"], reference + " throwType()", false);
    throw "Invalid Type Entered " + reference + " expected type " + expected + " received type " + received;
}
 function Objectassign(obj: any): {} { // where obj is Directive object
    let ro = {};
    for (let key in obj) ro[key] = obj[key];
    return ro;
}
 function myIndexOf(sstring: string, search: string, occurance: number, start: number) {
    if (occurance) {
        start = sstring.indexOf(search, start) + 1;
        --occurance;
        if (occurance)
            return myIndexOf(sstring.slice(start), search, occurance, start);
        else
            return sstring.slice(start);
    } else return sstring;
}
 class Coord {
    width: number;
    height: number;
    x: number;
    y: number;
    constructor(width: number = 0, height: number = 0, x: number = 0, y: number = 0) {
        this.width = width; this.height = height; this.x = x; this.y = y;
    }
    getSource(el, byRoot: boolean = true) {
        if (!el) {
            let w = window, d = document, e = d.documentElement,
                g = d.getElementsByTagName("body")[0];
            this.width = w.innerWidth || e.clientWidth || g.clientWidth;
            this.height = w.innerHeight || e.clientHeight || g.clientHeight;
            this.x = 0; this.y = 0;
        } else {
            this.width = el.style.width, this.height = el.style.height;
            let x: number = el.offsetLeft, y: number = el.offsetTop;
            if (byRoot) for (x = 0, y = 0; el != null;
                x += el.offsetLeft, y += el.offsetTop, el = el.offsetParent);
            this.x = x, this.y = y;
        }
    }
}

declare var jasmineTests: boolean;

 class Dragbar {
  Selector = () => { return this.parent.selector() + " > ." + (this.parent.lastDirection ? "H" : "V") + "dragbar"; };
  el: Element;
  size: Coord = new Coord();
  front: boolean = true;
  parent: Item;
  width: number;
  constructor(item: Item, front: boolean = true, width = undefined) {
    this.parent = item;
    this.front = front;
    if (document.querySelectorAll(this.Selector()).length)
        this.el = document.querySelectorAll(this.Selector())[0];
    else {
        this.el = document.createElement("div");
        this.el.className = "Hdragbar"; // gets updated anyways - this is just a reminder
        if (this.parent.el.firstChild) this.parent.el.insertBefore(this.el, this.parent.el.firstChild);
        else this.parent.el.appendChild(this.el);
    }
//    this width = (width) ? width : ()

    this.width = width || Container.of(item).margin || Container.marginDefault;
  }
  update() {
    console.log("Dragbar Update Called()");
    for (let eachKey of Object.keys(this.size)) this.size[eachKey] = this.parent.size[eachKey];
    if (Container.of(this.parent).direction) {
      this.size.x += this.parent.size.width;
      this.size.width = this.width;
    } else {
      this.size.y += this.parent.size.height;
      this.size.height = this.width;
    }
//  }
//  set() {
    directiveSetStyles(this.el, {
      left: px(this.size.x), top: px(this.size.y), width: px(this.size.width), height: px(this.size.height)
    });
  }
}

 class Item {
    static get(label: string, instance = 0): Item {
        if (label in Item.items) return Item.items[label][instance];
        return undefined;
    }
    static h(...Arguments: any[]) {
        Arguments.push("hor");
        return I(...Arguments);
    }
    static v(...Arguments: any[]) {
        Arguments.push("ver");
        return I(...Arguments);
    }
    static I(...Arguments: any[]): Item {
        let newItem: Item;
        let myArgsObj = argsObj(arguments);
        let Ilabel: string, Istart: string, Imin: string, Imax: string, Imargin: number;
        let Iitems: Array<Item>, Icontainer: Container, IisHor: boolean;
        let isItem: string;
        let IpageTitle: string;
        let dragFront: boolean = true;
        if ("array_Item" in myArgsObj) {
            if (!("Item" in myArgsObj)) myArgsObj.Item = [];
            for (let eachArray of myArgsObj["array_Item"])
                for (let eachItem of eachArray)
                    myArgsObj.Item.push(eachItem);
        }
        if ("number" in myArgsObj) Imargin = myArgsObj.number[0];
        if ("string" in myArgsObj) {
            for (let i = 0; i < myArgsObj.string.length; i++) {
                isItem = myArgsObj.string[i];
                if (isItem[0] === "*") {
                    myArgsObj.string[i] = isItem.slice(1);
                    dragFront = false;
                }
                if (isItem[0] === "-" || isItem[0] === "|") {
                    IisHor = (isItem[0] === "-");
                    myArgsObj.string[i] = isItem.slice(1);
                }
                if (isItem.slice(-1) === "-" || isItem.slice(-1) === "|") {
                    IisHor = (isItem.slice(-1) === "-");
                    myArgsObj.string[i] = isItem.slice(0, -1);
                }
                if (isItem.slice(0, 3) === "hor" || isItem.slice(0, 3) === "ver")
                    IisHor = (isItem.slice(0, 3) === "hor");
                else if (!(Ilabel))
                    Ilabel = myArgsObj.string[i];
                else if (!(IpageTitle))
                    IpageTitle = myArgsObj.string[i];
                if (isItem in Item.items) {
                    if (!myArgsObj["item"]) myArgsObj["item"] = [];
                    myArgsObj["item"].push(items[isItem]);
                }
            }
        }
        if ("start" in myArgsObj) {
            Istart = myArgsObj.start[0];
            if (myArgsObj.start.length > 1) Imin = myArgsObj.start[1];
            if (myArgsObj.start.length > 2) Imax = myArgsObj.start[2];
            if (myArgsObj.start.length > 3)
                liefsError.badArgs("Start, Min, Max", "That, and more!", "Create Instance Of Item() " + JSON.stringify(myArgsObj.start.slice(3)));
        }
        if ("Item" in myArgsObj) { Iitems = myArgsObj.Item; }
        if ("Container" in myArgsObj) Icontainer = myArgsObj.container[0];
        ///// ok now create
        if (!Ilabel) Ilabel = "item" + (Object.keys(Item.items).length / 1000).toFixed(3).slice(-3);
        if (!Istart) Istart = "0px"; // liefsError.badArgs("A Start Value", "none", "I() - " + Ilabel);

        if (Iitems && Icontainer) liefsError.badArgs("items, or a container.", "received both", "Create Instance Of Item() " + Ilabel);
        if (Iitems) {
            if (IisHor === undefined) {
                newItem = new Item(Ilabel, Istart, Imin, Imax);
                newItem.pages = Iitems;
                newItem.pages.unshift(newItem);
                newItem.currentPage = 0;
                return newItem;
            }
            else
                Icontainer = new Container(Ilabel, IisHor, Iitems, Imargin);
        }
        newItem = new Item(Ilabel, Istart, Imin, Imax, Icontainer);
        if (IpageTitle) newItem.pageTitle = IpageTitle;
        if (!dragFront) newItem.dragBar.front = dragFront;
        return newItem;
    }
    static nextPage(item_: Item | string, stop: boolean = false) {
        let item: Item = Item.parseItem(item_);
        if (item.currentPage + 1 < item.pages.length) Item.setPage(item, item.currentPage + 1);
        else if (!stop) Item.setPage(item, 0);
    }
    static backPage(item_: Item | string, stop: boolean = false) {
        let item: Item = Item.parseItem(item_);
        if (item.currentPage > 0) Item.setPage(item, item.currentPage - 1);
        else if (!stop) Item.setPage(item, item.pages.length - 1);
    }
    static setPage(item_: Item | string, value: string | number) {
        Item.parseValue(value, Item.parseItem(item_));
        Handler.resizeEvent();
    }
    static parseValue(value_: string | number, item: Item) {
        let foundPage: boolean = false;
        if (TypeOf(value_, "string")) {
            for (let i = 0; i < item.pages.length; i++)
                if (item.pages[i].label === <string>value_) {
                    item.currentPage = i;
                    foundPage = true;
                    break;
                }
            if (!foundPage) liefsError.badArgs("page id not found", <string>value_, "Item setPage");
        }
        else {
            if (item.pages.length - 1 < <number>value_) liefsError.badArgs("Max Pages for " + item.label + " is " + item.pages.length, (<number>value_).toString(), "Item setPage");
            item.currentPage = <number>value_;
        }
    }
    static parseItem(item_: Item | string): Item {
        let item: Item;
        if (TypeOf(item_, "string")) {
            if (!isItIn(<string>item_, Item.items)) liefsError.badArgs("Item Name Not Identified", <string>item_, "Item - setPage()");
            item = Item.items[<string>item_][0];
        }
        else item = <Item>item_;
        if (!item.pages) liefsError.badArgs("Item " + item.label + " to be defined with pages", "it wasn't", "Item - setPage()");
        return item;
    }
    static page(item: Item): Item { return (item.pages) ? item.pages[item.currentPage] : item; }
    static debug = true;
    static items: { [index: string]: Array<Item>; } = {};

    label: string;
    instance: number;
    start: string;
    current: string;
    lastDirection: boolean = true;
    size: Coord;
    min: string;
    max: string;
    container: Container;
    pages: Array<Item>;
    pageTitle: string;  //////// this will be leaving
    currentPage: number;
    el: Element;
    selector = () => { return "#" + this.label; };
    dragBar: Dragbar;
//    dragSelector = () => { return this.selector() + " > ." + (this.lastDirection ? "H" : "V") + "dragbar"; };
//    dragEl: Element;
//    dragbar: Coord;
//    dragFront: boolean = true;

    constructor(label: string, start: string, min: string = undefined, max: string = undefined, container: Container = undefined) {
        let el: any;
        this.label = label;
        this.start = start;
        if (min) this.min = min;
        if (max) this.max = max;
        if (container) this.container = container;

        if (!(label in Item.items)) Item.items[label] = [];
        this.instance = Item.items[label].length;
        Item.items[label].push(this);

        if (typeof Handler === "function") Handler.activate();

        if (this.start === "0px") Container.suspectedRoot = this.container;

        if (isUniqueSelector(this.selector())) {
            this.el = document.querySelectorAll(this.selector())[0];
            this.el["style"]["position"] = "fixed";

            if (min || max) setTimeout(() => {this.dragBar = new Dragbar(this); }, 0);

        }
        else if ((!this.container) && !("jasmineTests" in window))
            liefsError.badArgs("Selector Search for '" + this.label + "' to find ONE matching div",
                "Matched " + document.querySelectorAll(this.selector()).length.toString() + " times", "Handler Item Check");
    }

}

 let I = Item.I;
 let v = Item.v;
 let h = Item.h;
 let items = Item.items;
 let getItem = Item.get;

 class Container {
  static of(item: Item) {
    for (let eachKey of Object.keys(Container.containers))
      if (Container.containers[eachKey].items.indexOf(item) > -1)
        return Container.containers[eachKey];
    console.log("Container of Error: Containers");
    console.log(Container.containers);
    console.log(item);
    return undefined;
  }
    static get(label: string) {
        if (label in Container.containers) return Container.containers[label];
        return undefined;
    }

    static push(container: Container): Container {
        Container.containers[container.label] = container;
        return container;
    }

    static fixed(container: Container, width: number, height: number): number {
        const NOTDEFINED: number = -999;
        let fixed: number = 0;
        let newSize: number = NOTDEFINED;
        for (let eachItem of container.items) {
            if (!(eachItem.size)) eachItem.size = new Coord;
            if (eachItem.start.slice(-2) === "px") newSize = parseInt(eachItem.start.slice(0, -2));
            if (newSize !== NOTDEFINED) {
                fixed = fixed + newSize;
                eachItem.size.width = (container.direction) ? newSize : width - container.margin * 2;
                eachItem.size.height = (container.direction) ? height - container.margin * 2 : newSize;
                newSize = NOTDEFINED;
            }
        }
        return fixed;
    }

    static percent(container: Container, width: number, height: number, fixed: number): void {
        let max = (container.direction) ? width : height;
        let pixelsLeftForPercent: number = (max - fixed - container.margin * (container.items.length + 1));
        let newPercent: number;
        for (let eachItem of container.items) {
            eachItem.lastDirection = container.direction;
            if ((typeof eachItem.start === "string") && eachItem.start.slice(-1) === "%") {
                newPercent = parseInt(eachItem.start.slice(0, -1));
                eachItem.size.width = (container.direction) ? parseInt((pixelsLeftForPercent * (newPercent / 100)).toFixed(0))
                    : width - container.margin * 2;
                eachItem.size.height = (container.direction) ? height - container.margin * 2
                    : parseInt((pixelsLeftForPercent * (newPercent / 100)).toFixed(0));
            }
        }
    }

    static fill(container: Container, xOffset: number = 0, yOffset: number = 0): void {
        let margin: number = container.margin;
        let sum: number = margin;
        for (let eachItem of container.items) {
            if (container.direction) {
                eachItem.size.x = xOffset + sum;
                sum = sum + eachItem.size.width + margin;
                eachItem.size.y = yOffset + margin;
            }
            else {
                eachItem.size.x = xOffset + margin;
                eachItem.size.y = yOffset + sum;
                sum = sum + eachItem.size.height + margin;
            }
        }
    }

    static updateRecursive(width: number, height: number, container: Container, xOffset: number = 0, yOffset: number = 0, includeParents: boolean = false): { [index: string]: Coord } {
        let returnObject: { [index: string]: Coord } = {};
        Container.percent(container, width, height, Container.fixed(container, width, height));
        Container.fill(container, xOffset, yOffset);
        for (let thisItem of container.items) {
            let width = thisItem.size.width + container.margin * 2;
            let height = thisItem.size.height + container.margin * 2;
            let x = thisItem.size.x - container.margin;
            let y = thisItem.size.y - container.margin;
            if ("container" in thisItem && (thisItem["container"])) {
                if (includeParents) returnObject[thisItem.label] = thisItem.size;
                let temp = Container.updateRecursive(width, height, thisItem.container, x, y);
                for (let attrname in temp) returnObject[attrname] = temp[attrname];
            }
            returnObject[thisItem.label] = thisItem.size;
        }
        return returnObject;
    }

    static debug = true;
    static containers: { [index: string]: Container; } = {};
    static marginDefault: number = 4;
    static suspectedRoot: Container;
    static lastDefined: Container;
    static root() {return (Container.suspectedRoot)
                    ? Container.suspectedRoot : Container.lastDefined; }

    label: string;
    margin: number;
    direction: boolean;
    items: Item[] = [];
    lastUpdate: { [index: string]: Coord };
    el: Element;
    selector = () => { return "#" + this.label; };

    constructor(label: string, trueIsHor: boolean, items: Item[], margin: number = Container.marginDefault) {
        console.log("Defined Container" + label);
        this.label = label; this.direction = trueIsHor; this.items = items; this.margin = margin;
        Container.containers[label] = Container.lastDefined = this;
        this.itemsCheck();
        if (isUniqueSelector(this.selector())) this.el = document.querySelectorAll(this.selector())[0];
    }

    itemsCheck() {
        let totalPercent: number = 0;
        for (let eachItem of this.items)
            if (eachItem.start.slice(-1) === "%")
                totalPercent += parseInt(eachItem.start.slice(0, -1));
        if (totalPercent !== 100) liefsError.badArgs(this.label + " to total 100%", " a total of " + totalPercent.toString() + "%", "Container.itemsCheck()");
    }

    update(width: number, height: number, xOffset: number = 0, yOffset: number = 0, includeParents: boolean = false): void /*{ [index: string]: Coord }*/ {
        this.lastUpdate = Container.updateRecursive(width, height, this, xOffset, yOffset, includeParents);
    }
    itemByLabel(label: string): Item {
      for (let item of this.items)
        if (item.label === label) return item;
          else if (item.container && item.container.itemByLabel(label)) return item.container.itemByLabel(label);
      return undefined;
    }
}

 let containers = Container.containers;
 let getContainer = Container.get;

 class Layout {
  label: string;
  isActive: boolean = true;
  container: Container;
  conditionalFunction: Function;
  myArgsObj: any;
  setArgsObj: Function = setArgsObj;
  constructor(...Arguments: any[]) {
    this.myArgsObj = argsObj(arguments);
    this.label = this.setArgsObj("string", 0, "layout ");
    this.conditionalFunction = this.setArgsObj("function", 0, "layout ");
    this.container = this.setArgsObj("Container", 0, "layout ");
    if ("Item" in this.myArgsObj) {
      this.container = (this.myArgsObj.Item[0]).container;
      if (!this.container)
        throw liefsError.badArgs("Container or Item-Parent of Container",
                    "Item - not the Parent of a Container", "New Layout" + ((this.label) ? " '" + this.label + "'" : ""));
    }
    if (!(this.container && this.conditionalFunction)) {
      liefsError.badArgs("At Least One Function and One Item/Container",
        JSON.stringify(Object.keys(this.myArgsObj)), "Create Instance Of Layout()");
    }
  }
}
 function L(...Arguments: Array<any>) { return new Layout(...Arguments); }
