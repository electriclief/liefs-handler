class Handler {
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
    static pageTitle() { return "var Handler.pageTitle = function () { return 'Title ' + whatever}"; }
    static pushPage() {
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
        let style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = ".Hdragbar { position: fixed; }";
        style.innerHTML += ".Vdragbar { position: fixed; }";
        document.getElementsByTagName("head")[0].appendChild(style);
        // document.body.onmousedown = function(e: Event) {
        //    let f = window.event ? event.srcElement : e.target;
        //    if (f["className"] && f["className"].indexOf("Hdragbar") !== -1) {
        //      console.log("MouseDown On");
        //      console.log(f);
        //    }
        // };
        Handler.urlCurrent = window.location.href;
        if (Handler.urlCurrent.slice(0, 4) !== "file")
            (Handler.urlCurrent = "/" + myIndexOf(Handler.urlCurrent, "/", 2, 0));
        if (!Handler.handlers.length)
            H("defaultHandler", L("defaultLayout", Container.root(), (x, y) => { return true; }));
        Handler.createDivList();
        //        console.log(Handler.showObj);
        Handler.watchForResizeEvent();
        Handler.resizeEvent();
    }
    static resizeEvent(e = null) {
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
            }
            else if (Item.get(eachKey) && Item.get(eachKey).dragBar)
                Item.get(eachKey).dragBar.update();
    }
    static Hide() { for (let eachKey of Object.keys(Handler.showObj))
        Handler.showObj[eachKey].show = false; }
    update() {
        let coord;
        let pageItem;
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
Handler.handlers = [];
Handler.isActive = false;
Handler.resizeCallbackThrottle = 0;
Handler.delayUntilStart = 200; // milliseconds
Handler.showObj = {};
function H(...Arguments) { return new Handler(...Arguments); }
let liefsError = {
    matchLength: (expected, received, reference = "") => {
        let plus = "";
        if (expected < 0) {
            expected *= -1;
            plus = "or more ";
        }
        throw {
            message: "Expected " + plus + expected.toString() + " received " + received.toString() + ".",
            name: "Incorrect Number Of Arguments Error"
        };
    },
    typeMismatch: (expected, received, reference = "") => {
        let msg = reference + " Expected type " + expected.replace("|", " or ") + " received type " + received + ".";
        throw new TypeError(msg);
    },
    badArgs: (expected, received, reference = "") => {
        throw reference + " Expected " + expected + " received " + received + ".";
    }
};
function onEvent(el, eventType, eventFunction) {
    if (el.addEventListener)
        el.addEventListener(eventType, eventFunction, false);
    else if (el.attachEvent)
        el.attachEvent(eventType, eventFunction);
}
function uniqueArray(array, optionalConcatArray = []) {
    let a = array.concat(optionalConcatArray);
    for (let i = 0; i < a.length; ++i)
        for (let j = i + 1; j < a.length; ++j)
            if (a[i] === a[j])
                a.splice(j--, 1);
    return a;
}
function nthIndex(str, pat, n) {
    let L = str.length, i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(pat, i);
        if (i < 0)
            break;
    }
    return i;
}
function occurrences(thisString, subString, allowOverlapping = false) {
    thisString += "";
    subString += "";
    if (subString.length <= 0)
        return (thisString.length + 1);
    let n = 0, pos = 0, step = allowOverlapping ? 1 : subString.length;
    while (true) {
        pos = thisString.indexOf(subString, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        }
        else
            break;
    }
    return n;
}
function trimCompare(a, b) {
    if (occurrences(b, ":") < occurrences(a, ":"))
        a = a.slice(0, nthIndex(a, ":", occurrences(b, ":") + 1));
    return (a === b);
}
function isStart(value) {
    return value.slice(-1) === "%" || value.slice(-2) === "px";
}
function px(value) { return value.toString() + "px"; }
function vpx(value) { return parseInt(value.slice(0, -2)); }
function TypeOf(value, match = undefined) {
    let ctype = typeof value, temp;
    if (ctype === "object")
        if (Array.isArray(value))
            ctype = "array:" + TypeOf(value[0]);
        else if ((value["constructor"] && value.constructor["name"])
            && (typeof value["constructor"] === "function")
            && (["Object", "Array"].indexOf(value.constructor.name) === -1))
            ctype = value.constructor.name;
        else
            ctype = "object:" + TypeOf(value[Object.keys(value)[0]]);
    else if (ctype === "string")
        if (isStart(value))
            ctype = "start";
    if (match)
        if (match.indexOf("|") === -1)
            return trimCompare(ctype, match);
        else {
            for (let each of match.split("|"))
                if (trimCompare(ctype, each))
                    return true;
            return false;
        }
    return ctype;
}
function setArgsObj(key, index = 0, ref = "") {
    let target;
    if (!(this.myArgsObj))
        throw "setArgsObj Empty";
    if ((key in this.myArgsObj) && (index < this.myArgsObj[key].length)) {
        /*    console.log(ref + "setting to " + this.myArgsObj[key][index]); */
        target = this.myArgsObj[key][index];
    } // else console.log("index fail -" + key);
    return target;
}
function argsObj(args) {
    let retObj = {}, ctype;
    for (let i = 0; i < args.length; i++) {
        ctype = TypeOf(args[i]).replace(":", "_");
        if (!(ctype in retObj))
            retObj[ctype] = [];
        retObj[ctype].push(args[i]);
    }
    return retObj;
}
function CheckArgTypes(args, types, reference = "", checkLength = true) {
    reference += " typeCheck";
    if (checkLength && args.length !== types.length)
        liefsError.matchLength(types.length, args.length, reference);
    for (let i = 0; i < types.length; i++)
        if (TypeOf(args[i]) !== types[i])
            liefsError.typeMismatch(types[i], args[i], reference);
    return true;
}
function el(id) {
    CheckArgTypes(arguments, ["string"], "el()");
    return document.getElementById(id);
}
function isUniqueSelector(selector) {
    return ((document.querySelectorAll(selector)).length === 1);
}
function directive(querrySelectorAll, attributesList) {
    CheckArgTypes(arguments, ["string", "array:string"], "directive()");
    let returnArray = [];
    let Obj;
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
function loadDoc(eid, page) {
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
function directiveSetStyles(el, stylesObject) {
    for (let key of Object.keys(stylesObject))
        el["style"][key] = stylesObject[key];
}
function waitForIt(conditionFunction, actionFunction) {
    CheckArgTypes(arguments, ["function", "function"], "waitForIt()");
    if (!conditionFunction())
        window.setTimeout(waitForIt.bind(null, conditionFunction, actionFunction), 100);
    else
        actionFunction();
}
function createElement(type) {
    CheckArgTypes(arguments, ["string"], "createElement()");
    return document.createElement(type);
}
function fillDivWithText(text, element) {
    return element["createTextNode"](text);
}
function addAttribute(element, name, value) {
    let att = document.createAttribute(name);
    att.value = value;
    element.setAttributeNode(att);
    return element;
}
function obid(id) {
    CheckArgTypes(arguments, ["string"], "obid()");
    return document.getElementById(id);
}
function pauseEvent(e, key = "selection") {
    if (document[key]) {
        document[key].empty();
    }
    else if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
    if (e.stopPropagation)
        e.stopPropagation();
    if (e.preventDefault)
        e.preventDefault();
    e.cancelBubble = true;
    e.returnValue = false;
    return false;
}
function isItIn(key, object) {
    //    CheckArgTypes(arguments, ["string", "object"], "isItIn()");
    let keys = Object.keys(object);
    if (keys.indexOf(key) === -1)
        return null;
    return object[key];
}
function throwType(expected, received, reference = "") {
    CheckArgTypes(arguments, ["string", "string", "string"], reference + " throwType()", false);
    throw "Invalid Type Entered " + reference + " expected type " + expected + " received type " + received;
}
function Objectassign(obj) {
    let ro = {};
    for (let key in obj)
        ro[key] = obj[key];
    return ro;
}
function myIndexOf(sstring, search, occurance, start) {
    if (occurance) {
        start = sstring.indexOf(search, start) + 1;
        --occurance;
        if (occurance)
            return myIndexOf(sstring.slice(start), search, occurance, start);
        else
            return sstring.slice(start);
    }
    else
        return sstring;
}
class Coord {
    constructor(width = 0, height = 0, x = 0, y = 0) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }
    getSource(el, byRoot = true) {
        if (!el) {
            let w = window, d = document, e = d.documentElement, g = d.getElementsByTagName("body")[0];
            this.width = w.innerWidth || e.clientWidth || g.clientWidth;
            this.height = w.innerHeight || e.clientHeight || g.clientHeight;
            this.x = 0;
            this.y = 0;
        }
        else {
            this.width = el.style.width, this.height = el.style.height;
            let x = el.offsetLeft, y = el.offsetTop;
            if (byRoot)
                for (x = 0, y = 0; el != null; x += el.offsetLeft, y += el.offsetTop, el = el.offsetParent)
                    ;
            this.x = x, this.y = y;
        }
    }
}
class Dragbar {
    constructor(item, front = true, width = undefined) {
        this.Selector = () => { return this.parent.selector() + " > ." + (this.parent.lastDirection ? "H" : "V") + "dragbar"; };
        this.size = new Coord();
        this.front = true;
        this.parent = item;
        this.front = front;
        if (document.querySelectorAll(this.Selector()).length)
            this.el = document.querySelectorAll(this.Selector())[0];
        else {
            this.el = document.createElement("div");
            this.el.className = Container.of(item).direction ? "Hdragbar" : "Vdragbar";
            if (this.parent.el.firstChild)
                this.parent.el.insertBefore(this.el, this.parent.el.firstChild);
            else
                this.parent.el.appendChild(this.el);
        }
        if (Dragbar.noInit) {
            onEvent(document.body, "mouseup", Dragbar.mouseUp);
            onEvent(document.body, "mousemove", Dragbar.mouseMove);
            Dragbar.noInit = false;
        }
        onEvent(this.el, "mousedown", (e) => { Dragbar.mouseDown(e, this); });
        this.width = width || Container.of(item).margin || Container.marginDefault;
    }
    static mouseDown(e, dragbar) {
        event.preventDefault();
        Dragbar.activeDragbar = dragbar;
        Dragbar.beforeCurrent = dragbar.parent.current;
        Dragbar.isDown = true;
        Dragbar.direction = Container.of(dragbar.parent).direction;
        Dragbar.dragstart = Dragbar.direction ? e.clientX : e.clientY;
    }
    static mouseUp(e) {
        Dragbar.isDown = false;
    }
    static mouseMove(e) {
        if (Dragbar.isDown) {
            event.preventDefault();
            let pItem = Dragbar.activeDragbar.parent;
            let dragDiff = (Dragbar.direction ? e.clientX : e.clientY) - Dragbar.dragstart;
            let newCurrent = vpx(Dragbar.beforeCurrent) + dragDiff;
            if (pItem.min && (newCurrent < vpx(pItem.min)))
                newCurrent = vpx(pItem.min);
            if (pItem.max && (newCurrent > vpx(pItem.max)))
                newCurrent = vpx(pItem.max);
            pItem.current = newCurrent.toString() + "px";
            Handler.resizeEvent();
        }
    }
    update() {
        console.log("Dragbar Update Called()");
        for (let eachKey of Object.keys(this.size))
            this.size[eachKey] = this.parent.size[eachKey];
        if (Container.of(this.parent).direction) {
            this.size.x += this.parent.size.width;
            this.size.width = this.width;
        }
        else {
            this.size.y += this.parent.size.height;
            this.size.height = this.width;
        }
        directiveSetStyles(this.el, {
            left: px(this.size.x), top: px(this.size.y), width: px(this.size.width), height: px(this.size.height)
        });
    }
}
Dragbar.isDown = false;
Dragbar.noInit = true;
class Item {
    constructor(label, start, min = undefined, max = undefined, container = undefined) {
        this.lastDirection = true;
        this.selector = () => { return "#" + this.label; };
        let el;
        this.label = label;
        this.current = this.start = start;
        if (min)
            this.min = min;
        if (max)
            this.max = max;
        if (container)
            this.container = container;
        if (!(label in Item.items))
            Item.items[label] = [];
        this.instance = Item.items[label].length;
        Item.items[label].push(this);
        if (typeof Handler === "function")
            Handler.activate();
        if (this.start === "0px")
            Container.suspectedRoot = this.container;
        if (isUniqueSelector(this.selector())) {
            this.el = document.querySelectorAll(this.selector())[0];
            this.el["style"]["position"] = "fixed";
            if (min || max)
                setTimeout(() => { this.dragBar = new Dragbar(this); }, 0);
        }
        else if ((!this.container) && !("jasmineTests" in window))
            liefsError.badArgs("Selector Search for '" + this.label + "' to find ONE matching div", "Matched " + document.querySelectorAll(this.selector()).length.toString() + " times", "Handler Item Check");
    }
    static get(label, instance = 0) {
        if (label in Item.items)
            return Item.items[label][instance];
        return undefined;
    }
    static h(...Arguments) {
        Arguments.push("hor");
        return I(...Arguments);
    }
    static v(...Arguments) {
        Arguments.push("ver");
        return I(...Arguments);
    }
    static I(...Arguments) {
        let newItem;
        let myArgsObj = argsObj(arguments);
        let Ilabel, Istart, Imin, Imax, Imargin;
        let Iitems, Icontainer, IisHor;
        let isItem;
        let IpageTitle;
        let dragFront = true;
        if ("array_Item" in myArgsObj) {
            if (!("Item" in myArgsObj))
                myArgsObj.Item = [];
            for (let eachArray of myArgsObj["array_Item"])
                for (let eachItem of eachArray)
                    myArgsObj.Item.push(eachItem);
        }
        if ("number" in myArgsObj)
            Imargin = myArgsObj.number[0];
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
                    if (!myArgsObj["item"])
                        myArgsObj["item"] = [];
                    myArgsObj["item"].push(items[isItem]);
                }
            }
        }
        if ("start" in myArgsObj) {
            Istart = myArgsObj.start[0];
            if (myArgsObj.start.length > 1)
                Imin = myArgsObj.start[1];
            if (myArgsObj.start.length > 2)
                Imax = myArgsObj.start[2];
            if (myArgsObj.start.length > 3)
                liefsError.badArgs("Start, Min, Max", "That, and more!", "Create Instance Of Item() " + JSON.stringify(myArgsObj.start.slice(3)));
        }
        if ("Item" in myArgsObj) {
            Iitems = myArgsObj.Item;
        }
        if ("Container" in myArgsObj)
            Icontainer = myArgsObj.container[0];
        ///// ok now create
        if (!Ilabel)
            Ilabel = "item" + (Object.keys(Item.items).length / 1000).toFixed(3).slice(-3);
        if (!Istart)
            Istart = "0px"; // liefsError.badArgs("A Start Value", "none", "I() - " + Ilabel);
        if (Iitems && Icontainer)
            liefsError.badArgs("items, or a container.", "received both", "Create Instance Of Item() " + Ilabel);
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
        if (IpageTitle)
            newItem.pageTitle = IpageTitle;
        if (!dragFront)
            newItem.dragBar.front = dragFront;
        return newItem;
    }
    static nextPage(item_, stop = false) {
        let item = Item.parseItem(item_);
        if (item.currentPage + 1 < item.pages.length)
            Item.setPage(item, item.currentPage + 1);
        else if (!stop)
            Item.setPage(item, 0);
    }
    static backPage(item_, stop = false) {
        let item = Item.parseItem(item_);
        if (item.currentPage > 0)
            Item.setPage(item, item.currentPage - 1);
        else if (!stop)
            Item.setPage(item, item.pages.length - 1);
    }
    static setPage(item_, value) {
        Item.parseValue(value, Item.parseItem(item_));
        Handler.resizeEvent();
    }
    static parseValue(value_, item) {
        let foundPage = false;
        if (TypeOf(value_, "string")) {
            for (let i = 0; i < item.pages.length; i++)
                if (item.pages[i].label === value_) {
                    item.currentPage = i;
                    foundPage = true;
                    break;
                }
            if (!foundPage)
                liefsError.badArgs("page id not found", value_, "Item setPage");
        }
        else {
            if (item.pages.length - 1 < value_)
                liefsError.badArgs("Max Pages for " + item.label + " is " + item.pages.length, value_.toString(), "Item setPage");
            item.currentPage = value_;
        }
    }
    static parseItem(item_) {
        let item;
        if (TypeOf(item_, "string")) {
            if (!isItIn(item_, Item.items))
                liefsError.badArgs("Item Name Not Identified", item_, "Item - setPage()");
            item = Item.items[item_][0];
        }
        else
            item = item_;
        if (!item.pages)
            liefsError.badArgs("Item " + item.label + " to be defined with pages", "it wasn't", "Item - setPage()");
        return item;
    }
    static page(item) { return (item.pages) ? item.pages[item.currentPage] : item; }
}
Item.debug = true;
Item.items = {};
let I = Item.I;
let v = Item.v;
let h = Item.h;
let items = Item.items;
let getItem = Item.get;
class Container {
    constructor(label, trueIsHor, items, margin = Container.marginDefault) {
        this.items = [];
        this.selector = () => { return "#" + this.label; };
        console.log("Defined Container" + label);
        this.label = label;
        this.direction = trueIsHor;
        this.items = items;
        this.margin = margin;
        Container.containers[label] = Container.lastDefined = this;
        this.itemsCheck();
        if (isUniqueSelector(this.selector()))
            this.el = document.querySelectorAll(this.selector())[0];
    }
    static of(item) {
        for (let eachKey of Object.keys(Container.containers))
            if (Container.containers[eachKey].items.indexOf(item) > -1)
                return Container.containers[eachKey];
        console.log("Container of Error: Containers");
        console.log(Container.containers);
        console.log(item);
        return undefined;
    }
    static get(label) {
        if (label in Container.containers)
            return Container.containers[label];
        return undefined;
    }
    static push(container) {
        Container.containers[container.label] = container;
        return container;
    }
    static fixed(container, width, height) {
        const NOTDEFINED = -999;
        let fixed = 0;
        let newSize = NOTDEFINED;
        for (let eachItem of container.items) {
            if (!(eachItem.size))
                eachItem.size = new Coord;
            if (eachItem.current.slice(-2) === "px")
                newSize = parseInt(eachItem.current.slice(0, -2));
            if (newSize !== NOTDEFINED) {
                fixed = fixed + newSize;
                eachItem.size.width = (container.direction) ? newSize : width - container.margin * 2;
                eachItem.size.height = (container.direction) ? height - container.margin * 2 : newSize;
                newSize = NOTDEFINED;
            }
        }
        return fixed;
    }
    static percent(container, width, height, fixed) {
        let max = (container.direction) ? width : height;
        let pixelsLeftForPercent = (max - fixed - container.margin * (container.items.length + 1));
        let newPercent;
        for (let eachItem of container.items) {
            eachItem.lastDirection = container.direction;
            if ((typeof eachItem.current === "string") && eachItem.current.slice(-1) === "%") {
                newPercent = parseInt(eachItem.current.slice(0, -1));
                eachItem.size.width = (container.direction) ? parseInt((pixelsLeftForPercent * (newPercent / 100)).toFixed(0))
                    : width - container.margin * 2;
                eachItem.size.height = (container.direction) ? height - container.margin * 2
                    : parseInt((pixelsLeftForPercent * (newPercent / 100)).toFixed(0));
            }
        }
    }
    static fill(container, xOffset = 0, yOffset = 0) {
        let margin = container.margin;
        let sum = margin;
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
    static updateRecursive(width, height, container, xOffset = 0, yOffset = 0, includeParents = false) {
        let returnObject = {};
        Container.percent(container, width, height, Container.fixed(container, width, height));
        Container.fill(container, xOffset, yOffset);
        for (let thisItem of container.items) {
            let width = thisItem.size.width + container.margin * 2;
            let height = thisItem.size.height + container.margin * 2;
            let x = thisItem.size.x - container.margin;
            let y = thisItem.size.y - container.margin;
            if ("container" in thisItem && (thisItem["container"])) {
                if (includeParents)
                    returnObject[thisItem.label] = thisItem.size;
                let temp = Container.updateRecursive(width, height, thisItem.container, x, y);
                for (let attrname in temp)
                    returnObject[attrname] = temp[attrname];
            }
            returnObject[thisItem.label] = thisItem.size;
        }
        return returnObject;
    }
    static root() {
        return (Container.suspectedRoot)
            ? Container.suspectedRoot : Container.lastDefined;
    }
    itemsCheck() {
        let totalPercent = 0;
        for (let eachItem of this.items)
            if (eachItem.start.slice(-1) === "%")
                totalPercent += parseInt(eachItem.start.slice(0, -1));
        // else if ((eachItem.start.slice(-2) === "px")) {
        //     console.log(eachItem.label);
        //     console.log(eachItem.dragBar);
        //     if (eachItem.dragBar) {
        //         console.log("before");
        //         console.log(eachItem.dragBar.el.className);
        //         eachItem.dragBar.el.className = this.direction ? "Hdragbar" : "Vdragbar";
        //         console.log("after");
        //         console.log(eachItem.dragBar.el.className);
        //     }
        // }
        if (totalPercent !== 100)
            liefsError.badArgs(this.label + " to total 100%", " a total of " + totalPercent.toString() + "%", "Container.itemsCheck()");
    }
    update(width, height, xOffset = 0, yOffset = 0, includeParents = false) {
        this.lastUpdate = Container.updateRecursive(width, height, this, xOffset, yOffset, includeParents);
    }
    itemByLabel(label) {
        for (let item of this.items)
            if (item.label === label)
                return item;
            else if (item.container && item.container.itemByLabel(label))
                return item.container.itemByLabel(label);
        return undefined;
    }
}
Container.debug = true;
Container.containers = {};
Container.marginDefault = 4;
let containers = Container.containers;
let getContainer = Container.get;
class Layout {
    constructor(...Arguments) {
        this.isActive = true;
        this.setArgsObj = setArgsObj;
        this.myArgsObj = argsObj(arguments);
        this.label = this.setArgsObj("string", 0, "layout ");
        this.conditionalFunction = this.setArgsObj("function", 0, "layout ");
        this.container = this.setArgsObj("Container", 0, "layout ");
        if ("Item" in this.myArgsObj) {
            this.container = (this.myArgsObj.Item[0]).container;
            if (!this.container)
                throw liefsError.badArgs("Container or Item-Parent of Container", "Item - not the Parent of a Container", "New Layout" + ((this.label) ? " '" + this.label + "'" : ""));
        }
        if (!(this.container && this.conditionalFunction)) {
            liefsError.badArgs("At Least One Function and One Item/Container", JSON.stringify(Object.keys(this.myArgsObj)), "Create Instance Of Layout()");
        }
    }
}
function L(...Arguments) { return new Layout(...Arguments); }
