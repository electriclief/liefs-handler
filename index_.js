class Handler {
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
    for (let key in stylesObject)
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
    CheckArgTypes(arguments, ["string", "object"], "isItIn()");
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
class Item {
    constructor(label, start, min = undefined, max = undefined, container = undefined) {
        this.selector = () => { return "#" + this.label; };
        this.label = label;
        this.start = this.current = start;
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
        if (!isUniqueSelector(this.selector()) && (!this.container) && !("jasmineTests" in window))
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
                return newItem;
            }
            else
                Icontainer = new Container(Ilabel, IisHor, Iitems, Imargin);
        }
        newItem = new Item(Ilabel, Istart, Imin, Imax, Icontainer);
        if (IpageTitle)
            newItem.pageTitle = IpageTitle;
        return newItem;
    }
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
        this.label = label;
        this.direction = trueIsHor;
        this.items = items;
        this.margin = margin;
        Container.containers[label] = Container.lastDefined = this;
        this.itemsCheck();
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
            if (eachItem.start.slice(-2) === "px")
                newSize = parseInt(eachItem.start.slice(0, -2));
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
            if ((typeof eachItem.start === "string") && eachItem.start.slice(-1) === "%") {
                newPercent = parseInt(eachItem.start.slice(0, -1));
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
            if ("is_a_container" in thisItem && (thisItem["is_a_container"])) {
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
        if (totalPercent !== 100)
            liefsError.badArgs(this.label + " to total 100%", " a total of " + totalPercent.toString() + "%", "Container.itemsCheck()");
    }
    update(width, height, xOffset = 0, yOffset = 0, includeParents = false) {
        this.lastUpdate = Container.updateRecursive(width, height, this, xOffset, yOffset, includeParents);
        return this.lastUpdate;
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
