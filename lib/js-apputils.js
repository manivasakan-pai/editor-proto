function TextHighLightUtils() {}

TextHighLightUtils.prototype.constructor = TextHighLightUtils;

let _mainMoodData = null;

TextHighLightUtils.setMoodData = function (mainMoodData) {
    _mainMoodData = mainMoodData;
};

TextHighLightUtils.getMoodData = function () {
    return _mainMoodData;
};

TextHighLightUtils.uuidv4 = function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

TextHighLightUtils.getWindowSelection = function () {
    let selection = null;
    if (window.getSelection) {
        selection = window.getSelection();
    } else if (typeof document.selection != "undefined") {
        selection = document.selection;
    }
    return selection;
};

TextHighLightUtils.getWindowSelectionRange = function () {
    try {
        let selection = TextHighLightUtils.getWindowSelection();
        if (selection) {
            let selectedRange = selection.getRangeAt(0);
            return selectedRange;
        }
    } catch (error) {}
    return null;
};

TextHighLightUtils.getWindowNonCollapsedSelectionRange = function () {
    try {
        let selection = TextHighLightUtils.getWindowSelection();
        if (selection && !selection.isCollapsed) {
            let selectedRange = selection.getRangeAt(0);
            return selectedRange;
        }
    } catch (error) {}
    return null;
};

TextHighLightUtils.removeAllSelectionRanges = function () {
    let selection = TextHighLightUtils.getWindowSelection();
    if (selection) {
        selection.removeAllRanges();
    }
};

TextHighLightUtils.setSelectionRange = function (rangeSelection) {
    if (rangeSelection && !rangeSelection.collapsed) {
        let selection = TextHighLightUtils.getWindowSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(rangeSelection);
        }
    }
};

TextHighLightUtils.getSelectedTextSpan = function (selRange) {
    let elSelectionNode = null;

    try {
        elSelectionNode = selRange.commonAncestorContainer;

        if (elSelectionNode && elSelectionNode.nodeName && elSelectionNode.nodeName === "#text" && elSelectionNode.parentNode) {
            elSelectionNode = elSelectionNode.parentNode;
        }
        if (elSelectionNode.dataset.type != "SUB_TEXT_SPAN") {
            elSelectionNode = null;
        }
    } catch (error) {
        console.log("Selected Text node error..." + error);
    }
    return elSelectionNode;
};

TextHighLightUtils.getTextHighlight = function () {
    // Highlight marker swapped to **...**
    return { regEX: /\*\*(.*?)\*\*/g, startReg: /\*\*/g, endReg: "", count: 4, className: "selectedtexthighlight", style: "cs-heading-highlight-text-style" };
};

TextHighLightUtils.getTextBold = function () {
    // Bold marker swapped to †...†
    return { regEX: /†(.*?)†/g, startReg: /†/g, endReg: "", count: 2, className: "fontbold", style: "" };
};

TextHighLightUtils.getTextSubscript = function () {
    return { regEX: /\_\_(.*?)\_\_/g, startReg: /\_\_/g, endReg: "", count: 4, className: "selectedtextsubscript", style: "" };
};

TextHighLightUtils.getTextItalic = function () {
    return { regEX: /\!\!(.*?)\!\!/g, startReg: /\!\!/g, endReg: "", count: 4, className: "fontitalic", style: "" };
};

TextHighLightUtils.getTextUnderLine = function () {
    return { regEX: /\*\_(.*?)\*\_/g, startReg: /\*\_/g, endReg: "", count: 4, className: "fontunderline", style: "" };
};

TextHighLightUtils.getTextSuperScript = function () {
    return { regEX: /\`\`(.*?)\`\`/g, startReg: /\`\`/g, endReg: "", count: 4, className: "selectedtextsuperscript", style: "" };
};

TextHighLightUtils.getTextStrike = function () {
    return { regEX: /\~\~(.*?)\~\~/g, startReg: /\~\~/g, endReg: "", count: 4, className: "fontstrikethrough", style: "" };
};

TextHighLightUtils.getTextImage = function () {
    return { regEX: /\[(image)\]\((.*?)\)/gi, startReg: /\[-/g, endReg: /\]-/g, count: 0, className: "selectedtextimage", style: "", image: true };
};

TextHighLightUtils.getProfile = function () {
    return { regEX: /\[(profile)\]\((.*?)\)/gi, startReg: /\[-/g, endReg: /\]-/g, count: 0, className: "profileimage", style: "", image: true };
};

TextHighLightUtils.mention = function () {
    return { regEX: /\[(@mention)\]\[(.*?)\]/gi, startReg: /\[(@mention)\]\[/, endReg: /\]/, count: 0, className: "mentionprofile", style: "", profile: true };
};

TextHighLightUtils.getTextLink = function () {
    return { regEX: /\[(.*?)\]\((.*?)\)/gi, startReg: /\[-/g, endReg: /\]-/g, count: 0, className: "selectedtextlinkurl", style: "", link: true };
};

TextHighLightUtils.getSelectedTextColor = function () {
    return { regEX: /\{(.*?)\}\{(.*?)\}/gi, startReg: /\{-/g, endReg: /\}-/g, count: 0, className: "selectedTextColor", style: "", color: true };
};

// Read the styles a single highlighted run (SUB_TEXT_SPAN) actually applies, so each
// run can be serialized to its OWN markup markers instead of a slide-wide
// window.highlightdata snapshot taken from the first highlight span. Every property
// is compared against the inherited (parent) baseline, so we only emit a marker for
// what THIS span changes — a span that merely inherits bold/color from its container
// won't double-emit †/{_…_}. Returns flags + raw CSS values; the caller maps them to
// markers (background fill → the **…** highlight, text color → {_…_}|c|, etc.).
TextHighLightUtils.getSpanHighlightStyle = function (element) {
    try {
        // `element` must be a LIVE DOM node — highlightToString walks a detached clone where
        // getComputedStyle returns only browser defaults (theme highlight classes never
        // resolve). The caller threads the live counterpart in via convertHighLightToOutline,
        // so the bg/color/gradient/stroke/shadow/font read here are the TRUE rendered values.
        let s = window.getComputedStyle(element);
        let parent = element.parentElement ? window.getComputedStyle(element.parentElement) : null;
        const empty = ["rgba(0, 0, 0, 0)", "transparent", "none", "", "initial", "inherit", "unset"];
        const decoration = (style) => style?.textDecorationLine || style?.textDecoration || "";

        let isBg = !!s.backgroundColor && !empty.includes(s.backgroundColor);
        let isColor = !!s.color && !empty.includes(s.color) && (!parent || s.color !== parent.color);
        let isUnderline = decoration(s).includes("underline") && (!parent || !decoration(parent).includes("underline"));
        let isStrike = decoration(s).includes("line-through") && (!parent || !decoration(parent).includes("line-through"));
        // Per-run font weight. Computed font-weight is numeric ("400"/"700") or a keyword.
        // When it differs from the inherited weight we carry the exact value (fw:) so the
        // consumer can pick the right weight master — not just the bold/non-bold binary.
        let toWeight = (w) => {
            w = (w || "").toString();
            if (w === "normal") return 400;
            if (w === "bold") return 700;
            let n = parseInt(w);
            return isNaN(n) ? 400 : n;
        };
        let fwNum = toWeight(s.fontWeight);
        let parentFw = parent ? toWeight(parent.fontWeight) : 400;
        let fontWeight = fwNum !== parentFw ? fwNum : null;
        // `†` (isBold) only fires when we're NOT already carrying an explicit weight, so the
        // two never double-encode. When fontWeight is set, the consumer derives bold from it.
        let isBold = !fontWeight && (s.fontWeight === "bold" || parseInt(s.fontWeight) >= 700) && (!parent || parseInt(parent.fontWeight || "400") < 700);
        let isItalic = s.fontStyle === "italic" && (!parent || parent.fontStyle !== "italic");

        // Gradient-clipped text (background-clip:text + transparent color). PptxGenJS run
        // fill is solid-only, so we carry the raw gradient (tg:) and let the consumer paint
        // a per-run <a:gradFill> via fixup. The first stop is kept as a solid placeholder
        // (the run still needs a solidFill for the fixup to replace, and it's the fallback
        // for any consumer that doesn't apply the gradient).
        let color = isColor ? s.color : null;
        let textGradient = null;
        {
            let bgClip = s.getPropertyValue("-webkit-background-clip") || s.getPropertyValue("background-clip");
            if ((s.backgroundImage || "").includes("linear-gradient(") && bgClip === "text") {
                let bg = s.backgroundImage;
                let gi = bg.indexOf("linear-gradient(");
                let depth = 0, end = gi;
                for (let k = gi + "linear-gradient".length; k < bg.length; k++) {
                    if (bg[k] === "(") depth++;
                    else if (bg[k] === ")") { depth--; if (depth === 0) { end = k + 1; break; } }
                }
                let grad = bg.slice(gi, end);
                if (grad.includes(",")) textGradient = grad;
                if (!color) {
                    let stop = bg.match(/rgba?\([^)]+\)/);
                    if (stop && !empty.includes(stop[0])) color = stop[0];
                }
            }
        }

        // Drop shadow (one or more CSS text-shadow layers). OOXML run effects allow a single
        // outer shadow, so the consumer collapses multiple layers into one composited shadow.
        let textShadow = s.textShadow && s.textShadow !== "none" ? s.textShadow : null;

        // Font family — only when this run overrides the inherited family (e.g. a
        // "Title Highlight – Font Family Change" run). Carried as run fontFace downstream.
        let fontFamily = null;
        let primaryFamily = (f) => (f || "").split(",")[0].trim().replace(/^['"]|['"]$/g, "");
        if (s.fontFamily && (!parent || s.fontFamily !== parent.fontFamily)) {
            let fam = primaryFamily(s.fontFamily);
            if (fam) fontFamily = fam;
        }

        // Text stroke / outline (-webkit-text-stroke) — maps to the run outline {color,size}.
        let stroke = null;
        let strokeW = parseFloat(s.webkitTextStrokeWidth || s.getPropertyValue("-webkit-text-stroke-width") || "0");
        let strokeC = s.webkitTextStrokeColor || s.getPropertyValue("-webkit-text-stroke-color") || "";
        if (strokeW > 0 && strokeC && !empty.includes(strokeC)) stroke = { color: strokeC, width: strokeW };

        return { isBg, bg: s.backgroundColor, isColor: !!color, color, isUnderline, isStrike, isBold, isItalic, fontFamily, fontWeight, stroke, textGradient, textShadow };
    } catch (e) {
        return { isBg: false, isColor: false, isUnderline: false, isStrike: false, isBold: false, isItalic: false, fontFamily: null, fontWeight: null, stroke: null, textGradient: null, textShadow: null };
    }
};

TextHighLightUtils.checkForNestedNodes = function (element, isPPTX = false, liveElement = null) {
    let subData = "";
    if (element.childNodes.length > 0) {
        // `element` is the detached clone; `liveElement` is its live DOM twin (same structure,
        // so children align 1:1 by index). Thread each live child down so style reads resolve.
        element.childNodes.forEach((child, i) => {
            subData += TextHighLightUtils.convertHighLightToOutline(child, subData, isPPTX, liveElement ? liveElement.childNodes[i] : null);
        });
    }
    return subData;
};

TextHighLightUtils.convertHighLightToOutline = function (element, htmlText = "", isPPTX = false, liveElement = null) {
    // Skip highlight animation assets (previously removed from the clone before walking;
    // skipping here keeps the clone↔live child indices aligned for the parallel walk).
    if (element.nodeType === 1 && element.id === "highlightasset") return "";
    let nodeName = element.nodeName.toLowerCase();
    let type = element.getAttribute ? element.getAttribute("data-type") : "";
    let nodeText = element.textContent ? element.textContent : element.wholeText || "";
    nodeText = nodeText.replace(/<br\s*\/?>/gi, "\n").replace(/&nbsp;/gi, " ");
    let classList = element.classList;
    let data = "";
    switch (nodeName) {
        case "#text":
            if (isPPTX) {
                // Create regex pattern for all special chars to replace in one pass
                const pattern = /[\*~{}_}|!<>\^=\[\\\](),†§]/g;
                // Map of special chars to their HTML entities
                const replacements = {
                    "*": "&star;",
                    "~": "&tilde;",
                    "¶": "&brokenbar;",
                    "†": "&dagger;",
                    "§": "&sect;",
                    "{": "&lbrace;",
                    _: "&underscore;",
                    "}": "&rbrace;",
                    "|": "&pipe;",
                    "!": "&exclamation;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "^": "&hat;",
                    "=": "&equal;",
                    "[": "&lbracket;",
                    "\\": "&backslash;",
                    "]": "&rbracket;",
                    "(": "&lparenthesis;",
                    ")": "&rparenthesis;",
                    ",": "&comma;",
                };
                // Replace all special chars in one pass using regex
                nodeText = nodeText.replace(pattern, (char) => replacements[char]);
            }
            data = nodeText;
            break;
        case "br":
            data = "\n";
            break;
        case "span":
        case "p":
            if (classList.contains("selectedTextSlideHyperlink")) {
                let link = element.getAttribute("data-navigate-to-slide-on-click");
                if (isPPTX) {
                    element.removeAttribute("data-type");
                    data = TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement);
                } else data = "#!" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "#!++" + link + "++";
            } else if (classList.contains("selectedTextColor")) {
                let color = element.style.color;
                if (color) color = color.replace(/\s/g, "");
                color = color.replace("(", "{").replace(/\)$/, "}");
                data = "{_" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "_}|" + color + "|";
            } else if (type == "SUB_TEXT_SPAN") {
                let nestedData = TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement);
                if (isPPTX) {
                    // Read THIS run's own applied styles and map each supported style to its
                    // markup marker, so multiple differently-styled highlight runs on one line
                    // each export correctly (replaces the slide-wide window.highlightdata
                    // snapshot, which forced every run into the first highlight span's style).
                    // Nesting order = innermost text-color, then character styles, then the
                    // background fill outermost — matching what the export consumer (pptx-service
                    // parseInner) and the editor re-import (tokenize) expect.
                    let hs = TextHighLightUtils.getSpanHighlightStyle(liveElement || element);
                    data = nestedData;
                    if (hs.isColor && hs.color) {
                        let color = hs.color.replace(/\s/g, "").replace("(", "{").replace(/\)$/, "}");
                        data = "{_" + data + "_}|" + color + "|";
                    }
                    // Bold marker swapped to †...†
                    if (hs.isBold) data = "†" + data + "†";
                    if (hs.isItalic) data = "!" + data + "!";
                    if (hs.isUnderline) data = "<u>" + data + "</u>";
                    if (hs.isStrike) data = "~~" + data + "~~";
                    // Background fill = the highlight. Carry the per-run color inline as
                    // **...**|color| (mirrors the {_..._}|color| text-color form) so the
                    // consumer can set runOpts.highlight per word.
                    if (hs.isBg && hs.bg) {
                        let bg = hs.bg.replace(/\s/g, "").replace("(", "{").replace(/\)$/, "}");
                        data = "**" + data + "**|" + bg + "|";
                    } else {
                        // Highlight marker swapped to **...**
                        data = "**" + data + "**";
                    }
                    // Valued run attributes that have no simple toggle marker — font family,
                    // stroke (and, in phase 2, gradient text + drop shadow) — ride in a single
                    // §...§|key:val;key:val| wrapper applied outermost. The consumer merges the
                    // payload into the run's properties (fontFace, outline, …).
                    let attrParts = [];
                    if (hs.fontFamily) attrParts.push("ff:" + hs.fontFamily);
                    if (hs.fontWeight) attrParts.push("fw:" + hs.fontWeight);
                    if (hs.stroke && hs.stroke.color) {
                        let sc = hs.stroke.color.replace(/\s/g, "").replace("(", "{").replace(/\)$/, "}");
                        attrParts.push("sk:" + sc + "~" + hs.stroke.width);
                    }
                    // Raw CSS for gradient/shadow — the consumer reuses its own parsers
                    // (parseLinearGradient / parseBoxShadow). Neither value contains ; | §.
                    if (hs.textGradient) attrParts.push("tg:" + hs.textGradient);
                    if (hs.textShadow) attrParts.push("sh:" + hs.textShadow);
                    if (attrParts.length) data = "§" + data + "§|" + attrParts.join(";") + "|";
                } else {
                    // Highlight marker swapped to **...**
                    data = "**" + nestedData + "**";
                }
            } else if (type == "@mention") {
                let link = element.querySelector("a")?.getAttribute("href") || "";
                let image = element.querySelector("img")?.getAttribute("src") || "";
                let name = element.textContent;
                data = "[@mention][(";
                let spliter = "#-";
                let divider = ",";
                if (image) {
                    data += `(${image})`;
                }
                if (name) {
                    data += `(${name})`;
                }
                if (link) {
                    data += `(${link}))]`;
                }

                console.log("data", data);
            } else {
                if (isPPTX) {
                    // Create regex pattern for all special chars to replace in one pass
                    const pattern = /[\*~{}_}|!<>\^=\[\\\](),†§]/g;
                    // Map of special chars to their HTML entities
                    const replacements = {
                        "*": "&star;",
                        "~": "&tilde;",
                        "¶": "&brokenbar;",
                        "†": "&dagger;",
                        "{": "&lbrace;",
                        _: "&underscore;",
                        "}": "&rbrace;",
                        "|": "&pipe;",
                        "!": "&exclamation;",
                        "<": "&lt;",
                        ">": "&gt;",
                        "^": "&hat;",
                        "=": "&equal;",
                        "[": "&lbracket;",
                        "\\": "&backslash;",
                        "]": "&rbracket;",
                        "(": "&lparenthesis;",
                        ")": "&rparenthesis;",
                        ",": "&comma;",
                    };
                    // Replace all special chars in one pass using regex
                    nodeText = nodeText.replace(pattern, (char) => replacements[char]);
                }
                data = nodeText;
            }
            break;
        case "div":
            let subData = TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement);
            data = (element.innerHTML == "<br>" || htmlText.lastIndexOf("\n") == htmlText.length - 1 ? "" : "\n") + subData;
            break;
        case "s":
            if (type == "SUB_TEXT_SPAN") {
                data = "~~" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "~~";
            }
            break;
        case "sup":
            if (type == "SUB_TEXT_SPAN") {
                data = "^" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "^";
            }
            break;
        case "sub":
            if (type == "SUB_TEXT_SPAN") {
                data = "¶" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "¶";
            }
            break;
        case "a":
            if (type == "SUB_TEXT_SPAN") {
                let link = element.getAttribute("href");
                data = "[" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "](" + link + ")";
            }
            break;
        case "img":
            if (type == "SUB_TEXT_SPAN") {
                let link = element.getAttribute("src");
                data = +nodeText + "[image](" + link + ")";
            }
            break;
        case "i":
        case "em": // Added for Quill list underline support - Bala Krishnan
            // if (type == "SUB_TEXT_SPAN") {
            data = "!" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "!";
            // }
            break;
        case "b":
        case "strong": // Added for Quill list underline support - Bala Krishnan
            // if (type == "SUB_TEXT_SPAN") {
            // Bold marker swapped to †...†
            data = "†" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "†";
            // }
            break;
        case "u":
            // if (type == "SUB_TEXT_SPAN") {
            data = "<u>" + TextHighLightUtils.checkForNestedNodes(element, isPPTX, liveElement) + "</u>";
            // }
            break;
        default:
            data = nodeText;
            break;
    }
    return data;
};

TextHighLightUtils.applyDefaultSpanProperties = function (nodeSpan, strSpanID) {
    if (nodeSpan && strSpanID && strSpanID != "") {
        nodeSpan.setAttribute("id", strSpanID);
        nodeSpan.setAttribute("data-type", "SUB_TEXT_SPAN");
    }
};

TextHighLightUtils.createSpan = function (strSpanID) {
    // Changed to span from p for supporting quill lists - Bala Krishnan
    let nodeSpan = document.createElement("span");
    TextHighLightUtils.applyDefaultSpanProperties(nodeSpan, strSpanID);
    return nodeSpan;
};

TextHighLightUtils.createSpecialNode = function (strNodeType, strSpanID) {
    let nodeSpan = document.createElement(strNodeType);
    TextHighLightUtils.applyDefaultSpanProperties(nodeSpan, strSpanID);
    return nodeSpan;
};

TextHighLightUtils.selectNodeContent = function (nodeSpan) {
    if (nodeSpan) {
        let selection = TextHighLightUtils.getWindowSelection();
        let rangeUpdate = document.createRange();
        rangeUpdate.selectNodeContents(nodeSpan);
        selection.addRange(rangeUpdate);
        return rangeUpdate;
    }
    return null;
};

TextHighLightUtils.getParentDivNode = function (nodeTextElement) {
    let newNode = nodeTextElement;
    if (nodeTextElement) {
        if (nodeTextElement?.tagName != "DIV" && nodeTextElement?.tagName != "UL" && nodeTextElement?.tagName != "OL" && nodeTextElement?.tagName != "LI") {
            while (newNode?.tagName != "DIV" && newNode?.tagName != "UL" && newNode?.tagName != "OL" && newNode?.tagName != "LI") {
                newNode = newNode.parentElement;
            }
        }
    }
    return newNode;
};

TextHighLightUtils.clearAllStylesExceptLineBreak = function (nodeTextElement, rangeSelection) {
    if (nodeTextElement && rangeSelection) {
        nodeTextElement = TextHighLightUtils.getParentDivNode(nodeTextElement);
        nodeTextElement.classList.forEach((className) => {
            if (className.includes("-disabled")) {
                nodeTextElement.classList.remove(className);
            }
        });
        // Get all elements within the range
        let arrElementsInRange = TextHighLightUtils.getElementsInRange(rangeSelection);

        // Filter to only SUB_TEXT_SPAN elements
        let arrStyleElements = arrElementsInRange.filter((element) => element.getAttribute && element.getAttribute("data-type") === "SUB_TEXT_SPAN");

        if (arrStyleElements && arrStyleElements.length > 0) {
            // Function to find all SUB_TEXT_SPAN ancestors within range
            function findAllSubTextSpanAncestors(element, range) {
                let ancestors = [];
                let current = element.parentNode;

                while (current && current !== nodeTextElement) {
                    if (current.getAttribute && current.getAttribute("data-type") === "SUB_TEXT_SPAN" && range.intersectsNode(current)) {
                        ancestors.push(current);
                    }
                    current = current.parentNode;
                }
                return ancestors;
            }

            // Collect all SUB_TEXT_SPAN elements (original + ancestors)
            let allSubTextSpans = new Set(arrStyleElements);

            // For each original element, find all its SUB_TEXT_SPAN ancestors within range
            arrStyleElements.forEach((element) => {
                let ancestors = findAllSubTextSpanAncestors(element, rangeSelection);
                ancestors.forEach((ancestor) => allSubTextSpans.add(ancestor));
            });

            // Convert Set back to Array and sort by depth (deepest first)
            let finalElements = Array.from(allSubTextSpans);
            finalElements.sort((a, b) => {
                let depthA = 0,
                    depthB = 0;
                let parentA = a.parentNode,
                    parentB = b.parentNode;

                while (parentA && parentA !== nodeTextElement) {
                    if (parentA.getAttribute && parentA.getAttribute("data-type") === "SUB_TEXT_SPAN") {
                        depthA++;
                    }
                    parentA = parentA.parentNode;
                }

                while (parentB && parentB !== nodeTextElement) {
                    if (parentB.getAttribute && parentB.getAttribute("data-type") === "SUB_TEXT_SPAN") {
                        depthB++;
                    }
                    parentB = parentB.parentNode;
                }

                return depthB - depthA; // Deeper elements first
            });

            // Unwrap all elements in correct order
            finalElements.forEach((element) => {
                if (element && element.parentNode) {
                    $(element).contents().unwrap();
                }
            });
        }
    }
};

TextHighLightUtils.highlightToString = function (sourceText, isPPTX = false, liveRoot = null) {
    let htmlText = "";
    let textNode;
    let liveChildren = null;
    if (liveRoot) {
        // Live DOM root supplied (PPTX export): walk a faithful clone (mutations during the
        // walk stay off the live DOM) in lockstep with the live node, so per-run style reads
        // resolve against true rendered styles. cloneNode(true) guarantees identical structure.
        textNode = liveRoot.cloneNode(true);
        liveChildren = liveRoot.childNodes;
    } else {
        textNode = document.createElement("div");
        textNode.innerHTML = sourceText;
    }
    let textNodes = textNode.childNodes;
    // #highlightasset nodes are skipped inside convertHighLightToOutline (no DOM removal),
    // which also keeps the clone↔live child indices aligned for the parallel walk.
    if (textNodes.length > 0) {
        textNodes.forEach((element, i) => {
            htmlText += TextHighLightUtils.convertHighLightToOutline(element, htmlText, isPPTX, liveChildren ? liveChildren[i] : null);
        });
    }
    return htmlText;

    // htmlText = htmlText.replace(/<span(.|\n)*?>|<\/span(.|\n)*?>/g, "**")
    // htmlText = htmlText.replace(/<sup(.|\n)*?>|<\/sup(.|\n)*?>/g, "``")
    // htmlText = htmlText.replace(/<sub(.|\n)*?>|<\/sub(.|\n)*?>/g, "__")
    // htmlText = htmlText.replace(/<s(.|\n)*?>|<\/s(.|\n)*?>/g, "--")

    // if (htmlText.match(/<a(.|\n)*?>*?<\/a(.|\n)*?>/g)) {
    //     let linkData = htmlText.match(/<a(.|\n)*?>*?<\/a(.|\n)*?>/g)
    //     for (let j = 0; j < linkData.length; j++) {
    //         let mainTag = linkData[j];
    //         let tagNode = linkData[j].replace(/<a(.|\n)*?>/g, "[")
    //         tagNode = tagNode.replace(/<\/a(.|\n)*?>/g, "]")
    //         if (mainTag.includes("href")) {
    //             let atag = mainTag.match(/\s*href\s*=\s*(\"([^"]*\")|'[^']*'|([^'">\s]+))/g)[0];
    //             tagNode = tagNode + "(" + atag.replace(/href|=|\'|\"|\s/g, "") + ")"
    //         }
    //         htmlText = htmlText.replace(mainTag, tagNode);
    //     }
    // }

    // if (htmlText.match(/<img(.|\n)*?>/g)) {
    //     let linkData = htmlText.match(/<img(.|\n)*?>/g)
    //     for (let j = 0; j < linkData.length; j++) {
    //         let mainTag = linkData[j];
    //         let tagNode = "[image]"
    //         if (mainTag.includes("src")) {
    //             let atag = mainTag.match(/\s*src\s*=\s*(\"([^"]*\")|'[^']*'|([^'">\s]+))/g)[0];
    //             tagNode = tagNode + "(" + atag.replace(/src|=|\'|\"|\s/g, "") + ")"
    //         }
    //         htmlText = htmlText.replace(mainTag, tagNode);
    //     }
    // }
    // let domNote = document.createElement("p");
    // domNote.innerHTML = htmlText;
    //return //domNote.innerText;
};

// TextHighLightUtils.updateHighlight = function (textTitle, strData, strTextElementID = "", isSpecialgraphcis = false) {
//     // if (textTitle && textTitle.textContent != "") {
//     //     let arrHightLight = [
//     //         TextHighLightUtils.getTextImage(),
//     //         TextHighLightUtils.getProfile(),
//     //         TextHighLightUtils.getTextHighlight(),
//     //         TextHighLightUtils.getTextSubscript(),
//     //         TextHighLightUtils.getTextSuperScript(),
//     //         TextHighLightUtils.getTextStrike(),
//     //         TextHighLightUtils.getTextLink(),
//     //         TextHighLightUtils.getSelectedTextColor(),
//     //         TextHighLightUtils.getTextBold(),
//     //         TextHighLightUtils.getTextItalic(),
//     //         TextHighLightUtils.getTextUnderLine(),
//     //         TextHighLightUtils.mention(),
//     //     ];
//     //     let highLightUpdate = false;
//     //     for (let i = 0; i < arrHightLight.length; i++) {
//     //         const regData = arrHightLight[i];
//     //         let mainData = strData; //.replace(/<br\s*\/?>/gi, "\n").replace(/&nbsp;/gi, " ");
//     //         if (regData.regEX.test(mainData)) {
//     //             textTitle.innerText = mainData.replace(regData.startReg, "").replace(regData.endReg, "");
//     //             mainData = mainData.replace(/\{rgb\{([^}]+)\}\}/, "{rgb($1)}");
//     //             let arrMatchedData = mainData.match(regData.regEX);
//     //             for (let j = 0; j < arrMatchedData.length; j++) {
//     //                 let matchedData = TextHighLightUtils.getHighLightData(arrMatchedData[j], regData);
//     //                 if (matchedData.text.startsWith("<") && matchedData.text.endsWith(">")) {
//     //                     textTitle.innerHTML = matchedData.text;
//     //                 } else {
//     //                     textTitle.innerText = matchedData.text; //.replace(/<br\s*\/?>/gi, "\n").replace(/&nbsp;/gi, " ");
//     //                 }
//     //                 let endIndex = matchedData.text.length;
//     //                 let textNode = textTitle.childNodes[0];
//     //                 let range = TextHighLightUtils.makeTextSelection(textNode, 0, endIndex);
//     //                 TextHighLightUtils.setSelectionRange(range);
//     //                 let nodeSpan = TextHighLightUtils.applyFormat(textTitle, regData.className, true, strTextElementID, matchedData.link, null, matchedData.color);
//     //                 if (textTitle.dataset.index && nodeSpan) {
//     //                     let index = textTitle.dataset.index;
//     //                     nodeSpan.setAttribute("data-index", index);
//     //                 }
//     //                 if (regData.style == "TITLE_HIGHLIGHT") TextHighLightUtils.applyTextHighlightProperties(textTitle, nodeSpan);
//     //                 TextHighLightUtils.removeAllSelectionRanges();
//     //                 mainData = mainData.replace(matchedData.original, textTitle.innerHTML);
//     //             }
//     //             highLightUpdate = true;
//     //             textTitle.innerHTML = mainData;
//     //         }
//     //         strData = textTitle.innerHTML;
//     //     }
//     //     if (!highLightUpdate && !isSpecialgraphcis) textTitle.innerText = textTitle.textContent.replace(/<br\s*\/?>/gi, "\n").replace(/&nbsp;/gi, " ");
//     // }
//     // textTitle.innerHTML = textTitle.innerHTML.replaceAll("&lt;br&gt;", "").replaceAll("&amp;nbsp;", "");
// };

TextHighLightUtils.updateHighlight = function (textTitle = null, strData, strTextElementID = "", objComponent = {}, frompresentmode = false, isFromAi = false) {
    try {
        if (strData) {
            strData = strData.toString();
        }
        let isQuillList = objComponent?.quillList;
        let isSpecialGraphics = objComponent?.isSpecialGraphics;
        // Added for Quill list underline support - Bala Krishnan
        if (isQuillList) {
            strData = strData.replace(/&lt;u&gt;/g, "<u>").replace(/&lt;\/u&gt;/g, "</u>");
            // strData = strData.trim().replace(/\p{Emoji}/gu, "");
        }
        if (isFromAi) {
            strData = strData.replaceAll("**", "");
        }
        let parsed = frompresentmode ? this.parseMarkdown(strData) : this.parseMarkdown(strData);
        let paresedText = "";
        if (parsed) {
            parsed = parsed.replaceAll("\n", "<br>");
            paresedText = parsed;
            if (textTitle) textTitle.innerHTML = parsed;
            // textTitle.innerHTML = textTitle.innerHTML.replaceAll("&lt;br&gt;", "").replaceAll("&amp;nbsp;", "");
        } else {
            paresedText = textTitle?.textContent?.replace(/<br\s*\/?>/gi, "\n").replace(/&nbsp;/gi, " ");
            if (textTitle) textTitle.innerText = textTitle?.textContent?.replace(/<br\s*\/?>/gi, "\n").replace(/&nbsp;/gi, " ");
        }
        TextHighLightUtils.addHighlightEnabledClass(textTitle);
        return paresedText;
    } catch (error) {
        console.log("error in updateHighlight", error);
        // textTitle.innerText = strData;
    }
};

TextHighLightUtils.addHighlightEnabledClass = function (nodeTextElement) {
    let strHighlightClassName = "cs-heading-highlight-text-style";
    if (nodeTextElement.id == "SUBTITLE" || nodeTextElement.id == "TEXTBOX" || nodeTextElement.id == "subtitle" || nodeTextElement.id == "textbox" || nodeTextElement.id.includes("body")) {
        strHighlightClassName = "cs-body-highlight-text-style";
    } else if (nodeTextElement.id == "SLIDE_LABEL" || nodeTextElement.classList?.contains("slide-label") || nodeTextElement.id.includes("sgTitleLabelNode") || nodeTextElement.id.includes("textLabel")) {
        strHighlightClassName = "cs-body-highlight-text-style";
    }
    let hasHighlightEnabled = nodeTextElement.querySelector(`.selectedTextHighlight`);
    if (hasHighlightEnabled && !nodeTextElement.classList.contains(strHighlightClassName)) {
        // nodeTextElement.classList.add(strHighlightClassName);
        nodeTextElement.classList.add(strHighlightClassName + "-disabled");
    }
};

TextHighLightUtils.parseMarkdown = function (text) {
    const tokens = this.tokenize(text);
    let html = "";
    if (tokens.length > 0) {
        html = tokens.length > 0 ? this.parseTokens(tokens) : text;
        const filteredTextColor = tokens.filter((token) => token.type === "textcolor" && token.colorvalue);
        for (let c1 = 0; c1 < filteredTextColor.length; c1++) {
            let colorValue = filteredTextColor[c1]?.colorvalue?.color;
            let textMainColor = filteredTextColor[c1]?.colorvalue?.texMainColor;
            let modifiedColorValue = "";
            if (textMainColor) {
                modifiedColorValue = "|" + textMainColor + "|";
                html = html?.replaceAll(modifiedColorValue, "");
            } else if (colorValue) {
                modifiedColorValue = "|" + colorValue + "|";
                html = html?.replaceAll(modifiedColorValue, "");
            }
        }
        // Per-run highlight background carried inline as **...**|color| (export round-trip):
        // inject the bg color into the highlight span's style, then strip the literal marker
        // so it never surfaces as visible text. Plain **...** highlights (no color) are untouched.
        html = html.replace(/(<span\b[^>]*\bselectedTextHighlight\b[^>]*>)([^<]*)(<\/span>)\|(rgb\{[^|]+\}|rgba?\([^|]+\))\|/gi, function (_m, openTag, inner, closeTag, color) {
            let css = color.replace("{", "(").replace(/\}$/, ")");
            if (/\bstyle="/i.test(openTag)) openTag = openTag.replace(/style="/i, 'style="background-color:' + css + ";");
            else openTag = openTag.replace(/>$/, ' style="background-color:' + css + ';">');
            return openTag + inner + closeTag;
        });
        // Defensive: drop any inline highlight color marker left after a closing span
        // (e.g. highlight wrapping nested markup the regex above didn't capture).
        html = html.replace(/(<\/span>)\|(?:rgb\{[^|]+\}|rgba?\([^|]+\))\|/gi, "$1");

        // Valued run attributes carried as §inner§|key:val;…| (font family, stroke; phase 2
        // adds gradient/shadow): wrap the inner content in a styled span and strip the marker
        // so it round-trips into the editor instead of surfacing as literal text.
        html = html.replace(/§([\s\S]*?)§\|([^|]*)\|/g, function (_m, inner, payload) {
            let styles = [];
            payload.split(";").forEach(function (entry) {
                let ci = entry.indexOf(":");
                if (ci < 0) return;
                let k = entry.slice(0, ci);
                let v = entry.slice(ci + 1);
                if (k === "ff") styles.push("font-family:" + v);
                else if (k === "fw") styles.push("font-weight:" + v);
                else if (k === "sk") {
                    let p = v.split("~");
                    let c = (p[0] || "").replace("{", "(").replace(/\}$/, ")");
                    styles.push("-webkit-text-stroke:" + (p[1] || 1) + "px " + c);
                } else if (k === "tg") {
                    styles.push("background-image:" + v, "-webkit-background-clip:text", "background-clip:text", "color:transparent");
                } else if (k === "sh") {
                    styles.push("text-shadow:" + v);
                }
            });
            if (!styles.length) return inner;
            return '<span data-type="SUB_TEXT_SPAN" style="' + styles.join(";") + '">' + inner + "</span>";
        });

        const filteredHyperLink = tokens.filter((token) => token.type === "hyperlink" && token.hyperlink);
        for (let h1 = 0; h1 < filteredHyperLink.length; h1++) {
            let hyperLinkValue = filteredHyperLink[h1]?.hyperlink?.link;
            if (hyperLinkValue) {
                let modifiedHyperLinkValueValue = "(" + hyperLinkValue + ")";
                html = html?.replaceAll(modifiedHyperLinkValueValue, "");
            }
        }
        const filteredSlideHyperLink = tokens.filter((token) => token.type === "slidehyperlink" && token.hyperlink);
        for (let s1 = 0; s1 < filteredSlideHyperLink.length; s1++) {
            let hyperLinkValue = filteredSlideHyperLink[s1]?.hyperlink?.link;
            if (hyperLinkValue) {
                let modifiedHyperLinkValueValue = "++" + hyperLinkValue + "++";
                html = html?.replaceAll(modifiedHyperLinkValueValue, "");
            }
        }
    }
    return html;
};

TextHighLightUtils.tokenize = function (text) {
    const tokenPatterns = [
        // Bold marker swapped to †...†
        { regex: /†/, endRegValue: /†/, type: "bold", tagname: "b", typename: "SUB_TEXT_SPAN" },
        { regex: /\!/, endRegValue: /\!/, type: "italic", tagname: "i", typename: "SUB_TEXT_SPAN" },
        // Highlight marker swapped to **...**
        { regex: /\*\*/, endRegValue: /\*\*/, type: "highlight", tagname: "span", typename: "SUB_TEXT_SPAN", classname: "selectedTextHighlight cs-heading-highlight-text-style" },
        { regex: /\{\_/, endRegValue: /\_\}/, mainregex: /\{\_(.*?)\_\}\|(.*?)\|/gi, startReg: /\{\_-/g, classname: "selectedTextColor", endReg: /\_\}-/g, type: "textcolor", tagname: "span", typename: "SUB_TEXT_SPAN", color: true },
        { regex: /<\/?u>/, endRegValue: /<\/?u>/, type: "underline", tagname: "u", typename: "SUB_TEXT_SPAN" },
        { regex: /\^/, endRegValue: /\^/, type: "superscript", tagname: "sup", typename: "SUB_TEXT_SPAN" },
        { regex: /~~/, endRegValue: /~~/, type: "strikethrough", tagname: "s", typename: "SUB_TEXT_SPAN" },
        { regex: /¶/, endRegValue: /¶/, type: "subscript", tagname: "sub", typename: "SUB_TEXT_SPAN" },
        { regex: /\[/, endRegValue: /\]/, mainregex: /\[(.*?)\]\((.*?)\)/gi, startReg: /\[-/g, endReg: /\]-/g, classname: "selectedTextHyperlink", type: "hyperlink", tagname: "a", typename: "SUB_TEXT_SPAN", link: true },
        // tagname is `span`, not `p`: applyFormat wraps slide links in a span, and re-parsing them
        // into a block-level <p> re-flowed the text (the run jumped to its own line and the
        // element's alignment changed) on every render after the link was applied.
        { regex: /\#\!/, endRegValue: /\]/, mainregex: /\#\!(.*?)\#\!\++(.*?)\++/gi, startReg: /\#\!-/g, endReg: /\#\!-/g, classname: "selectedTextSlideHyperlink", type: "slidehyperlink", tagname: "span", typename: "SUB_TEXT_SPAN", slidelink: true },
    ];
    const tokens = [];
    let i = 0;
    let colorindex = 0;
    let highlightindex = 0;
    let slideHighlightindex = 0;
    let colorDetails = [];
    let hyperlinkDetails = [];
    let slideHyperlinkDetails = [];
    let arrColorPattern = [tokenPatterns[3], tokenPatterns[8], tokenPatterns[9]];
    arrColorPattern.forEach(function (colorPattern) {
        if (colorPattern.type == "textcolor" || colorPattern.type == "hyperlink" || colorPattern.type == "slidehyperlink") {
            let textNode = text.replace(colorPattern.startReg, "").replace(colorPattern.endReg, "");
            let mainData = textNode.replace(/\{rgb\{([^}]+)\}\}/, "{rgb($1)}");
            let arrMatchedData = mainData.match(colorPattern.mainregex);
            for (let j = 0; j < arrMatchedData?.length; j++) {
                let matchedData = TextHighLightUtils.getHighLightData(arrMatchedData[j], colorPattern);
                if (colorPattern.type == "slidehyperlink") {
                    slideHyperlinkDetails.push(matchedData);
                } else if (colorPattern.type == "hyperlink") {
                    hyperlinkDetails.push(matchedData);
                } else {
                    colorDetails.push(matchedData);
                }
            }
        }
    });

    while (i < text.length) {
        let matched = false;
        let unmatchedTokenLength = 0;

        for (const pattern of tokenPatterns) {
            let match = text.slice(i).match(pattern.regex);
            let isEndToken = false;

            // Check if this is an end token
            if ((!match || match.index != 0) && pattern.endRegValue) {
                let endMatch = text.slice(i).match(pattern.endRegValue);
                if (endMatch && endMatch.index === 0) {
                    match = endMatch;
                    isEndToken = true;
                }
            }

            if (match && match.index === 0) {
                // Skip validation for underline (HTML tags) and patterns already validated by mainregex
                const skipValidation = pattern.type === "underline" || pattern.mainregex;

                if (!skipValidation && !isEndToken) {
                    let hasValidClosing = true;

                    // For patterns with same opening/closing (like **, !, ==, etc.)
                    if (pattern.regex.source === pattern.endRegValue?.source) {
                        // Count existing tokens of this type to determine if this is opening or closing
                        const existingTokens = tokens.filter((token) => token.type === pattern.type);
                        const isOpening = existingTokens.length % 2 === 0;

                        if (isOpening) {
                            // This should be an opening token, check if closing exists ahead
                            const remainingText = text.slice(i + match[0].length);
                            const closingMatch = remainingText.match(pattern.endRegValue);

                            if (!closingMatch) {
                                // No closing token found - don't create token, treat as regular text
                                hasValidClosing = false;
                                unmatchedTokenLength = match[0].length;
                            }
                        }
                        // If it's a closing token (isOpening = false), check if there's a matching opening
                        else {
                            // If existingTokens.length is 0, this closing has no opening - treat as text
                            // But if isOpening is false, existingTokens.length must be odd (>= 1)
                            // So we only need to check if length is 0, which can't happen when isOpening is false
                            // Actually, if we reach here with isOpening = false, we have an opening waiting
                            // So the closing is valid - no need to check
                        }
                    } else if (pattern.endRegValue) {
                        // For patterns with different opening/closing (like {_ and _}, [ and ])
                        if (!isEndToken) {
                            // Check if opening has matching closing
                            const remainingText = text.slice(i + match[0].length);
                            const closingMatch = remainingText.match(pattern.endRegValue);

                            if (!closingMatch) {
                                // No closing token found - don't create token, treat as regular text
                                hasValidClosing = false;
                                unmatchedTokenLength = match[0].length;
                            }
                        } else {
                            // This is an end token, check if there's a corresponding opening
                            // Look backwards in tokens to find matching opening
                            let foundOpening = false;
                            for (let k = tokens.length - 1; k >= 0; k--) {
                                if (tokens[k].type === pattern.type) {
                                    foundOpening = true;
                                    break;
                                }
                            }
                            if (!foundOpening) {
                                // No opening token found - don't create token, treat as regular text
                                hasValidClosing = false;
                                unmatchedTokenLength = match[0].length;
                            }
                        }
                    }

                    // If token doesn't have valid closing/opening, skip tokenization
                    if (!hasValidClosing) {
                        break;
                    }
                }

                // If we have an unmatched token, skip tokenization and treat as text
                if (unmatchedTokenLength > 0) {
                    break;
                }

                // Only create token if we have valid opening/closing pair
                if (pattern.type == "slidehyperlink") {
                    tokens.push({ type: pattern.type, tagname: pattern.tagname, typename: pattern.typename, value: match[0], hyperlink: slideHyperlinkDetails[slideHighlightindex], classname: pattern?.classname || "" });
                    const filteredSlideHyperlink = tokens.filter((token) => token.type === "slidehyperlink");
                    if (filteredSlideHyperlink?.length % 2 == 0) {
                        slideHighlightindex++;
                    }
                } else if (pattern.type == "hyperlink") {
                    tokens.push({ type: pattern.type, tagname: pattern.tagname, typename: pattern.typename, value: match[0], hyperlink: hyperlinkDetails[highlightindex], classname: pattern?.classname || "" });
                    const filteredHyperlink = tokens.filter((token) => token.type === "hyperlink");
                    if (filteredHyperlink?.length % 2 == 0) {
                        highlightindex++;
                    }
                } else if (pattern.type == "textcolor") {
                    tokens.push({ type: pattern.type, tagname: pattern.tagname, typename: pattern.typename, value: match[0], colorvalue: colorDetails[colorindex], classname: pattern?.classname || "" });
                    const filteredTextColor = tokens.filter((token) => token.type === "textcolor");
                    if (filteredTextColor?.length % 2 == 0) {
                        colorindex++;
                    }
                } else {
                    tokens.push({ type: pattern.type, tagname: pattern.tagname, typename: pattern.typename, value: match[0], classname: pattern?.classname || "" });
                }
                i += match[0].length;
                matched = true;

                break;
            }
        }

        if (!matched) {
            // If we found an unmatched token, consume it as regular text (don't create token)
            if (unmatchedTokenLength > 0) {
                tokens.push({ type: "text", value: text.slice(i, i + unmatchedTokenLength) });
                i += unmatchedTokenLength;
            } else {
                // Normal text consumption
                let j = i + 1;
                while (j <= text.length) {
                    const substring = text.slice(i, j);
                    if (tokenPatterns.some((p) => text.slice(j - 1).match(p.endRegValue)?.index === 0)) {
                        break;
                    } else if (tokenPatterns.some((p) => text.slice(j - 1).match(p.regex)?.index === 0)) {
                        break;
                    }

                    j++;
                }
                tokens.push({ type: "text", value: text.slice(i, j - 1) });
                i = j - 1;
            }
        }
    }
    return tokens;
};

TextHighLightUtils.parseTokens = function (tokens) {
    let html = "";
    const formatStates = {
        bold: false,
        italic: false,
        highlight: false,
        underline: false,
        superscript: false,
        subscript: false,
        hyperlink: false,
        textcolor: false,
        textcolorvalue: false,
        strikethrough: false,
        slidehyperlink: false,
    };
    const formatStack = [];
    let lastTag = "";
    tokens.forEach((token) => {
        if (token.type === "text") {
            html += token.value; //this.escapeHtml(token.value);
        } else if (token.type === "underline") {
            if (token.value === "<u>") {
                html += `<u id="${TextHighLightUtils.uuidv4()}" data-type="SUB_TEXT_SPAN" class="underline">`;
                formatStates.underline = true;
                formatStack.push("underline");
            } else if (token.value === "</u>") {
                if (formatStates.underline) {
                    html += "</u>";
                    formatStates.underline = false;
                    formatStack.pop();
                }
            }
        } else {
            let formatsToToggle = [];
            if (token.type === "bold-italic") {
                formatsToToggle = ["bold", "italic"];
            } else {
                formatsToToggle = [{ type: token.type, tagname: token?.tagname, typename: token?.typename, colorvalue: token?.colorvalue, hyperlink: token?.hyperlink, classname: token?.classname }];
            }
            formatsToToggle.forEach((format) => {
                if (formatStates[format.type]) {
                    // Close the tag
                    html += "</" + format.tagname + ">";
                    formatStates[format.type] = false;
                    formatStack.pop();
                } else {
                    // Open the tag
                    let color = format?.colorvalue?.color?.replaceAll("{", "(")?.replaceAll("}", ")") || "";
                    let hyperLink = format?.hyperlink?.link || "";
                    let tagName = format?.tagname || "span";
                    lastTag = tagName;
                    if (format.type == "slidehyperlink") {
                        const attrs = [`id="${TextHighLightUtils.uuidv4()}"`, `data-navigate-to-slide-on-click="${hyperLink}"`, `data-type="${format?.typename || "SUB_TEXT_SPAN"}"`];
                        if (format?.classname) attrs.push(`class="${format.classname}"`);
                        html += `<${tagName} ${attrs.join(" ")}>`;
                        formatStates[format.type] = true;
                        formatStack.push(format.type);
                    } else if (format.type == "hyperlink") {
                        const attrs = [`id="${TextHighLightUtils.uuidv4()}"`, `href="${hyperLink}"`, `data-type="${format?.typename || "SUB_TEXT_SPAN"}"`];
                        if (format?.classname) attrs.push(`class="${format.classname}"`);
                        html += `<${tagName} ${attrs.join(" ")}>`;
                        formatStates[format.type] = true;
                        formatStack.push(format.type);
                    } else {
                        const attrs = [`id="${TextHighLightUtils.uuidv4()}"`, `data-type="${format?.typename || "SUB_TEXT_SPAN"}"`];
                        if (format?.classname) attrs.push(`class="${format.classname}"`);
                        if (format.type === "textcolor" && color) attrs.push(`style="color:${color};"`);
                        html += `<${tagName} ${attrs.join(" ")}>`;
                        formatStates[format.type] = true;
                        formatStack.push(format.type);
                    }
                }
            });
        }
    });

    // Close any remaining open tags
    while (formatStack.length > 0) {
        html += "</" + lastTag + ">";
        formatStack.pop();
    }

    return html;
};

TextHighLightUtils.traverse = function (node) {
    let markdown = "";
    const classToMarkdown = {
        // Bold marker swapped to †...†
        bold: { before: "†", after: "†" },
        fontbold: { before: "†", after: "†" },
        italic: { before: "!", after: "!" },
        underline: { before: "<u>", after: "</u>" },
        // Highlight marker swapped to **...**
        highlight: { before: "**", after: "**" },
        selectedTextHighlight: { before: "**", after: "**" },
        superscript: { before: "^", after: "^" },
        textcolor: { before: "{_", after: "_}" },
        subscript: { before: "¶", after: "¶" },
        strikethrough: { before: "~~", after: "~~" },
        hyperlink: { before: "[", after: "]" },
        slidehyperlink: { before: "#!", after: "#!" },
    };
    node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
            markdown += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            let before = "";
            let after = "";

            if (child.tagName.toLowerCase() === "span") {
                const classAttr = child.getAttribute("class");
                if (classAttr) {
                    const classNames = classAttr.split(/\s+/); // Split on whitespace
                    const tokens = [];

                    // Collect tokens for each class
                    classNames.forEach((cls) => {
                        const token = classToMarkdown[cls];
                        if (token) {
                            tokens.push(token);
                        }
                    });

                    // Open tokens in the order they appear
                    tokens.forEach((token) => {
                        before += token.before;
                    });

                    // Close tokens in reverse order
                    tokens
                        .slice()
                        .reverse()
                        .forEach((token) => {
                            after += token.after;
                        });
                }

                markdown += before + this.traverse(child) + after;
            } else {
                // For other elements, just traverse their children
                markdown += this.traverse(child);
            }
        }
    });

    return markdown;
};
TextHighLightUtils.getHighLightData = function (hilightData, regData) {
    let objHighlight = { original: hilightData, text: hilightData.replace(regData.startReg, "").replace(regData.endReg, "") };
    if (regData.profile) {
        let link = objHighlight.text.match(/\((.*?)\)\)/gi)?.[0] || null;
        link = link?.replace("((", "(")?.replace("))", ")") || null;
        link = link?.match(/(\((.*?)\))/gi) || null;
        link = link?.map((item) => item.substring(1, item.length - 1) || item);
        if (!link) return objHighlight;
        objHighlight.text = "";
        objHighlight.link = link;
    } else if (regData.image) {
        let link = objHighlight.text.match(/\((.*?)\)/gi)?.[0] || null;
        if (!link) return objHighlight;
        objHighlight.text = "image";
        objHighlight.link = link.replace(/\(|\)|\s/g, "");
    } else if (regData.link) {
        let link = objHighlight.text.match(/\((.*?)\)/gi)?.[0] || null;
        if (!link) return objHighlight;
        objHighlight.text = objHighlight.text.match(/\[(.*?)\]/gi)[0].replace(/\[|\]|\s/g, "");
        objHighlight.link = link.replace(/\(|\)|\s/g, "");
    } else if (regData.slidelink) {
        let link = objHighlight.text.match(/\+\+(.*?)\+\+/)?.[1] || null;
        if (!link) return objHighlight;
        objHighlight.text = objHighlight.text.match(/\#\!(.*?)\#\!/gi)[0].replace(/\#\!|\#\!|\s/g, "");
        objHighlight.link = link;
    } else if (regData.color) {
        let color = objHighlight.text.match(/rgb\{\d{1,3},\d{1,3},\d{1,3}\}/)?.[0] || null;
        let textColor = "";
        let mainTextValue = "";
        if (!color && objHighlight.text.includes("var(")) {
            mainTextValue = objHighlight.text.split("|")?.[1]?.split("|")?.[0];
            textColor = objHighlight.text.split("|")?.[1]?.split("|")?.[0]?.replaceAll("{", "(") || null;
            color = textColor?.replaceAll("}", ")") || "";
        }
        if (!color) return objHighlight;
        objHighlight.text = objHighlight.text.match(/\{\_(.*?)\_\}/gi)[0].replace(/\{\_|\_\}|/g, "");
        objHighlight.color = color;
        objHighlight.texMainColor = mainTextValue;
    }
    return objHighlight;
};

TextHighLightUtils.findEnclosingColorSpan = function (range, rootNode) {
    if (!range) return null;
    let node = range.commonAncestorContainer;
    if (node && node.nodeType === 3 /* TEXT_NODE */) node = node.parentNode;
    while (node && node !== rootNode) {
        if (node.classList && node.classList.contains("selectedTextColor")) {
            return node;
        }
        node = node.parentNode;
    }
    return null;
};

TextHighLightUtils.isLinkProperty = function (strProperty) {
    return strProperty === "selectedtextlinkurl" || strProperty === "selectedtextlinkslide" || strProperty === "chooseslidetonavigateonclick";
};

TextHighLightUtils.isLinkNode = function (node) {
    return !!(node && node.classList && (node.classList.contains("selectedTextHyperlink") || node.classList.contains("selectedTextSlideHyperlink")));
};

// Walks up from the selection to the link run (url or slide) that already wraps it.
// Applying a link on text that sits inside an existing link must UPDATE that run — wrapping
// a second link inside it serializes to nested `[[text](a)](b)` / `#!#!text#!++a++#!++b++`
// markers, which the tokenizer cannot round-trip (the inner link is dropped and the raw
// `++slideid++` marker leaks into the rendered text).
TextHighLightUtils.findEnclosingLinkSpan = function (range, rootNode) {
    if (!range) return null;
    let node = range.commonAncestorContainer;
    if (node && node.nodeType === 3 /* TEXT_NODE */) node = node.parentNode;
    while (node && node !== rootNode) {
        if (TextHighLightUtils.isLinkNode(node)) return node;
        node = node.parentNode;
    }
    return null;
};

// A selection can also SPAN an existing link (e.g. linking "velocity slowed" where only
// "slowed" was linked). Those inner link runs are unwrapped so the new link never nests.
TextHighLightUtils.unwrapNestedLinkSpans = function (nodeSpan) {
    if (!nodeSpan || typeof nodeSpan.querySelectorAll !== "function") return;
    let arrLinks = nodeSpan.querySelectorAll(".selectedTextHyperlink, .selectedTextSlideHyperlink");
    for (let i1 = 0; i1 < arrLinks.length; i1++) {
        let nodeLink = arrLinks[i1];
        if (!nodeLink.parentNode) continue;
        while (nodeLink.firstChild) nodeLink.parentNode.insertBefore(nodeLink.firstChild, nodeLink);
        nodeLink.parentNode.removeChild(nodeLink);
    }
};

// Extracting a range that ends inside a link run splits that run and leaves an empty husk
// behind ("[](https://…)" once serialized). removeEmptySpans only handles <span>s.
TextHighLightUtils.removeEmptyLinkNodes = function (nodeTextElement) {
    if (!nodeTextElement || typeof nodeTextElement.querySelectorAll !== "function") return;
    let arrLinks = nodeTextElement.querySelectorAll(".selectedTextHyperlink, .selectedTextSlideHyperlink");
    for (let i1 = 0; i1 < arrLinks.length; i1++) {
        let nodeLink = arrLinks[i1];
        if (nodeLink.parentNode && (nodeLink.textContent || "").trim() === "") nodeLink.parentNode.removeChild(nodeLink);
    }
};

// url links serialize from the <a> tag ("[text](href)"), slide links from the class on a
// span ("#!text#!++slideid++"), so switching a run's link type has to swap the tag too.
TextHighLightUtils.applyLinkNodeProperties = function (nodeLink, strProperty, strHyperlinkUrl) {
    if (!nodeLink) return null;
    const boolSlideLink = strProperty !== "selectedtextlinkurl";
    const strTagName = boolSlideLink ? "SPAN" : "A";
    let nodeTarget = nodeLink;
    if (nodeLink.tagName !== strTagName) {
        nodeTarget = TextHighLightUtils.createSpecialNode(boolSlideLink ? "span" : "a", nodeLink.getAttribute("id") || TextHighLightUtils.uuidv4());
        if (nodeLink.dataset && nodeLink.dataset.index) nodeTarget.dataset.index = nodeLink.dataset.index;
        while (nodeLink.firstChild) nodeTarget.appendChild(nodeLink.firstChild);
        nodeLink.parentNode.replaceChild(nodeTarget, nodeLink);
    }
    if (boolSlideLink) {
        nodeTarget.removeAttribute("href");
        nodeTarget.classList.remove("selectedTextHyperlink");
        nodeTarget.classList.add("selectedTextSlideHyperlink");
        nodeTarget.setAttribute("data-navigate-to-slide-on-click", strHyperlinkUrl);
    } else {
        if (strHyperlinkUrl && strHyperlinkUrl != "" && !/^(f|ht)tps?:\/\//i.test(strHyperlinkUrl)) {
            strHyperlinkUrl = "https://" + strHyperlinkUrl;
        }
        nodeTarget.removeAttribute("data-navigate-to-slide-on-click");
        nodeTarget.classList.remove("selectedTextSlideHyperlink");
        nodeTarget.classList.add("selectedTextHyperlink");
        nodeTarget.setAttribute("href", strHyperlinkUrl);
    }
    return nodeTarget;
};

// `rangeOverride` is the range the operation captured when the user made the selection.
// The link floater types into an <input>, and while that input holds focus Chrome no longer
// exposes the contenteditable selection (getSelection() is collapsed/empty and addRange() on
// it is a no-op), so the live-selection lookup below finds nothing and the style is silently
// dropped. Callers that hold the original range pass it in as the source of truth.
TextHighLightUtils.applyFormat = function (nodeTextElement, strProperty, boolApplyStyle, strParentTextID, strHyperlinkUrl, strHighlightClassName = "", strSelectedTextColor, rangeOverride = null) {
    let rangeCurrentSelection = TextHighLightUtils.getWindowNonCollapsedSelectionRange();
    if (!rangeCurrentSelection && rangeOverride && !rangeOverride.collapsed) {
        rangeCurrentSelection = rangeOverride;
    }

    // Re-applying a color to text already inside a selectedTextColor span would nest
    // a new span inside the existing one. The nested structure round-trips through
    // highlightToString → parseMarkdown incorrectly, leaving literal "|color|" markers in the rendered text.
    // When the selection covers the full content of the enclosing color span, update its color in place.
    if ((strProperty === "selectedtextcolor" || strProperty === "selectedTextColor") && boolApplyStyle && rangeCurrentSelection && !rangeCurrentSelection.collapsed) {
        const existingColorSpan = TextHighLightUtils.findEnclosingColorSpan(rangeCurrentSelection, nodeTextElement);
        if (existingColorSpan && rangeCurrentSelection.toString() === (existingColorSpan.textContent || "")) {
            existingColorSpan.style.color = strSelectedTextColor || boolApplyStyle;
            existingColorSpan.classList.add("selectedTextColor");
            return existingColorSpan;
        }
    }

    if (strProperty == "mentionprofile") {
        let [image, name, link] = strHyperlinkUrl;
        let strSpanID = TextHighLightUtils.uuidv4();
        if (link) {
            let nodeSpan = TextHighLightUtils.createSpecialNode("a", strSpanID);

            if (!/^(f|ht)tps?:\/\//i.test(link)) {
                link = "https://" + link;
            }

            nodeSpan.setAttribute("href", link);
            nodeSpan.setAttribute("class", "highlightlink");
            nodeSpan.setAttribute("data-type", "@mention");

            if (image) {
                if (!/^(f|ht)tps?:\/\//i.test(image)) {
                    image = "https://" + image;
                }

                let imageNode = TextHighLightUtils.createSpecialNode("img", strSpanID + "-image");
                imageNode.setAttribute("target", "_blank");
                imageNode.setAttribute("src", image);
                imageNode.setAttribute("class", "highlightprofileimage mr-1 rounded-full inline-block max-h-full object-cover");
                imageNode.style.setProperty("height", "1em", "important");
                imageNode.style.setProperty("min-width", "1em", "important");
                imageNode.style.setProperty("width", "1em", "important");
                nodeSpan.appendChild(imageNode);
            }

            if (name) {
                let textNode = document.createTextNode(name);
                nodeSpan.appendChild(textNode);
            }

            let para = document.createElement("p");
            para.setAttribute("data-type", "@mention");
            para.style.setProperty("display", "inline-block");
            para.style.setProperty("pointer-events", "auto");
            para.appendChild(nodeSpan);
            nodeTextElement.appendChild(para);
            return para;
        }
    } else if (strProperty == "selectedtextimage" || rangeCurrentSelection) {
        let nodeSpan = TextHighLightUtils.getSelectedTextSpan(rangeCurrentSelection);
        const boolApply = boolApplyStyle;
        let strSelectionID = null;

        // Removing a link: the selection can sit deeper than the link run (getSelectedTextSpan
        // only resolves the common ancestor), so fall back to the enclosing link run.
        if (!boolApply && !nodeSpan && TextHighLightUtils.isLinkProperty(strProperty)) {
            nodeSpan = TextHighLightUtils.findEnclosingLinkSpan(rangeCurrentSelection, nodeTextElement);
        }
        // Applying a link on text already inside a link: retarget that run instead of nesting.
        if (boolApply && TextHighLightUtils.isLinkProperty(strProperty)) {
            const nodeExistingLink = TextHighLightUtils.findEnclosingLinkSpan(rangeCurrentSelection, nodeTextElement);
            if (nodeExistingLink) {
                let nodeUpdatedLink = TextHighLightUtils.applyLinkNodeProperties(nodeExistingLink, strProperty, strHyperlinkUrl);
                TextHighLightUtils.removeEmptySpans(nodeTextElement);
                TextHighLightUtils.removeEmptyLinkNodes(nodeTextElement);
                return nodeUpdatedLink;
            }
        }

        if (!boolApply && nodeSpan) {
            nodeSpan = TextHighLightUtils.matchSelectedNode(nodeSpan, strProperty, strParentTextID);
            strSelectionID = nodeSpan.getAttribute("id");

            switch (strProperty) {
                case "fontoverline":
                    nodeSpan.classList.remove("selectedTextOverline");
                    break;
                case "selectedtexthighlight":
                    TextHighLightUtils.removeHighlightSpan(nodeTextElement, nodeSpan);
                    break;
                case "fontbold":
                case "fontitalic":
                case "fontunderline":
                case "fontstrikethrough":
                case "selectedtextbold":
                case "selectedtextitalic":
                case "selectedtextunderline":
                case "selectedtextstrikethrough":
                case "selectedtextsubscript":
                case "selectedtextsuperscript":
                case "selectedtextlinkurl":
                case "chooseslidetonavigateonclick":
                    //remove unwnated span it conflicts with highlight span //if any issue check with sankar
                    // let nodeReplacement = TextHighLightUtils.createSpan(strSelectionID);
                    // nodeReplacement.innerHTML = nodeSpan.innerHTML;
                    // if (nodeSpan.dataset.index) nodeReplacement.dataset.index = nodeSpan.dataset.index;
                    // nodeSpan.parentNode.replaceChild(nodeReplacement, nodeSpan);
                    TextHighLightUtils.removeHighlightSpan(nodeTextElement, nodeSpan);
                    break;
            }
        } else if (boolApply) {
            let strSpanID = TextHighLightUtils.uuidv4();
            strSelectionID = strSpanID;
            nodeSpan = TextHighLightUtils.createSpan(strSpanID);
            switch (strProperty) {
                case "selectedtextbold":
                case "fontbold":
                    nodeSpan = TextHighLightUtils.createSpecialNode("b", strSpanID);
                    break;
                case "selectedtextitalic":
                case "fontitalic":
                    nodeSpan = TextHighLightUtils.createSpecialNode("i", strSpanID);
                    break;
                case "selectedtextunderline":
                case "fontunderline":
                    nodeSpan = TextHighLightUtils.createSpecialNode("u", strSpanID);
                    break;
                case "selectedtextstrikethrough":
                case "fontstrikethrough":
                    nodeSpan = TextHighLightUtils.createSpecialNode("s", strSpanID);
                    break;
                case "selectedtextsubscript":
                    nodeSpan = TextHighLightUtils.createSpecialNode("sub", strSpanID);
                    break;
                case "selectedtextsuperscript":
                    nodeSpan = TextHighLightUtils.createSpecialNode("sup", strSpanID);
                    break;
                case "fontoverline":
                    nodeSpan.setAttribute("class", "selectedTextOverline");
                    break;
                case "selectedtexthighlight":
                    let strTextHighlightClassName = "selectedTextHighlight";
                    if (strHighlightClassName && strHighlightClassName != "") {
                        strTextHighlightClassName += " " + strHighlightClassName;
                    }
                    nodeSpan.setAttribute("class", strTextHighlightClassName);
                    break;
                case "selectedtextimage":
                    nodeSpan = TextHighLightUtils.createSpecialNode("img", strSpanID);
                    nodeSpan.setAttribute("target", "_blank");
                    if (strHyperlinkUrl && strHyperlinkUrl != "") {
                        if (!/^(f|ht)tps?:\/\//i.test(strHyperlinkUrl)) {
                            strHyperlinkUrl = "https://" + strHyperlinkUrl;
                        }
                        nodeSpan.setAttribute("src", strHyperlinkUrl);
                        nodeSpan.setAttribute("class", "selectedTextImg");
                        nodeSpan.style.height = window.getComputedStyle(nodeTextElement).lineHeight + "!important";
                    }
                    break;
                case "selectedTextColor":
                case "selectedtextcolor":
                    nodeSpan.style.color = strSelectedTextColor || boolApplyStyle;
                    nodeSpan.classList.remove("selectedTextColor");
                    nodeSpan.classList.add("selectedTextColor");
                    break;
                case "profileimage":
                    nodeSpan = TextHighLightUtils.createSpecialNode("img", strSpanID);
                    nodeSpan.setAttribute("target", "_blank");
                    if (strHyperlinkUrl && strHyperlinkUrl != "") {
                        if (!/^(f|ht)tps?:\/\//i.test(strHyperlinkUrl)) {
                            strHyperlinkUrl = "https://" + strHyperlinkUrl;
                        }
                        nodeSpan.setAttribute("src", strHyperlinkUrl);
                        nodeSpan.setAttribute("class", "highlightprofileimage mr-1 pb-2 rounded-full inline-block h-24 w-24 max-h-full object-cover");
                        // nodeSpan.style.height = window.getComputedStyle(nodeTextElement).lineHeight + "!important";
                        // nodeSpan.style.width = window.getComputedStyle(nodeTextElement).lineHeight + "!important";
                        let lineHeight = parseFloat(window.getComputedStyle(nodeTextElement).lineHeight?.replace("px", "") || "20");
                        let height = parseFloat(window.getComputedStyle(nodeTextElement).height?.replace("px", "") || "20");
                        let _h = Math.max(lineHeight, height) + 10 + "px";
                        nodeSpan.style.setProperty("height", _h, "important");
                        nodeSpan.style.setProperty("min-width", _h, "important");
                        nodeSpan.style.setProperty("width", _h, "important");
                    }
                    break;
                case "selectedtextlinkurl":
                    nodeSpan = TextHighLightUtils.createSpecialNode("a", strSpanID);

                    if (strHyperlinkUrl && strHyperlinkUrl != "") {
                        if (!/^(f|ht)tps?:\/\//i.test(strHyperlinkUrl)) {
                            strHyperlinkUrl = "https://" + strHyperlinkUrl;
                        }
                        nodeSpan.setAttribute("href", strHyperlinkUrl);
                        nodeSpan.setAttribute("class", "selectedTextHyperlink");
                    }
                    break;
                case "selectedtextlinkslide":
                    nodeSpan.setAttribute("class", "selectedTextSlideHyperlink");
                    nodeSpan.setAttribute("data-navigate-to-slide-on-click", strHyperlinkUrl);
                    break;
            }

            if (nodeSpan) {
                if (rangeCurrentSelection?.commonAncestorContainer?.tagName == "UL" || rangeCurrentSelection?.commonAncestorContainer?.tagName == "OL" || rangeCurrentSelection?.commonAncestorContainer?.parentElement?.tagName == "OL" || rangeCurrentSelection?.endContainer?.tagName == "LI") {
                    // below is logic to loop and apply highlight to all the li
                    TextHighLightUtils.highlightRangeAcrossList(rangeCurrentSelection, nodeSpan);
                } else {
                    let childs = rangeCurrentSelection.extractContents().childNodes;
                    childs.forEach((element) => {
                        if (element.textContent == "") element.remove();
                        else nodeSpan.appendChild(element.cloneNode(true));
                    });
                    // A selection that swallows an existing link would otherwise nest it.
                    if (TextHighLightUtils.isLinkProperty(strProperty)) TextHighLightUtils.unwrapNestedLinkSpans(nodeSpan);
                    rangeCurrentSelection.insertNode(nodeSpan);
                }
            }
        }

        TextHighLightUtils.removeEmptySpans(nodeTextElement);
        TextHighLightUtils.removeEmptyLinkNodes(nodeTextElement);
        return nodeSpan;
    } else {
        console.log("nodeTarget or strProperty is null or empty");
    }
    return null;
};

TextHighLightUtils.highlightRangeAcrossList = function (range, nodeSpan) {
    // Get all intersected <li> elements
    const liElements = [];
    const allLis = Array.from(range.commonAncestorContainer.querySelectorAll ? range.commonAncestorContainer.querySelectorAll("li") : range.commonAncestorContainer.parentNode.querySelectorAll("li"));
    allLis.forEach((li) => {
        if (range.intersectsNode(li)) liElements.push(li);
    });

    liElements.forEach((li, idx) => {
        let liRange = document.createRange();
        if (li === liElements[0] && li === liElements[liElements.length - 1]) {
            // Only one li selected
            liRange.setStart(range.startContainer, range.startOffset);
            liRange.setEnd(range.endContainer, range.endOffset);
        } else if (li === liElements[0]) {
            liRange.setStart(range.startContainer, range.startOffset);
            liRange.setEndAfter(li.lastChild);
        } else if (li === liElements[liElements.length - 1]) {
            liRange.setStartBefore(li.firstChild);
            liRange.setEnd(range.endContainer, range.endOffset);
        } else {
            liRange.selectNodeContents(li);
        }
        // Wrap the selected content in a span
        const span = nodeSpan.cloneNode(true);
        liRange.surroundContents(span);
    });
};

TextHighLightUtils.getElementsInRange = function (range) {
    const elements = [];
    const root = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentNode;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode: function (node) {
            // Only accept nodes that intersect the range
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
    });

    let node = walker.currentNode;
    // If the root node itself is in range, include it
    if (range.intersectsNode(root)) {
        elements.push(root);
    }
    while (node) {
        if (node !== root) elements.push(node);
        node = walker.nextNode();
    }
    return elements;
};

TextHighLightUtils.matchSelectedNode = function (nodeTarget, strProperty, strParentRefID) {
    if (nodeTarget && strProperty && strProperty != "") {
        const strFloatProp = strProperty;
        const strRemoveNodeName = nodeTarget.nodeName;
        const arrClassList = nodeTarget && nodeTarget.classList ? nodeTarget.classList : null;
        const intClassLength = arrClassList ? arrClassList.length : 0;

        for (let c1 = 0; c1 < intClassLength; c1++) {
            const strClassName = arrClassList[c1];

            switch (strClassName) {
                case "selectedTextOverline":
                    if (strFloatProp === "fontoverline") {
                        return nodeTarget;
                    }
                    break;
                case "selectedTextHighlight":
                    if (strFloatProp === "selectedtexthighlight") {
                        return nodeTarget;
                    }
                    break;
                case "selectedTextHyperlink":
                    if (strFloatProp === "selectedtextlinkurl") {
                        return nodeTarget;
                    }
                    break;
                case "selectedTextSlideHyperlink":
                    if (strFloatProp === "selectedtextlinkurl" || strFloatProp === "chooseslidetonavigateonclick") {
                        return nodeTarget;
                    }
                    break;
            }
        }

        switch (strRemoveNodeName) {
            case "B":
                if (strFloatProp === "fontbold" || strFloatProp === "selectedtextbold") {
                    return nodeTarget;
                }
                break;
            case "I":
                if (strFloatProp === "fontitalic" || strFloatProp === "selectedtextitalic") {
                    return nodeTarget;
                }
                break;
            case "U":
                if (strFloatProp === "fontunderline" || strFloatProp === "selectedtextunderline") {
                    return nodeTarget;
                }
                break;
            case "S":
                if (strFloatProp === "fontstrikethrough" || strFloatProp === "selectedtextstrikethrough") {
                    return nodeTarget;
                }
                break;
            case "SUB":
                if (strFloatProp === "selectedtextsubscript") {
                    return nodeTarget;
                }
                break;
            case "SUP":
                if (strFloatProp === "selectedtextsuperscript") {
                    return nodeTarget;
                }
                break;
            case "A":
                if (strFloatProp === "selectedtextlinkurl") {
                    return nodeTarget;
                }
                break;
        }

        if (nodeTarget.parentNode) {
            const nodeTargetParent = nodeTarget.parentNode;
            const strParentNodeID = nodeTargetParent.getAttribute("id");

            if (strParentRefID && strParentRefID != "" && strParentNodeID === strParentRefID) {
                return nodeTarget;
            }
            return TextHighLightUtils.matchSelectedNode(nodeTargetParent, strProperty, strParentRefID);
        } else {
            return nodeTarget;
        }
    }
};

TextHighLightUtils.removeHighlightSpan = function (nodeTextElement, nodeSpan) {
    let nodeReplacement = document.createElement("removediv");
    nodeReplacement.innerHTML = nodeSpan.innerHTML;
    if (nodeSpan.dataset.index) nodeReplacement.dataset.index = nodeSpan.dataset.index;
    if (nodeSpan.parentElement.id == "spandiv") {
        nodeSpan.parentElement.parentElement.replaceChild(nodeReplacement, nodeSpan.parentElement);
    } else {
        nodeSpan.parentElement.replaceChild(nodeReplacement, nodeSpan);
    }
    nodeTextElement.classList.forEach((className) => {
        if (className.includes("-disabled")) {
            nodeTextElement.classList.remove(className);
        }
    });
    // let strText = nodeTextElement.innerHTML;
    // strText = strText.replace(/<removediv>/g, "removediv");
    // strText = strText.replace(/<\/removediv>/g, "removediv");

    // let result = strText.split("removediv");
    // let innerHtmlText = "";
    // let isSpan = false;
    // for (let i22 = 0; i22 < result.length; i22++) {
    //     innerHtmlText += result[i22];
    // }
    if (nodeReplacement && nodeReplacement.parentElement) {
        if (nodeReplacement.parentElement.getElementsByTagName("removediv").length > 0) nodeReplacement.parentElement.getElementsByTagName("removediv")[0].removeAttribute("data-index");
        nodeReplacement.parentElement.innerHTML = nodeReplacement.parentElement.innerHTML.replace(/<removediv>|<\/removediv>/g, "");
    }
};

TextHighLightUtils.removeEmptySpans = function (nodeTextElement) {
    if (nodeTextElement && !nodeTextElement.id.includes("ql-editor")) {
        let spanElements = nodeTextElement.getElementsByTagName("span");

        if (spanElements) {
            for (let i1 = 0; i1 < spanElements.length; i1++) {
                let nodeSpan = spanElements[i1];

                if (nodeSpan && nodeSpan.textContent.trim() === "") {
                    nodeSpan.parentNode.removeChild(nodeSpan);
                }
            }
        }
    }
};

TextHighLightUtils.attachFocusOutEventListeners = function (elTextElement, fnCallbackSelectionHandler, fnCallbackPasteHandler = null, fnKeyDownHandler = null) {
    if (elTextElement) {
        if (fnKeyDownHandler) {
            elTextElement.addEventListener("keydown", fnKeyDownHandler);
        }
        if (fnCallbackSelectionHandler) {
            elTextElement.addEventListener("keyup", fnCallbackSelectionHandler);
            elTextElement.addEventListener("mouseup", fnCallbackSelectionHandler);
        }
        if (fnCallbackPasteHandler) {
            elTextElement.addEventListener("paste", fnCallbackPasteHandler);
        }
    }
};

TextHighLightUtils.detachFocusOutEventListeners = function (elTextElement, fnCallbackSelectionHandler, fnCallbackPasteHandler = null, fnKeyDownHandler = null) {
    if (elTextElement) {
        if (fnKeyDownHandler) {
            elTextElement.removeEventListener("keydown", fnKeyDownHandler);
        }
        if (fnCallbackSelectionHandler) {
            elTextElement.removeEventListener("keyup", fnCallbackSelectionHandler);
            elTextElement.removeEventListener("mouseup", fnCallbackSelectionHandler);
        }
        if (fnCallbackPasteHandler) {
            elTextElement.removeEventListener("paste", fnCallbackPasteHandler);
        }
    }
};

TextHighLightUtils.stopEventFlow = function (event) {
    if (event) {
        event.preventDefault();

        if (event.stopPropagation) {
            event.stopPropagation();
        } else if (window.event) {
            window.event.cancelBubble = true;
        }
    }
};

TextHighLightUtils.preventTextEditShortcuts = function (event) {
    if (event) {
        const keyCode = event.which || event.keyCode;
        if (event.ctrlKey && (keyCode === 66 || keyCode === 73)) {
            TextHighLightUtils.stopEventFlow(event);
        }
    }
};

TextHighLightUtils.makeTextSelection = function (textNode, start, length) {
    if (document.selection) {
        //Code for IE and few other
        document.selection.empty();
        let div = document.body.createTextRange();
        div.moveToElementText(textNode);
        div.setEndPoint("EndToEnd", div);
        div.moveStart("character", start);
        if (length + start > textNode.innerHTML.length) length = textNode.innerHTML.length - start;
        div.moveEnd("character", -(textNode.innerHTML.length - start - length));
        div.select();
        return div;
    } else {
        //code for FF and few other
        if (textNode) {
            window.getSelection().removeAllRanges();
            while (textNode.hasChildNodes()) textNode = textNode.childNodes[0];
            let divRange = document.createRange();
            divRange.setStart(textNode, start);
            if (start + length > textNode.length) length = textNode.length - start;
            divRange.setEnd(textNode, start + length);
            window.getSelection().addRange(divRange);
            return divRange;
        }
    }
};

TextHighLightUtils.getTextNodeProperties = function (nodeTextElement) {
    if (nodeTextElement && nodeTextElement.dataset) {
        return nodeTextElement.dataset;
    }
    return null;
};

TextHighLightUtils.applyTextNodeDatasetProperties = function (nodeTextElement, objDataSet, arrFontClasses, slide) {
    if (nodeTextElement && nodeTextElement.style && objDataSet) {
        // const strTextTransform = objDataSet.hasOwnProperty("textTransform") ? objDataSet.textTransform : "";
        // const strFontSize = objDataSet.hasOwnProperty("fontSize") ? objDataSet.fontSize : "";
        // const strBGOpacity = objDataSet.hasOwnProperty("bgopacity") ? objDataSet.bgopacity : "";
        // const strBGClass = objDataSet.hasOwnProperty("background") ? objDataSet.background : "";
        // const strCharSpace = objDataSet.hasOwnProperty("letterSpacing") ? objDataSet.letterSpacing : "";

        if (objDataSet.hasOwnProperty("textTransform") && objDataSet.textTransform != "") {
            nodeTextElement.setAttribute("data-text-transform", objDataSet.textTransform);
            nodeTextElement.style.setProperty("text-transform", objDataSet.textTransform, "important");
        }

        if (objDataSet.hasOwnProperty("letterSpacing") && objDataSet.letterSpacing != "") {
            nodeTextElement.setAttribute("data-letterspacing", objDataSet.letterSpacing);
            nodeTextElement.style.setProperty("letter-spacing", objDataSet.letterSpacing, "important");
        }

        if (objDataSet.hasOwnProperty("letterspacing") && objDataSet.letterspacing != "") {
            nodeTextElement.setAttribute("data-letterspacing", objDataSet.letterspacing);
            nodeTextElement.style.setProperty("letter-spacing", objDataSet.letterspacing, "important");
        }

        // if (objDataSet.hasOwnProperty("fontSize") && objDataSet.fontSize != "") {
        //     nodeTextElement.setAttribute("data-user-font-size", "1");
        //     nodeTextElement.setAttribute("data-font-size", objDataSet.fontSize);
        //     nodeTextElement.style.setProperty("font-size", objDataSet.fontSize, "important");
        // }
        if (objDataSet.hasOwnProperty("customfontclass") && objDataSet.customfontclass != "") {
            TextHighLightUtils.removeFontClassName(nodeTextElement, arrFontClasses);
            nodeTextElement.setAttribute("data-customfontsize", "true");
            nodeTextElement.setAttribute("data-customfontclass", objDataSet.customfontclass);
            nodeTextElement.classList.add(objDataSet.customfontclass);
        }

        if (objDataSet.hasOwnProperty("column")) {
            let ColumnCountValue = objDataSet.column;
            nodeTextElement.setAttribute("columnType", "column-" + ColumnCountValue);
            nodeTextElement.style.columnCount = ColumnCountValue;
            nodeTextElement.classList.add("columnCount");
        }

        if (objDataSet.hasOwnProperty("fontsize") && objDataSet.fontsize != "") {
            TextHighLightUtils.removeFontClassName(nodeTextElement, arrFontClasses);
            nodeTextElement.setAttribute("data-customfontsize", "true");
            nodeTextElement.setAttribute("data-fontsize", objDataSet.fontsize);
            nodeTextElement.classList.add(objDataSet.fontsize);
        }

        if (objDataSet.hasOwnProperty("userbg") && objDataSet.userbg != "") {
            nodeTextElement.setAttribute("data-userbg", objDataSet.userbg);
        }
        if (objDataSet.hasOwnProperty("bgopacity") && objDataSet.bgopacity != "") {
            nodeTextElement.setAttribute("data-bgopacity", objDataSet.bgopacity);
        }
        if (objDataSet.hasOwnProperty("textposition") && slide) {
            slide.setAttribute("data-textposition", objDataSet.textposition);
        }
        if (objDataSet.hasOwnProperty("usertextposition") && slide) {
            slide.setAttribute("data-usertextposition", objDataSet.usertextposition);
        }
    }
};

TextHighLightUtils.removeFontClassName = function (targetNode, fontClassList) {
    let arrFontClassNames = fontClassList;
    if (arrFontClassNames) {
        for (let i = 0; i < arrFontClassNames.length; i++) {
            targetNode.classList.remove(...arrFontClassNames[i].split(" "));
        }
    }
};

TextHighLightUtils.applyTextHighlightProperties = function (nodeTextElement, nodeSpan) {
    let objDataSet;
    let highlightType = "smalltext";
    let strHighlightClassName = "cs-heading-highlight-text-style";
    if (nodeTextElement.id == "SUBTITLE" || nodeTextElement.id == "TEXTBOX" || nodeTextElement.id == "subtitle" || nodeTextElement.id == "textbox" || nodeTextElement.id.includes("body")) {
        strHighlightClassName = "cs-body-highlight-text-style";
    } else if (nodeTextElement.id == "SLIDE_LABEL" || nodeTextElement.classList?.contains("slide-label") || nodeTextElement.id.includes("sgTitleLabelNode") || nodeTextElement.id.includes("textLabel")) {
        strHighlightClassName = "cs-body-highlight-text-style";
    }
    if (nodeSpan) {
        nodeSpan.setAttribute("data-highlightanimation", "animate");
    }
    let moodMainData = TextHighLightUtils.getMoodData();
    let layoutproperties = moodMainData && moodMainData.layoutproperties ? moodMainData.layoutproperties : null;
    if (layoutproperties && layoutproperties.hasOwnProperty("texthighlightproperties")) {
        if (layoutproperties.texthighlightproperties) {
            objDataSet = layoutproperties.texthighlightproperties;

            let isBgNotFill = nodeTextElement && nodeTextElement.hasAttribute("isBgFill") ? nodeTextElement.getAttribute("isBgFill") : "false";
            if (nodeTextElement.id == "TITLE" || nodeTextElement.id == "title" || nodeTextElement.id.includes("primaryText") || nodeTextElement.id.includes("diagramTitle") || ((nodeTextElement.id.includes("sgTitleNode") || nodeTextElement.id.includes("sgAuthorNameNode")) && isBgNotFill == "false")) {
                objDataSet = objDataSet.bigtext;
                nodeTextElement.setAttribute("data-supportedtexthighlight", "bigtext");
                highlightType = "bigtext";
            } else if (
                nodeTextElement.id == "SUBTITLE" ||
                nodeTextElement.id == "SLIDE_LABEL" ||
                nodeTextElement.id == "TEXTBOX" ||
                nodeTextElement.id == "subtitle" ||
                nodeTextElement.id == "textbox" ||
                nodeTextElement.classList?.contains("slide-label") ||
                nodeTextElement.id.includes("secondaryText") ||
                nodeTextElement.id.includes("labeltext") ||
                nodeTextElement.id.includes("textNode") ||
                nodeTextElement.id.includes("textLabel") ||
                nodeTextElement.id.includes("subText") ||
                nodeTextElement.id.includes("sgSubTitleNode") ||
                nodeTextElement.id.includes("sgTitleLabelNode") ||
                isBgNotFill == "true"
            ) {
                objDataSet = objDataSet.smalltext;
                nodeTextElement.setAttribute("data-supportedtexthighlight", "smalltext");
                if (isBgNotFill == "true") strHighlightClassName = "cs-body-highlight-text-style";
            }
        }
    }
    if (nodeSpan && nodeSpan.style && objDataSet) {
        nodeSpan.removeAttribute("data-highlight-type");
        let fixedFontColor = "false";
        if (objDataSet.hasOwnProperty("fixedfontcolor") && objDataSet.fixedfontcolor == "true") {
            fixedFontColor = "true";
        }
        nodeSpan.setAttribute("data-fixed-font-color", fixedFontColor);
        if (objDataSet.hasOwnProperty("align") && objDataSet.align != "") {
            nodeSpan.setAttribute("data-align", objBackground.align);
        }
        if (objDataSet.hasOwnProperty("background") && objDataSet.background != "") {
            let objBackground = objDataSet.background;
            if (objBackground.hasOwnProperty("show") && objBackground.show != "" && objBackground.show) {
                nodeSpan.removeAttribute("class");
                nodeSpan.classList.add("selectedTextHighlight");
                nodeSpan.classList.add("highlightbg");
                let strColor = objBackground.color ? objBackground.color : "";
                nodeSpan.classList.add("animatehighlightbg" + strColor);
                if (objBackground.hasOwnProperty("color") && objBackground.color != "") nodeSpan.setAttribute("data-color", objBackground.color);
            } else {
                nodeSpan.classList.add(strHighlightClassName);
            }
            nodeSpan.setAttribute("data-highlight-type", "background");
        }
        if (objDataSet.hasOwnProperty("backgroundbottomborder") && objDataSet.backgroundbottomborder != "") {
            let objBackground = objDataSet.backgroundbottomborder;
            if (objBackground.hasOwnProperty("show") && objBackground.show != "" && objBackground.show) {
                nodeSpan.removeAttribute("class");
                nodeSpan.classList.add("selectedTextHighlight");
                nodeSpan.classList.add("highlightbgbottomborder");
                let strColor = objBackground.color ? objBackground.color : "";
                nodeSpan.classList.add("animatehighlightbgbottomborder" + strColor);
                if (objBackground.hasOwnProperty("color") && objBackground.color != "") nodeSpan.setAttribute("data-color", objBackground.color);
            } else {
                nodeSpan.classList.add(strHighlightClassName);
            }
            nodeSpan.setAttribute("data-highlight-type", "backgroundbottomborder");
        } else {
            nodeSpan.classList.add(strHighlightClassName);
        }
        if (objDataSet.hasOwnProperty("pattern") && objDataSet.pattern != "" && patternPath && patternPath != "") {
            nodeSpan.classList.add("highlightpattern");
            var parser = new DOMParser();
            var xmlPatternSvg = parser.parseFromString(patternPath, "image/svg+xml").documentElement;
            let styleData = window.getComputedStyle(nodeSpan);
            let color = styleData.getPropertyValue("color");
            xmlPatternSvg.setAttribute("fill", color);
            let xmlData = new XMLSerializer().serializeToString(xmlPatternSvg);
            var base64Data = window.btoa(xmlData);
            nodeSpan.style.backgroundImage = "url(" + "data:image/svg+xml;base64," + base64Data + ")";
        }
        if (objDataSet.hasOwnProperty("border") && objDataSet.border != "") {
            let objBorder = objDataSet.border;
            nodeSpan.style.setProperty("display", "inline-flex");
            nodeSpan.classList.add("highlightborder");
            nodeSpan.classList.add("animatehighlightborder");
            /* if (objBorder.hasOwnProperty("width") && objBorder.width != "") {
                nodeSpan.style.setProperty("border-top", objBorder.width[0]);
                nodeSpan.style.setProperty("border-right", objBorder.width[1]);
                nodeSpan.style.setProperty("border-bottom", objBorder.width[2]);
                nodeSpan.style.setProperty("border-left", objBorder.width[3]);
            }
            if (objBorder.hasOwnProperty("style") && objBorder.style != "") nodeSpan.style.setProperty("border-style", objBorder.style); */
            nodeSpan.setAttribute("data-highlight-type", "border");
        }
        if (objDataSet.hasOwnProperty("gradientborder") && objDataSet.gradientborder != "") {
            let objGradientBorder = objDataSet.gradientborder;
            nodeSpan.classList.add("highlightgradientborder");
            nodeSpan.classList.add("animatehighlightgradientborder");
            nodeSpan.style.setProperty("background-size", objGradientBorder.size, "important");
            nodeSpan.style.setProperty("background-position", objGradientBorder.position, "important");
            nodeSpan.style.setProperty("background-image", objGradientBorder.bgcolor, "important");
            nodeSpan.setAttribute("data-highlight-type", "gradientborder");
        }
        if (objDataSet.hasOwnProperty("font") && objDataSet.font != "") {
            let objFont = objDataSet.font;
            let finalStyle = window.getComputedStyle(nodeTextElement, null);
            let fontSize = finalStyle["fontSize"];
            if (objFont.hasOwnProperty("size") && objFont.size != "") {
                if (objFont.size.includes("+")) fontSize = Number(fontSize.split("px")[0]) + Number(objFont.size.split("+")[1]);
                else if (objFont.size.includes("-")) fontSize = Number(fontSize.split("px")[0]) - Number(objFont.size.split("-")[1]);
                nodeSpan.style.setProperty("font-size", fontSize + "px");
            }
            if (objFont.hasOwnProperty("weight") && objFont.weight != "") nodeSpan.style.setProperty("font-weight", objFont.weight);
            if (objFont.hasOwnProperty("style") && objFont.style != "") {
                //nodeSpan.style.setProperty("font-style", objFont.style);
                nodeSpan.classList.add(highlightType == "bigtext" ? "hl1" : "hl2");
                nodeSpan.style.setProperty("font-size", fontSize);
                // nodeSpan.style.setProperty("padding-right", "10px");
            }
            if (objFont.hasOwnProperty("stretch") && objFont.stretch != "") nodeSpan.style.setProperty("font-stretch", objFont.stretch);
            if (objFont.hasOwnProperty("lineheight") && objFont.lineheight != "") nodeSpan.style.setProperty("line-height", objFont.lineheight);
            if (objFont.hasOwnProperty("letterspacing") && objFont.letterspacing != "") nodeSpan.style.setProperty("letter-spacing", objFont.letterspacing);
            if (objFont.hasOwnProperty("texttransform") && objFont.texttransform != "") nodeSpan.style.setProperty("text-transform", objFont.texttransform);
            if (objFont.hasOwnProperty("textdecoration") && objFont.textdecoration != "") {
                nodeSpan.style.setProperty("display", "inline-flex");
                nodeSpan.classList.add("highlightline");
                nodeSpan.classList.add("animatehighlightline");
            }
            nodeSpan.setAttribute("data-highlight-type", "font");
        }
        if (objDataSet.hasOwnProperty("annotate") && objDataSet.annotate != "") {
            nodeSpan.classList.add("animatehighlightbg");
            nodeSpan.classList.remove(strHighlightClassName);
            nodeSpan.style.backgroundImage = "none";
            nodeSpan.setAttribute("annotate", objDataSet.annotate);
            var annotation = annotate(nodeSpan, { type: objDataSet.annotate, color: "var(--item" + 1 + "-color)", padding: 15 });
            annotation._svg.id = nodeSpan.id;
            annotation._svg.style.left = nodeSpan.offsetLeft;
            /* annotation._svg.style.width = nodeSpan.offsetWidth;
            annotation._svg.style.height = nodeSpan.offsetHeight; */
            annotation.animate = false;
            annotation.multiline = true;
            annotation.rects();
            annotation.hide();
            annotation.show();
            nodeSpan.setAttribute("data-highlight-type", "annotate");
        }
    } else if (nodeSpan) {
        nodeSpan.classList.add(strHighlightClassName);
        nodeTextElement.classList.add(strHighlightClassName + "-disabled");
    }
};

TextHighLightUtils.createHighlightColor = function (strProperty = null, targetNode, moodsData) {
    let colorStyle = "";
    let index = moodsData?.layoutproperties?.texthighlightproperties?.hdcolorindex || 0;

    if (targetNode) {
        if (targetNode.getAttribute("data-highlight-color-index")) {
            index = parseInt(targetNode.getAttribute("data-highlight-color-index")) + 1;
        }
        switch (strProperty) {
            case "hdtextcolor_theme1":
                colorStyle = "accent1";
                index = 0;
                break;
            case "hdtextcolor_theme2":
                colorStyle = "accent2";
                index = 1;
                break;
            case "hdtextcolor_theme3":
                colorStyle = "accent3";
                index = 2;
                break;
            case "hdtextcolor_theme4":
                colorStyle = "accent4";
                index = 3;
                break;
            case "hdtextcolor_theme5":
                colorStyle = "accent5";
                index = 4;
                break;
            case "hdtextcolor_theme6":
                colorStyle = "accent6";
                index = 5;
                break;
            case "hdtextcolor_theme7":
                colorStyle = "accent7";
                index = 6;
                break;
            case "hdtextcolor_gradient1":
                colorStyle = "gradient1";
                index = 0;
                break;
            case "hdtextcolor_gradient2":
                colorStyle = "gradient2";
                index = 1;
                break;
            case "hdtextcolor_gradient3":
                colorStyle = "gradient3";
                index = 2;
                break;
            case "hdtextcolor_gradient4":
                colorStyle = "gradient4";
                index = 3;
                break;
            case "hdtextcolor_gradient5":
                colorStyle = "gradient5";
                index = 4;
                break;
            case "hdtextcolor_gradient6":
                colorStyle = "gradient6";
                index = 5;
                break;
            case "hdtextcolor_gradient7":
                colorStyle = "gradient7";
                index = 6;
                break;
            default:
                colorStyle = "accent" + index;
                if (index != 0) index -= 1;
                break;
        }
        targetNode.setAttribute("data-highlight-color-index", index);
        let highlightNodes = targetNode.querySelectorAll(".selectedTextHighlight");
        for (let i1 = 0; i1 < highlightNodes.length; i1++) {
            if (moodsData?.layoutproperties?.texthighlightproperties?.hascolorchange == "true") {
                highlightNodes[i1].setAttribute("data-hdcolor", colorStyle);
                targetNode.setAttribute("enablehighlight", "true");
            } else {
                highlightNodes[i1].removeAttribute("data-hdcolor");
                targetNode.removeAttribute("data-highlight-color-index");
                targetNode.removeAttribute("enablehighlight");
            }
        }
    }
};

TextHighLightUtils.clearStylesBasedOnType = function (nodeTextElement, type) {
    try {
        if (nodeTextElement && type) {
            if (type == "textcolor") {
                let arrStyleElements = nodeTextElement.querySelectorAll("[class='selectedTextColor']");
                for (let a = 0; a < arrStyleElements.length; a++) {
                    let nodeUnwrapSubItem = arrStyleElements[a];
                    $(nodeUnwrapSubItem).contents().unwrap();
                }
            } else if (type == "fontbold" || type == "fontitalic") {
                let arrStyleElements = nodeTextElement.getElementsByTagName(type == "fontbold" ? "b" : "i");
                for (let a = 0; a < arrStyleElements.length; a++) {
                    let nodeUnwrapSubItem = arrStyleElements[a];
                    $(nodeUnwrapSubItem).contents().unwrap();
                }
            }
        }
    } catch (error) {
        console.log("TextHighLightUtils.clearStylesBasedOnType:", error);
    }
};

/**
 * Author:    Saravanan G
 * Created:   27.09.2019
 *
 * (c) Copyright by Gs.
 **/

"use strict";

function ExportUtils() {}

ExportUtils.prototype.constructor = ExportUtils;

ExportUtils.setSlideWidthHeight = function (width, height) {
    this.slideWidth = width || 1920;
    this.slideHeight = height || 1080;
};

ExportUtils.getCropStyle = function (contentNode) {
    let objStyle = {};
    objStyle.x = contentNode.style.getPropertyValue("x");
    objStyle.y = contentNode.style.getPropertyValue("y");
    objStyle.left = contentNode.style.getPropertyValue("left");
    objStyle.width = contentNode.style.getPropertyValue("width");
    objStyle.height = contentNode.style.getPropertyValue("height");
    objStyle.right = contentNode.style.getPropertyValue("right");
    objStyle.top = contentNode.style.getPropertyValue("top");
    objStyle.bottom = contentNode.style.getPropertyValue("bottom");
    objStyle.opacity = parseFloat(contentNode.style.getPropertyValue("opacity"));
    objStyle.transform = contentNode.style.getPropertyValue("transform");
    objStyle["object-fit"] = contentNode.style.getPropertyValue("object-fit");
    let cntStyle = contentNode ? window.getComputedStyle(contentNode) : null;
    if (objStyle["object-fit"] == "" && cntStyle?.objectFit != "") objStyle["object-fit"] = cntStyle.objectFit;
    return objStyle;
};

ExportUtils.getVideoData = function (image, contentNode, parentID, name = "VIDEO", staticServerURL) {
    let objData = { type: "video", name: name, thumbnailtime: 1000, format: "Video", "auto-play": true, cache: false };

    let path = image.src;
    path = CommonDataUtils.checkAppStaticUrl(path, staticServerURL);
    objData.url = path;

    let thumbnailURL = image.getAttribute("poster") || image.getAttribute("data-medialink-thumb-url") || "";
    if (thumbnailURL?.includes("/genericassets/video/preset/")) objData.thumbnail = thumbnailURL;
    else if (!thumbnailURL && path?.includes("/assets/resources/genericassets/video/intro/")) objData.thumbnail = path.replace(".mp4", ".jpeg").replace(".webm", ".jpeg");
    else if (!thumbnailURL) objData.thumbnail = staticServerURL + "genericassets/video/video_placeholder.jpg";
    else objData.thumbnail = thumbnailURL;

    objData.coords = ExportUtils.getCoords(image, parentID);
    let arrCoords = objData.coords.split(" ");
    objData.width = arrCoords[2];
    objData.height = arrCoords[3];

    objData.coords = [objData.coords.split(" ")[0], objData.coords.split(" ")[1], contentNode.clientWidth, contentNode.clientHeight].join(" ");

    let coords = objData.coords.split(" ");
    if (parseFloat(coords[0]) > this.slideWidth || parseFloat(coords[1]) > this.slideHeight) return null;

    return objData;
};

ExportUtils.getEmbedVideoData = function (image, contentNode, parentID, name = "WebVideo", staticServerURL) {
    let objData = { type: "video", name: name, thumbnailtime: 1000, format: "WebVideo", cache: false, "auto-play": true };

    let path = image.getAttribute("data-medialink-url");
    path = CommonDataUtils.checkAppStaticUrl(path, staticServerURL);
    objData.url = path;

    let thumbnailURL = image.getAttribute("poster") || image.getAttribute("data-medialink-thumb-url") || "";
    thumbnailURL = CommonDataUtils.checkAppStaticUrl(thumbnailURL, staticServerURL);
    objData.thumbnail = thumbnailURL;

    objData.coords = ExportUtils.getCoords(image, parentID);
    let arrCoords = objData.coords.split(" ");
    objData.width = arrCoords[2];
    objData.height = arrCoords[3];

    objData.coords = [objData.coords.split(" ")[0], objData.coords.split(" ")[1], contentNode.clientWidth, contentNode.clientHeight].join(" ");

    let coords = objData.coords.split(" ");
    if (parseFloat(coords[0]) > this.slideWidth || parseFloat(coords[1]) > this.slideHeight) return null;

    return objData;
};

ExportUtils.getImageData = function (image, contentNode, parentID, name = "IMAGE", staticServerURL) {
    let objData = { type: "image", name: name || image?.getAttribute("data-type") || "IMAGE" };
    let path =
        image.tagName.toLowerCase() == "video"
            ? image.hasAttribute("poster")
                ? image.getAttribute("poster")
                : ""
            : name == "medialink" && image.hasAttribute("data-medialink-thumb-url")
              ? image.getAttribute("data-medialink-thumb-url")
              : image.hasAttribute("data-medialink-thumb-url")
                ? image.getAttribute("data-medialink-thumb-url")
                : image.src;
    let imageStyle = window.getComputedStyle(image);
    let bgImage = image.style.backgroundImage ? image.style.backgroundImage : imageStyle.backgroundImage;
    if (!path && bgImage) {
        if (bgImage.includes("url(")) bgImage = bgImage.replace('url("', "").replace('")', "");
        path = bgImage;
        // objData.type = "drawing";
    }
    path = CommonDataUtils.checkAppStaticUrl(path, staticServerURL);

    objData.path = path;
    if (window.isOrigamiPPTX) {
        objData.imagesize = { width: image.offsetWidth, height: image.offsetHeight };
        let type = image.dataset.type || image.dataset.nodetype || null;
        if (type) objData.imagetype = type.toLowerCase().includes("logo") ? "logo" : "image";
        if (image.dataset.width || image.dataset.height || image.id == "FOOTER_LOGO_IMG") objData.imagefit = true;
    }

    if (objData.path && objData.path.includes(".mp4") && contentNode && contentNode.hasAttribute("poster")) objData.path = contentNode.getAttribute("poster");
    if (contentNode.id == parentID) objData.coords = ExportUtils.getCoords(image, parentID);
    else objData.coords = ExportUtils.getCoords(contentNode, parentID);

    let parentStyle = window.getComputedStyle(image.parentElement);
    if (!isNaN(parseFloat(parentStyle.borderWidth)) && parseFloat(parentStyle.borderWidth) > 0) {
        let arrCoords = objData.coords.split(" ");
        objData.coords = [parseFloat(arrCoords[0]) + parseFloat(parentStyle.borderWidth), parseFloat(arrCoords[1]) + parseFloat(parentStyle.borderWidth), arrCoords[2], arrCoords[3]].join(" ");
    }

    objData.coords = [objData.coords.split(" ")[0], objData.coords.split(" ")[1], contentNode.clientWidth, contentNode.clientHeight].join(" ");

    // objData.style = ExportUtils.getCustomComputedStyle(image, objData);
    objData["inner-style"] = ExportUtils.getCustomComputedStyle(image, objData, false);
    if (window.isOrigamiPPTX) {
        let arrProps = ["left", "top", "width", "height"];
        for (let a = 0; a < arrProps.length; a++) {
            objData["inner-style"][arrProps[a]] = image.style[arrProps[a]];
        }
    }
    ExportUtils.updateBufferStyle(objData, parentStyle, image.parentElement, "buffer-style", true);
    delete objData["buffer-style"]["border-width"];
    delete objData["buffer-style"]["border-style"];
    delete objData["buffer-style"]["border-color"];
    delete objData["buffer-style"]["outline-width"];
    delete objData["buffer-style"]["outline-style"];
    delete objData["buffer-style"]["outline-color"];

    ExportUtils.setTransfromOriginForImage(objData);

    if (image.hasAttribute("data-medialink-thumb-url")) objData["inner-style"]["object-fit"] = "cover";

    // if (styleData["opacity"] && styleData["opacity"] != "" && styleData["opacity"] != "1" && styleData["opacity"] != "0") {
    //     objData.style.opacity = parseFloat(styleData["opacity"]);
    //     objData.style.alpha = objData.opacity;
    //     objData.opacity = parseFloat(styleData["opacity"]);
    //     objData.alpha = objData.opacity;
    // }
    // let trans = window.getComputedStyle(image).transform;
    // if (trans && trans != "matrix(1, 0, 0, 1, 0, 0)" && (objData.style["background-image"]?.includes("url(") || trans?.includes("scale(") || trans?.includes("matrix("))) {
    //     if (trans.includes("matrix") || (trans.includes("translate") && trans != "translate(0px, 0px)")) objData.promote = false;
    // }
    if (image.hasAttribute("data-fit") && image.getAttribute("data-fit") == "false" && image.id.includes("textFallImage")) {
        objData.coords = objData.coords.split(" ")[0] + " " + (image.id.includes("textFallImage") ? image.offsetTop : objData.coords.split(" ")[1]) + " " + image.clientHeight + " " + image.clientHeight;
        objData["inner-style"]["top"] = "0px";
        objData["inner-style"]["left"] = "0px";
    }
    ExportUtils.updateImageClip(image.parentElement, objData);
    // ExportUtils.updateBorderRadiusFromParent(image.parentElement, objData);
    // objData.crop = ExportUtils.getCropStyle(image);
    if (objData["buffer-style"]?.["transform"] == "matrix(1, 0, 0, 0, 0, 0)") objData.coords = "0 0 0 0";

    let coords = objData.coords.split(" ");
    if (parseFloat(coords[0]) > this.slideWidth || parseFloat(coords[1]) > this.slideHeight) objData.coords = "0 0 0 0";

    if (name == "medialink" && !objData.crop.width && !objData.crop.height) {
        objData.crop.width = "100%";
        objData.crop.height = "100%";
        objData.crop.left = "0px";
        objData.crop.top = "0px";
    }
    if (objData["inner-style"].width == "2560px" && objData["inner-style"].height == "1440px" && objData["inner-style"].transform == "scale(0.5)") {
        objData["inner-style"].width = this.slideWidth + "px";
        objData["inner-style"].height = this.slideHeight + "px";
        delete objData["inner-style"].transform;
        objData.crop.width = this.slideWidth + "px";
        objData.crop.height = this.slideHeight + "px";
        delete objData.crop.transform;
    }
    if (objData["inner-style"]["width"] == "0px") objData["inner-style"]["width"] = "auto";
    if (objData["inner-style"]["height"] == "0px") objData["inner-style"]["height"] = "auto";
    objData.crop = ExportUtils.removeEmptyItems(objData.crop);

    // Find and add overlay divs by searching for elements with overlay classes
    const parentContainer = image.parentElement;
    const overlay1 = parentContainer?.querySelector(".ci-element-image-overlay1") || parentContainer?.querySelector(".ci-element-person-overlay1") || parentContainer?.querySelector(".ci-element-stock-overlay1");
    const overlay2 = parentContainer?.querySelector(".ci-element-image-overlay2") || parentContainer?.querySelector(".ci-element-person-overlay2") || parentContainer?.querySelector(".ci-element-stock-overlay2");
    let hasMixBlendMode = false;
    if (overlay1) {
        const blendMode1 = window.getComputedStyle(overlay1).mixBlendMode;
        if (blendMode1 && blendMode1 !== "normal") hasMixBlendMode = true;
    }
    if (overlay2) {
        const blendMode2 = window.getComputedStyle(overlay2).mixBlendMode;
        if (blendMode2 && blendMode2 !== "normal") hasMixBlendMode = true;
    }
    if (hasMixBlendMode && image?.parentElement?.classList?.contains("export-image-filter-container")) {
        // Helper function to copy only essential CSS properties
        const copyEssentialStyles = (computedStyle, targetElement) => {
            const essentialProps = [
                "position",
                "top",
                "left",
                "right",
                "bottom",
                "width",
                "height",
                "display",
                "background",
                "background-color",
                "background-image",
                "background-size",
                "background-position",
                "background-repeat",
                "border-radius",
                "mask-image",
                "-webkit-mask-image",
                "opacity",
                "z-index",
                "filter",
                "backdrop-filter",
                "mix-blend-mode",
                "color",
            ];

            essentialProps.forEach((prop) => {
                const value = computedStyle.getPropertyValue(prop);
                if (value && value !== "none" && value !== "normal" && value !== "") {
                    targetElement.style.setProperty(prop, value);
                }
            });
        };

        // Helper function to get z-index value
        const getZIndex = (element) => {
            const computedStyle = window.getComputedStyle(element);
            const zIndex = computedStyle.getPropertyValue("z-index");
            return zIndex === "auto" ? 0 : parseInt(zIndex) || 0;
        };

        // Helper function to capture image and overlay divs
        const captureImageWithOverlays = (imageElement) => {
            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.width = "100%";
            wrapper.style.height = "100%";

            // Collect all elements (image + overlays)
            const elements = [];

            // Add the image element
            const imageWrapper = document.createElement("div");
            imageWrapper.style.position = "relative";
            imageWrapper.style.width = "100%";
            imageWrapper.style.height = "100%";
            const clonedImage = imageElement.cloneNode(true);
            // Copy computed styles (including CSS-applied filter) to inline styles on the cloned image
            // so that outerHTML captures them (outerHTML only includes inline styles, not stylesheet rules)
            const imageComputedStyle = window.getComputedStyle(imageElement);
            copyEssentialStyles(imageComputedStyle, clonedImage);

            // Check image parent for mask-image and border-radius
            const imageParent = imageElement.parentElement;
            if (imageParent) {
                const parentStyle = window.getComputedStyle(imageParent);
                const maskImage = parentStyle.getPropertyValue("mask-image") || parentStyle.getPropertyValue("-webkit-mask-image");
                if (maskImage && maskImage !== "none" && maskImage !== "") {
                    const maskProps = ["mask-image", "-webkit-mask-image", "mask-size", "-webkit-mask-size", "mask-position", "-webkit-mask-position", "mask-repeat", "-webkit-mask-repeat", "mask-origin", "-webkit-mask-origin", "mask-clip", "-webkit-mask-clip", "mask-composite", "-webkit-mask-composite", "mask-mode"];
                    maskProps.forEach((prop) => {
                        const val = parentStyle.getPropertyValue(prop);
                        if (val && val !== "none" && val !== "") {
                            wrapper.style.setProperty(prop, val);
                        }
                    });
                }
                const borderRadius = parentStyle.getPropertyValue("border-radius");
                if (borderRadius && borderRadius !== "0px" && borderRadius !== "") {
                    imageWrapper.style.setProperty("border-radius", borderRadius);
                }
            }

            imageWrapper.appendChild(clonedImage);

            elements.push({
                element: imageWrapper,
                zIndex: getZIndex(imageElement),
                type: "image",
            });

            if (overlay1) {
                const overlay1Clone = overlay1.cloneNode(true);
                // Copy computed styles to inline styles
                const overlay1Styles = window.getComputedStyle(overlay1);
                copyEssentialStyles(overlay1Styles, overlay1Clone);

                elements.push({
                    element: overlay1Clone,
                    zIndex: getZIndex(overlay1),
                    type: "overlay1",
                });
            }

            if (overlay2) {
                const overlay2Clone = overlay2.cloneNode(true);
                // Copy computed styles to inline styles
                const overlay2Styles = window.getComputedStyle(overlay2);
                copyEssentialStyles(overlay2Styles, overlay2Clone);

                elements.push({
                    element: overlay2Clone,
                    zIndex: getZIndex(overlay2),
                    type: "overlay2",
                });
            }

            // Sort elements by z-index (ascending order - lower z-index first)
            elements.sort((a, b) => a.zIndex - b.zIndex);

            // Append elements to wrapper in sorted order
            elements.forEach((item) => {
                wrapper.appendChild(item.element);
            });

            // Get outerHTML and fix self-closing tags for XHTML compatibility
            let html = wrapper.outerHTML;
            // Ensure img tags are self-closing in XHTML format
            html = html.replace(/<img\s+([^>]*?)(\s*\/?\s*)>/gi, "<img $1 />");
            // Also handle any other void elements that might need self-closing
            html = html.replace(/<(br|hr|input|meta|link)(\s+[^>]*?)(\s*\/?\s*)>/gi, "<$1$2 />");

            return html;
        };

        let elementWithOverlays = captureImageWithOverlays(image);
        let newSvg = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="position: relative; width: 100%; height: 100%; overflow: hidden;">' + elementWithOverlays + "</div></foreignObject></svg>";

        // UTF-8 safe base64 encoding
        try {
            delete objData.path;
            delete objData.crop;
            delete objData["buffer-style"];
            delete objData["inner-style"];
            if (overlay1) overlay1.style.display = "none";
            if (overlay2) overlay2.style.display = "none";
            objData.svg = window.btoa(unescape(encodeURIComponent(newSvg)));
        } catch (e) {
            console.error("Error encoding SVG to base64:", e);
            objData.svg = "";
        }
    }

    return objData;
};

ExportUtils.defaultBufferStyle = function (objData, styleNode, coords, element) {
    objData["buffer-style"] = {
        width: coords.w + "px",
        height: coords.h + "px",
        position: "absolute",
        overflow: "hidden",
        left: "0px",
        top: "0px",
    };

    let outlineWidth = styleNode.outlineWidth;
    let borderWidth = styleNode.borderWidth;
    if (!isNaN(parseFloat(outlineWidth))) {
        borderWidth = !isNaN(parseFloat(outlineWidth)) ? parseFloat(borderWidth) : parseFloat(0);
        let coordsData = objData.coords.split(" ");
        // objData["buffer-style"]["left"] = parseFloat(objData["buffer-style"]["left"]) - parseFloat(outlineWidth) / 2 + "px";
        // objData["buffer-style"]["top"] = parseFloat(objData["buffer-style"]["top"]) - parseFloat(outlineWidth) / 2 + "px";
        // objData["buffer-style"]["width"] = parseFloat(objData["buffer-style"]["width"]) + parseFloat(outlineWidth) * 2 + parseFloat(borderWidth) * 2 + "px";
        // objData["buffer-style"]["height"] = parseFloat(objData["buffer-style"]["height"]) + parseFloat(outlineWidth) * 2 + parseFloat(borderWidth) * 2 + "px";
        // coordsData[0] = parseFloat(coordsData[0]) - parseFloat(outlineWidth) / 2 - parseFloat(borderWidth) / 2;
        // coordsData[1] = parseFloat(coordsData[1]) - parseFloat(outlineWidth) / 2 - parseFloat(borderWidth) / 2;
        coordsData[2] = parseFloat(coordsData[2]) + parseFloat(outlineWidth) * 2;
        coordsData[3] = parseFloat(coordsData[3]) + parseFloat(outlineWidth) * 2;
        objData.coords = coordsData.join(" ");

        objData["buffer-style"]["width"] = element.clientWidth + "px";
        objData["buffer-style"]["height"] = element.clientHeight + "px";
    }
};
ExportUtils.updateBufferStyle = function (objData, parentStyle, element, type, isImage = false) {
    ExportUtils.updateStyleData(objData, parentStyle, null, type);
    objData[type].position = parentStyle.position;
    objData[type].overflow = parentStyle.overflow;
    objData[type]["box-sizing"] = parentStyle.boxSizing;
    if (element.clientWidth > 0) objData[type].width = element.clientWidth + "px";
    if (element.clientHeight > 0) objData[type].height = element.clientHeight + "px";

    if (!isImage) {
        let elementStyle = window.getComputedStyle(element);
        let outlineWidth = 0; //elementStyle.outlineWidth;
        let borderWidth = 0; //!isNaN(parseFloat(elementStyle.borderWidth)) ? elementStyle.borderWidth : 0;
        if (!isNaN(parseFloat(outlineWidth))) {
            let coordsData = objData.coords.split(" ");
            coordsData[0] = parseFloat(coordsData[0]) - parseFloat(outlineWidth);
            coordsData[1] = parseFloat(coordsData[1]) - parseFloat(outlineWidth);
            coordsData[2] = (element.clientWidth == 0 ? element.offsetWidth : element.clientWidth) + parseFloat(outlineWidth) * 2 + (!isNaN(parseFloat(borderWidth)) ? parseFloat(borderWidth) * 2 : 0);
            coordsData[3] = (element.clientHeight == 0 ? element.offsetHeight : element.clientHeight) + parseFloat(outlineWidth) * 2 + (!isNaN(parseFloat(borderWidth)) ? parseFloat(borderWidth) * 2 : 0);
            objData.coords = coordsData.join(" ");
            objData[type]["left"] = parseFloat(outlineWidth) + "px";
            objData[type]["top"] = parseFloat(outlineWidth) + "px";
        }
        if (!isNaN(parseFloat(borderWidth))) {
            objData[type]["width"] = element.clientWidth + "px";
            objData[type]["height"] = element.clientHeight + "px";
        }
    }
    if (type == "buffer-style" && (!objData[type].transform || !objData[type].transform == "" || !objData[type].transform == "none" || !objData[type].transform == "unset" || !objData[type].transform == "scale(1)")) {
        let parentNodeStyle = window.getComputedStyle(element.parentElement);
        if ((!parentNodeStyle.transform || parentNodeStyle.transform == "" || parentNodeStyle.transform == "none" || parentNodeStyle.transform == "unset" || parentNodeStyle.transform == "scale(1)" || parentNodeStyle.transform == "matrix(1, 0, 0, 1, 0, 0)") && element.parentElement.parentElement)
            parentNodeStyle = window.getComputedStyle(element.parentElement.parentElement);
        let matrixValue = this.updateTransformData(parentNodeStyle);
        if (matrixValue) {
            objData[type].transform = matrixValue;
            objData[type]["transform-origin"] = "left top";
        }
    }
};

ExportUtils.updateImageClip = function (parentElement, objData) {
    let cpStyle = window.getComputedStyle(parentElement);
    if ((cpStyle && (!cpStyle["clipPath"] || (cpStyle["clipPath"] && cpStyle["clipPath"] == "none"))) || (cpStyle["clipPath"] && cpStyle["clipPath"] == "unset")) cpStyle = window.getComputedStyle(parentElement.parentElement);
    let parentClip = parentElement && parentElement.parentElement ? parentElement.parentElement.style.clipPath : "";
    let isClipEmpty = cpStyle["clipPath"] == "none" || cpStyle["clipPath"] == "unset" || cpStyle["clipPath"] == "" || !cpStyle["clipPath"];
    if ((parentElement && (parentClip == "" || parentClip == "unset") && isClipEmpty && !cpStyle["clipPath"]?.includes("#")) || (parentElement.id.includes("coverParent") && (!cpStyle["clipPath"] || cpStyle["clipPath"] == "none"))) {
        if (parentElement.style.clipPath && !parentElement.parentElement.style.clipPath) parentElement = parentElement;
        else parentElement = parentElement.parentElement;
        cpStyle = window.getComputedStyle(parentElement);
    }
    if (cpStyle && cpStyle["clipPath"]) {
        let pathName = cpStyle["clipPath"].replace('url("#', "").replace('")', "");
        let clipPath = document.querySelector("clipPath[id='" + pathName + "']");
        if (clipPath) {
            if (objData["buffer-style"] && !objData["buffer-style"]?.["clip-path"]) {
                if (!objData["buffer-style"]) objData["buffer-style"] = {};
                objData["buffer-style"]["clip-path"] = cpStyle["clipPath"];
            }
            let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            for (let c = 0; c < clipPath.children.length; c++) {
                g.appendChild(clipPath.children[c].cloneNode(true));
            }
            svg.appendChild(g);
            let xmlData = new XMLSerializer().serializeToString(svg);
            let mainSVG = ExportUtils.getParentNodeByName("svg", clipPath);
            if (mainSVG) {
                objData.svgmask = window.btoa(new XMLSerializer().serializeToString(mainSVG));
            }
            objData.mask = window.btoa(xmlData);
            if (clipPath.children.length > 0) {
                let arrPath = clipPath.parentElement.parentElement?.getAttribute("path")?.split("/");
                if (arrPath) {
                    let pathLength = arrPath.length;
                    objData.gsmaskid = clipPath.children[0].getAttribute("id");
                    let arrDevicePaths = ["photographic", "professional", "outline", "clay", "frame", "modern", "outline"];
                    let isMatched = false;
                    for (let a = 0; a < arrDevicePaths.length; a++) {
                        if (arrPath[pathLength - 2].includes(arrDevicePaths[a])) isMatched = true;
                    }

                    let prefixPath = arrPath[pathLength - 2] && isMatched ? arrPath[pathLength - 2] + "-" : "";
                    objData.maskid = prefixPath + arrPath[pathLength - 1].replace(".svg", "");
                    let arrCoords = objData.coords.split(" ");
                    let rectBox = clipPath.children[0].getBBox();
                    objData.maskcoords = [rectBox.x + parseFloat(arrCoords[0]), rectBox.y + parseFloat(arrCoords[1]), rectBox.width - rectBox.x / 2, rectBox.height].toString().replace(/,/g, " ");
                    objData.maskcoords = objData.coords;
                    objData.coords = objData.maskcoords;
                }
            }
            if (objData.style?.transform?.includes("matrix")) {
                try {
                    let coords = objData.coords.split(" ");
                    let tranformVal = objData.style.transform;
                    let transformX = tranformVal.split(",")[0].replace("matrix(", "").trim();
                    let transformY = tranformVal.split(",")[3].trim();
                    let oldW = parseFloat(coords[2]);
                    let oldH = parseFloat(coords[3]);
                    coords[2] = parseFloat(coords[2]) * parseFloat(transformX);
                    coords[3] = parseFloat(coords[3]) * parseFloat(transformY);
                    coords[0] = parseFloat(coords[0]) + (oldW - parseFloat(coords[2])) / 2;
                    coords[1] = parseFloat(coords[1]) + (oldH - parseFloat(coords[3])) / 2;
                    objData.style.transform = "unset";
                    objData.coords = coords.join(" ");
                } catch (error) {
                    console.log("SG - Image clip coords change error  - ", error);
                }
            }
        }
    }
};

ExportUtils.getParentNodeByName = function (nodeName, element) {
    if (!element) {
        console.log("element is null", element);
        return;
    }
    let parentNode = element.parentElement;
    while (parentNode && parentNode.nodeName.toLowerCase() != nodeName) {
        parentNode = parentNode.parentElement;
    }
    return parentNode;
};

ExportUtils.getCustomComputedStyle = function (nodeItem, objData, takeParentStyle = true) {
    let style = {};
    let nodeStyle = nodeItem ? window.getComputedStyle(nodeItem) : null;
    if (nodeItem && nodeItem.style) {
        let styleData = nodeItem.style;
        const keys = Object.keys(styleData);
        keys.forEach((element) => {
            let intValue = parseInt(element);
            let keyValue = styleData[element];
            if (intValue != NaN && intValue > -1) {
                let finalVal = nodeStyle[keyValue] != styleData[styleData[element]] ? nodeStyle[keyValue] : styleData[styleData[element]];
                if (styleData[element] == "transform") {
                    let matrixValue = this.updateTransformData(nodeStyle, null, nodeItem);
                    if (matrixValue) style["transform"] = matrixValue;
                    else style[styleData[element]] = finalVal;
                } else style[styleData[element]] = finalVal;
            } else return style;
        });
        if (!style["width"]) style["width"] = nodeStyle.width;
        if (!style["height"]) style["height"] = nodeStyle.height;
    }

    let nodeParent = takeParentStyle ? nodeItem.parentElement : null;
    let parentNodeStyle = nodeParent ? window.getComputedStyle(nodeParent) : null;
    if (nodeItem.tagName.toLowerCase() == "img") {
        if (nodeItem.hasAttribute("data-fit") && nodeItem.getAttribute("data-fit") == "false") style["position"] = nodeStyle.position;
        else style["position"] = nodeStyle.position;
    }
    if (nodeStyle["-webkit-mask-image"] != "none" && nodeStyle["-webkit-mask-image"] != "unset" && nodeStyle["-webkit-mask-image"] != "") {
        style["-webkit-mask-image"] = nodeStyle["-webkit-mask-image"];
        style["-webkit-mask-size"] = nodeStyle["-webkit-mask-size"] || "100%";
        style["-webkit-mask-position"] = nodeStyle["-webkit-mask-position"] || "center";
        style["-webkit-mask-repeat"] = nodeStyle["-webkit-mask-repeat"] || "no-repeat";
    } else if (nodeParent) {
        if (parentNodeStyle["-webkit-mask-image"] != "none" && parentNodeStyle["-webkit-mask-image"] != "unset" && parentNodeStyle["-webkit-mask-image"] != "") {
            style["-webkit-mask-image"] = parentNodeStyle["-webkit-mask-image"];
            style["-webkit-mask-size"] = parentNodeStyle["-webkit-mask-size"] || "100%";
            style["-webkit-mask-position"] = parentNodeStyle["-webkit-mask-position"] || "center";
            style["-webkit-mask-repeat"] = parentNodeStyle["-webkit-mask-repeat"] || "no-repeat";
        }
    }
    if (nodeStyle["box-shadow"] && nodeStyle["box-shadow"] != "" && nodeStyle["box-shadow"] != "none" && nodeStyle["box-shadow"] != "unset") {
        objData.shadow = nodeStyle["box-shadow"];
    } else if (parentNodeStyle && parentNodeStyle["box-shadow"] && parentNodeStyle["box-shadow"] != "" && parentNodeStyle["box-shadow"] != "none" && parentNodeStyle["box-shadow"] != "unset") {
        objData.shadow = parentNodeStyle["box-shadow"];
    }
    if (nodeItem && nodeStyle.objectFit) style["object-fit"] = nodeStyle.objectFit;
    if (nodeItem && nodeStyle.filter) style["filter"] = nodeStyle.filter;
    if (nodeItem && nodeStyle.clipPath) style["clip-path"] = nodeStyle.clipPath;
    if (nodeItem && nodeStyle.borderRadius) style["border-radius"] = nodeStyle.borderRadius;
    if ((!style["clip-path"] && nodeParent) || (style["clip-path"] == "none" && nodeItem && nodeParent && parentNodeStyle.clipPath)) style["clip-path"] = parentNodeStyle.clipPath;

    // BG color not taken in some times from style so checking it here
    if (nodeStyle["background-color"] && nodeStyle["background-color"] != "" && nodeStyle["background-color"] != undefined && nodeStyle["background-color"] != "none" && nodeStyle["background-color"] != "transparent" && !style["background-color"]) {
        style["background-color"] = nodeStyle["background-color"];
    }

    let isSlideParent = nodeParent?.hasAttribute("data-type") && nodeParent?.getAttribute("data-type") == "SLIDE";
    if (!isSlideParent) isSlideParent = nodeParent?.parentElement?.hasAttribute("data-type") && nodeParent?.parentElement?.getAttribute("data-type") == "SLIDE";
    if (!isSlideParent && (!style["transform"] || style["transform"] == "scale(1)" || style["transform"] == "" || style["transform"] == "none") && nodeParent) {
        let parentStyle = window.getComputedStyle(nodeParent.parentElement);
        style["transform"] = parentStyle.transform;
        let matrixValue = this.updateTransformData(parentStyle);
        if (matrixValue) style["transform"] = matrixValue;
        style["transform-origin"] = nodeParent.parentElement.style.transformOrigin;
        if ((!style["transform"] || style["transform"] == "scale(1)" || style["transform"] == "" || style["transform"] == "none") && nodeParent.parentElement) {
            parentStyle = window.getComputedStyle(nodeParent.parentElement.parentElement);
            style["transform"] = parentStyle.transform;
            matrixValue = this.updateTransformData(parentStyle);
            if (matrixValue) style["transform"] = matrixValue;
            style["transform-origin"] = nodeParent.parentElement.style.transformOrigin;
        }
    }
    if (style["transform-origin-x"] == "" && style["transform-origin-y"] == "" && style["transform-origin-z"] == "") {
        let to = nodeStyle["-webkit-transform-origin"];
        style["transform-origin"] = to;
        delete style["transform-origin-x"];
        delete style["transform-origin-y"];
        delete style["transform-origin-z"];
    }
    style = ExportUtils.removeEmptyItems(style);
    return style;
};

ExportUtils.updateTransformData = function (computedStyle, style, nodeItem, returnOriginal = false) {
    if (computedStyle) {
        let transformValue = computedStyle.transform || computedStyle.webkitTransform;
        if (transformValue == "none" || transformValue == "" || transformValue == "unset") return;
        if (transformValue == "matrix(-1, 0, 0, 1, 0, 0)" || transformValue == "matrix(1, 0, 0, -1, 0, 0)") return transformValue;

        if (transformValue.includes("matrix") && !returnOriginal) {
            transformValue = ExportUtils.removeMatrixTranslation(transformValue);
            return transformValue;
        }

        let values = transformValue.match(/-?[\d.]+/g);
        var a = parseFloat(values[0]);
        var b = parseFloat(values[1]);
        var c = parseFloat(values[2]);
        var d = parseFloat(values[3]);

        if (((a == 1 && b == 0 && d == 1 && c != 0 && c != 1) || (a == 1 && c == 0 && d == 1 && b != 0 && b != 1)) && style) {
            style["transform-origin"] = "left top";
            style["origincheck"] = "true";
            return transformValue;
        }

        var scaleX = Math.sqrt(a * a + b * b);
        var scaleY = Math.sqrt(c * c + d * d);
        var rotationInRadians = Math.atan2(b, a);
        var rotationInDegrees = rotationInRadians * (180 / Math.PI);
        if (rotationInDegrees == 0) {
            scaleX = parseFloat(values[0]);
            var scaleY = parseFloat(values[3]);
        }
        const newValues = this.getTransformValues(transformValue);
        const formatted = this.formatTransform(newValues);
        if (formatted != "none") return formatted;

        // Get the matrix as a string for use in CSS
        let matrixValue = "scaleX(" + scaleX + ")" + " scaleY(" + scaleY + ")" + (rotationInDegrees ? " rotate(" + rotationInDegrees + "deg)" : "");
        return matrixValue;
    } else null;
};

ExportUtils.removeMatrixTranslation = function (matrixString) {
    // Ensure it's a matrix string
    if (!matrixString.includes("matrix(")) return matrixString;

    // Extract matrix values
    const matchResult = matrixString.match(/matrix\(([^)]+)\)/);

    if (!matchResult) return matrixString;

    // Split the matrix values
    const values = matchResult[1].split(",").map(parseFloat);

    // If matrix doesn't have 6 values, return original
    if (values.length !== 6) return matrixString;

    // Create new matrix with translation (tx, ty) set to 0
    const newMatrixString = `matrix(${values[0]},${values[1]},${values[2]},${values[3]},0,0)`;

    return newMatrixString;
};

ExportUtils.getTransformValues = function (transformStyle) {
    // Default values
    const defaultValues = { scale: 1, scaleX: 1, scaleY: 1, rotate: 0, translateX: 0, translateY: 0 };

    // Handle empty, none, or unset cases
    if (!transformStyle || transformStyle === "none" || transformStyle === "" || transformStyle === "unset" || transformStyle === "initial") {
        return defaultValues;
    }

    // Handle matrix case
    if (transformStyle.includes("matrix")) {
        try {
            const matrix = new DOMMatrix(transformStyle);
            const decomposed = { ...defaultValues, translateX: matrix.e, translateY: matrix.f };

            // Careful rotation extraction
            const rotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            if (Math.abs(rotation) > 0.001) {
                decomposed.rotate = rotation;
            }

            return decomposed;
        } catch (error) {
            console.warn("Error parsing matrix:", error);
            return defaultValues;
        }
    }

    try {
        // Handle individual transforms
        const values = { ...defaultValues };
        const transforms = transformStyle.match(/[\w]+\([^)]+\)/g) || [];

        transforms.forEach((transform) => {
            const [func, valueStr] = transform.match(/(\w+)\(([-\d.]+)([^\d)]*)\)/).slice(1);
            const value = parseFloat(valueStr);

            switch (func.toLowerCase()) {
                case "scale":
                    values.scale = value;
                    break;
                case "scalex":
                    values.scaleX = value;
                    break;
                case "scaley":
                    values.scaleY = value;
                    break;
                case "rotate":
                    values.rotate = value;
                    break;
                case "translatex":
                    values.translateX = value;
                    break;
                case "translatey":
                    values.translateY = value;
                    break;
                case "translate":
                    const [x, y] = valueStr.split(",").map((v) => parseFloat(v));
                    values.translateX = x || 0;
                    values.translateY = y || 0;
                    break;
            }
        });

        return values;
    } catch (error) {
        console.warn("Error parsing transforms:", error);
        return defaultValues;
    }
};

ExportUtils.formatTransform = function (values) {
    const transforms = [];
    // Only add non-default values
    if (values.scale !== 1) transforms.push(`scale(${values.scale})`);
    if (values.scaleX !== 1) transforms.push(`scaleX(${values.scaleX})`);
    if (values.scaleY !== 1) transforms.push(`scaleY(${values.scaleY})`);
    if (values.rotate !== 0) transforms.push(`rotate(${values.rotate}deg)`);
    // if (values.translateX !== 0) transforms.push(`translateX(${values.translateX}px)`);
    // if (values.translateY !== 0) transforms.push(`translateY(${values.translateY}px)`);
    return transforms.length ? transforms.join(" ") : "none";
};

ExportUtils.getChildSVGData = function (iconNode, parentNode, parentID, name = "IMAGE", svgDefsLocal, mainSVG, staticServerURL) {
    iconNode.classList.add("pptxnoanimation");
    let objData = { type: "image", name: name || parentID || parentNode?.id || "SVG" };
    // Gantt chart connector arrow check
    let arrowNode = iconNode?.querySelectorAll("g[class='arrows']");
    if (arrowNode?.length > 0) {
        let displayValue = window.getComputedStyle(arrowNode[0]).display;
        if (displayValue == "none") arrowNode[0].parentElement.removeChild(arrowNode[0]);
    }

    let svgNode = iconNode.cloneNode(true);
    if (svgDefsLocal) svgNode.appendChild(svgDefsLocal.cloneNode(true));

    try {
        let iconStyleValue = window.getComputedStyle(iconNode);
        svgNode.style.setProperty("--icon-color", iconStyleValue.getPropertyValue("--icon-color").trim());
        svgNode.style.setProperty("--icon-color-rgb", iconStyleValue.getPropertyValue("--icon-color-rgb").trim());
        svgNode.style.setProperty("--icon-opacity", iconStyleValue.getPropertyValue("--icon-opacity").trim());
        svgNode.style.setProperty("--icondual1-opacity", iconStyleValue.getPropertyValue("--icondual1-opacity").trim());
        svgNode.style.setProperty("--icondual1-color-rgb", iconStyleValue.getPropertyValue("--icondual1-color-rgb").trim());
        svgNode.style.setProperty("--iconsec-color-rgb", iconStyleValue.getPropertyValue("--iconsec-color-rgb").trim());
    } catch (error) {}

    let arrSVGNodes = iconNode.querySelectorAll("circle,ellipse,line,path,polygon,polyline,rect,stop,text,div");
    let arrCloneSVGNodes = svgNode.querySelectorAll("circle,ellipse,line,path,polygon,polyline,rect,stop,text,div");

    let arrPointNodes = iconNode.querySelectorAll("[id*='-point']");
    let arrClonePointNodes = svgNode.querySelectorAll("[id*='-point']");

    for (let a = 0; a < arrClonePointNodes.length; a++) {
        let styleNode = window.getComputedStyle(arrPointNodes[a]);
        if (styleNode["filter"] != "" && styleNode["filter"] != "none" && styleNode["filter"] != "unset") {
            arrClonePointNodes[a].setAttribute("filter", styleNode["filter"]);
            arrClonePointNodes[a].style.filter = styleNode["filter"];
        }
    }

    if (arrSVGNodes.length > 0) {
        for (let i = 0; i < arrSVGNodes.length; i++) {
            let style = window.getComputedStyle(arrSVGNodes[i]);
            let isElemenetNotVisible = style["display"] == "none" || arrSVGNodes[i].style.display == "none" || style.visibility == "hidden";
            if (arrSVGNodes[i].tagName == "DIV") {
                // Apply all styles at once using Object.assign
                Object.assign(arrCloneSVGNodes[i].style, {
                    color: style.color,
                    backgroundColor: style.backgroundColor,
                    fontSize: style.fontSize,
                    fontFamily: style.fontFamily,
                    fontWeight: style.fontWeight,
                    fontStyle: style.fontStyle,
                    textAlign: style.textAlign,
                    textDecoration: style.textDecoration,
                    textTransform: style.textTransform,
                    lineHeight: style.lineHeight,
                    letterSpacing: style.letterSpacing,
                    padding: style.padding,
                    margin: style.margin,
                    border: style.border,
                    borderRadius: style.borderRadius,
                    boxShadow: style.boxShadow,
                    textShadow: style.textShadow,
                    textOverflow: style.textOverflow,
                    overflow: style.overflow,
                    opacity: style.opacity,
                    display: style.display,
                    justifyContent: style.justifyContent,
                    alignItems: style.alignItems,
                });
            } else {
                if (style.visibility == "hidden") arrCloneSVGNodes[i].style.visibility = "hidden";
                if (arrSVGNodes[i].parentElement.tagName != "symbol") {
                    arrCloneSVGNodes[i].setAttribute("fill", isElemenetNotVisible ? "none" : style["fill"]);
                    arrCloneSVGNodes[i].style.setProperty("fill", isElemenetNotVisible ? "none" : style["fill"]);
                    if (style["opacity"] != 1 && style["opacity"] != "1") arrCloneSVGNodes[i].style.setProperty("opacity", style["opacity"]);
                    arrCloneSVGNodes[i].setAttribute("stroke", isElemenetNotVisible ? "none" : style["stroke"]);
                    if (arrCloneSVGNodes[i].hasAttribute("fill") && arrCloneSVGNodes[i].getAttribute("fill") != "none" && !isElemenetNotVisible) arrCloneSVGNodes[i].style.fill = style["fill"];
                    if (arrCloneSVGNodes[i].hasAttribute("stroke") && arrCloneSVGNodes[i].getAttribute("stroke") != "none" && !isElemenetNotVisible) arrCloneSVGNodes[i].style.stroke = style["stroke"];
                    if (style["filter"] != "" && style["filter"] != "none" && style["filter"] != "unset") {
                        arrCloneSVGNodes[i].setAttribute("filter", style["filter"]);
                        arrCloneSVGNodes[i].style.filter = style["filter"];
                    }
                    arrCloneSVGNodes[i].setAttribute("fill-opacity", style["fill-opacity"]);
                    arrCloneSVGNodes[i].setAttribute("opacity", isElemenetNotVisible ? 0 : style["opacity"]);
                    arrCloneSVGNodes[i].setAttribute("stroke-opacity", isElemenetNotVisible ? 0 : style["stroke-opacity"]);
                    if (!isElemenetNotVisible) {
                        arrCloneSVGNodes[i].setAttribute("r", style["r"]);
                        arrCloneSVGNodes[i].style["r"] = style["r"];
                        arrCloneSVGNodes[i].setAttribute("stroke-width", style["stroke-width"]);
                        arrCloneSVGNodes[i].style["stroke-width"] = style["stroke-width"];
                        arrCloneSVGNodes[i].style["stop-color"] = style["stop-color"];
                        arrCloneSVGNodes[i].style["stop-opacity"] = style["stop-opacity"];
                    }
                }
            }
            if (arrSVGNodes[i].parentElement.tagName != "symbol") {
                arrCloneSVGNodes[i].setAttribute("width", isElemenetNotVisible ? 0 : style["width"]);
                arrCloneSVGNodes[i].setAttribute("height", isElemenetNotVisible ? 0 : style["height"]);
            } else {
                let pID = arrSVGNodes[i].parentElement.id.replace("-shape");
                let arrUseNode = parentNode.querySelectorAll("use[*|href='#" + pID + "']");
                if (arrUseNode && !isElemenetNotVisible) {
                    for (let a = 0; a < arrUseNode.length; a++) {
                        let useNode = arrUseNode[a];
                        let useStyle = window.getComputedStyle(useNode);
                        // Asset-bar symbol shapes (e.g. arrow / `bararrow` 9-slice) bake the theme
                        // color straight into the paint attribute as a CSS var —
                        // `fill="rgba(var(--th-section-primary),1)"`. The browser resolves the var
                        // via the `th-section{N}` cascade, but the rasterizer can't resolve it in
                        // the captured/re-parented SVG, so it renders BLACK. `getComputedStyle` on a
                        // non-rendered <symbol> shape can't resolve the var either — but the <use>
                        // (which IS rendered) inherits the th-section* custom properties, so resolve
                        // against it. Also handles currentColor/inherit. The custom property holds
                        // an rgb triplet (e.g. "124, 58, 237"), so var(...) expands inline.
                        let resolvePaint = (val) => {
                            if (!val) return val;
                            let out = String(val);
                            if (out.indexOf("var(") !== -1) {
                                out = out.replace(/var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^()]*))?\)/g, (m, name, fb) => {
                                    let v = useStyle.getPropertyValue(name);
                                    if (v && v.trim()) return v.trim();
                                    return fb != null ? fb.trim() : m;
                                });
                            }
                            if (/^(currentcolor|inherit)$/i.test(out.trim())) {
                                let c = useStyle["color"];
                                if (c && c.trim()) out = c.trim();
                            }
                            return out;
                        };
                        let curFill = arrCloneSVGNodes[i].getAttribute("fill");
                        let curStroke = arrCloneSVGNodes[i].getAttribute("stroke");
                        // Empty/missing paint → inherit the <use>'s resolved paint (legacy behavior).
                        // Non-empty paint that carries a var()/currentColor → resolve it in place.
                        let newFill = !curFill || curFill === "" ? resolvePaint(useStyle["fill"]) : resolvePaint(curFill);
                        let newStroke = !curStroke || curStroke === "" ? resolvePaint(useStyle["stroke"]) : resolvePaint(curStroke);
                        if (newFill && newFill !== curFill) {
                            arrCloneSVGNodes[i].setAttribute("fill", newFill);
                            arrCloneSVGNodes[i].style.setProperty("fill", newFill);
                        }
                        if (newStroke && newStroke !== "none" && newStroke !== curStroke) {
                            arrCloneSVGNodes[i].setAttribute("stroke", newStroke);
                            arrCloneSVGNodes[i].style.setProperty("stroke", newStroke);
                        }
                    }
                }
            }
            if (arrSVGNodes[i].parentElement.tagName != "symbol") {
                if (style["stroke-dasharray"]) arrCloneSVGNodes[i].setAttribute("stroke-dasharray", style["stroke-dasharray"]);
                arrCloneSVGNodes[i].setAttribute("stroke-width", isElemenetNotVisible ? 0 : style["stroke-width"]);
                if (style["stroke-linejoin"]) arrCloneSVGNodes[i].setAttribute("stroke-linejoin", style["stroke-linejoin"]);
                if (style["stroke-linecap"]) arrCloneSVGNodes[i].setAttribute("stroke-linecap", style["stroke-linecap"]);
                if (style["stop-color"]) arrCloneSVGNodes[i].setAttribute("stop-color", style["stop-color"]);
                if (style["transform"] && style["transform"] != "none") arrCloneSVGNodes[i].setAttribute("transform", style["transform"]);
                let maskImg = style["mask-image"] || style["-webkit-mask-image"];
                if (maskImg && maskImg !== "none" && !isElemenetNotVisible) {
                    arrCloneSVGNodes[i].style["mask-image"] = maskImg;
                    arrCloneSVGNodes[i].style["-webkit-mask-image"] = maskImg;
                    if (style["mask-repeat"] && style["mask-repeat"] !== "repeat") arrCloneSVGNodes[i].style["mask-repeat"] = style["mask-repeat"];
                    if (style["mask-size"] && style["mask-size"] !== "auto") arrCloneSVGNodes[i].style["mask-size"] = style["mask-size"];
                    if (style["mask-position"] && style["mask-position"] !== "0% 0%") arrCloneSVGNodes[i].style["mask-position"] = style["mask-position"];
                }
                // Circular-bar segments draw-on via a `pathLength=100` + `strokeDasharray=100`
                // keyframe (armed by the `.ci-circularbars-animate` wrapper). A static export
                // must show the FINAL, fully-drawn arc, but the SVG rasterizer (librsvg) doesn't
                // honor `pathLength`, so the copied `strokeDasharray="100"` is read in user units
                // and the long arc renders as broken dashes — the colored bar looks under-drawn
                // and the grey track shows through. Force these segments solid for export.
                if (arrCloneSVGNodes[i].classList && arrCloneSVGNodes[i].classList.contains("ci-circularbars-bar")) {
                    arrCloneSVGNodes[i].setAttribute("stroke-dasharray", "none");
                    arrCloneSVGNodes[i].removeAttribute("stroke-dashoffset");
                    arrCloneSVGNodes[i].removeAttribute("pathLength");
                    arrCloneSVGNodes[i].style.removeProperty("stroke-dasharray");
                    arrCloneSVGNodes[i].style.removeProperty("stroke-dashoffset");
                }
            }
        }
    }

    let finalArray = svgNode.querySelectorAll("[*|href*='#'],[*|href*='assets/'],[marker-start*='url'],[marker-end*='url'],[stroke*='url']");
    for (let a = 0; a < finalArray.length; a++) {
        for (let b = 0; b < 4; b++) {
            let attri = b == 0 ? "xlink:href" : b == 1 ? "marker-start" : b == 3 ? "stroke" : "marker-end";
            if (finalArray[a].hasAttribute(attri)) {
                let hrefId = finalArray[a].getAttribute(attri).replace("url(#", "").replace('url("#', "").replace('")', "").replace(")", "").replace("#", "");
                let hrefNode = svgNode.querySelector("[id='" + hrefId + "']");
                if (!hrefNode && document.getElementById(hrefId)) {
                    let cloningNode = document.getElementById(hrefId);
                    let clonnedNode = cloningNode.cloneNode(true);

                    let isUseNode = finalArray[a].tagName.toLowerCase() == "use";
                    let useStyle = window.getComputedStyle(isUseNode ? finalArray[a] : cloningNode);
                    if (isUseNode) {
                        let clonnedNodeIconsecNode = clonnedNode.querySelector("[class*='iconsec']");
                        if (clonnedNodeIconsecNode) {
                            clonnedNodeIconsecNode.style.fill = "rgba(var(--iconsec-color-rgb),1)";
                            clonnedNodeIconsecNode.style.stroke = "rgba(var(--iconsec-color-rgb),1)";
                        }
                        // let hRef = finalArray[a].getAttribute("xlink:href");
                        // let foundedNode = parentNode.querySelector("[*|href*='" + hRef + "']");
                        // if (foundedNode) {
                        //     let foundedNodeStyle = window.getComputedStyle(foundedNode);
                        //     clonnedNode.setAttribute("fill", foundedNodeStyle.fill);
                        //     clonnedNode.setAttribute("stroke", foundedNodeStyle.stroke);
                        // }
                    } else {
                        if (useStyle["fill"] != "rgb(0, 0, 0)") clonnedNode.setAttribute("fill", useStyle["fill"]);
                        if (useStyle["stroke"] != "rgb(0, 0, 0)") clonnedNode.setAttribute("stroke", useStyle["stroke"]);

                        let arrSVGNodes = cloningNode.querySelectorAll("circle,ellipse,line,path,polygon,polyline,rect,stop,text");
                        let arrCloneSVGNodes = clonnedNode.querySelectorAll("circle,ellipse,line,path,polygon,polyline,rect,stop,text");
                        if (arrSVGNodes.length > 0) {
                            for (let i = 0; i < arrSVGNodes.length; i++) {
                                let style = window.getComputedStyle(arrSVGNodes[i]);
                                let isElemenetNotVisible = style["display"] == "none" || arrSVGNodes[i].style.display == "none" || style.visibility == "hidden";
                                if (style.visibility == "hidden") arrCloneSVGNodes[i].style.visibility = "hidden";
                                if (arrSVGNodes[i].parentElement.tagName != "symbol") {
                                    arrCloneSVGNodes[i].setAttribute("fill", isElemenetNotVisible ? "none" : style["fill"]);
                                    arrCloneSVGNodes[i].setAttribute("stroke", isElemenetNotVisible ? "none" : style["stroke"]);
                                    if (arrCloneSVGNodes[i].hasAttribute("fill") && arrCloneSVGNodes[i].getAttribute("fill") != "none" && !isElemenetNotVisible) arrCloneSVGNodes[i].style.fill = style["fill"];
                                    if (arrCloneSVGNodes[i].hasAttribute("stroke") && arrCloneSVGNodes[i].getAttribute("stroke") != "none" && !isElemenetNotVisible) arrCloneSVGNodes[i].style.stroke = style["stroke"];
                                    if (style["filter"] != "" && style["filter"] != "none" && style["filter"] != "unset") {
                                        arrCloneSVGNodes[i].setAttribute("filter", style["filter"]);
                                        arrCloneSVGNodes[i].style.filter = style["filter"];
                                    }
                                    arrCloneSVGNodes[i].setAttribute("fill-opacity", style["fill-opacity"]);
                                    arrCloneSVGNodes[i].setAttribute("opacity", isElemenetNotVisible ? 0 : style["opacity"]);
                                    arrCloneSVGNodes[i].setAttribute("stroke-opacity", isElemenetNotVisible ? 0 : style["stroke-opacity"]);
                                    if (!isElemenetNotVisible) {
                                        arrCloneSVGNodes[i].setAttribute("r", style["r"]);
                                        arrCloneSVGNodes[i].style["r"] = style["r"];
                                        arrCloneSVGNodes[i].setAttribute("stroke-width", style["stroke-width"]);
                                        arrCloneSVGNodes[i].style["stroke-width"] = style["stroke-width"];
                                        arrCloneSVGNodes[i].style["stop-color"] = style["stop-color"];
                                        arrCloneSVGNodes[i].style["stop-opacity"] = style["stop-opacity"];
                                    }
                                }
                                if (arrSVGNodes[i].parentElement.tagName != "symbol") {
                                    arrCloneSVGNodes[i].setAttribute("width", isElemenetNotVisible ? 0 : style["width"]);
                                    arrCloneSVGNodes[i].setAttribute("height", isElemenetNotVisible ? 0 : style["height"]);
                                } else {
                                    let pID = arrSVGNodes[i].parentElement.id.replace("-shape");
                                    let arrUseNode = parentNode.querySelectorAll("use[*|href='#" + pID + "']");
                                    if (arrUseNode && !isElemenetNotVisible) {
                                        for (let a = 0; a < arrUseNode.length; a++) {
                                            let useNode = arrUseNode[a];
                                            let useStyle = window.getComputedStyle(useNode);
                                            let hasFill = arrCloneSVGNodes[i].hasAttribute("fill");
                                            let hasStroke = arrCloneSVGNodes[i].hasAttribute("stroke");
                                            if (!hasFill || (hasFill && arrCloneSVGNodes[i].getAttribute("fill") == "")) arrCloneSVGNodes[i].setAttribute("fill", useStyle["fill"]);
                                            if (!hasStroke || (hasStroke && arrCloneSVGNodes[i].getAttribute("stroke") == "")) arrCloneSVGNodes[i].setAttribute("stroke", useStyle["stroke"]);
                                        }
                                    }
                                }
                                if (arrSVGNodes[i].parentElement.tagName != "symbol") {
                                    if (style["stroke-dasharray"]) arrCloneSVGNodes[i].setAttribute("stroke-dasharray", style["stroke-dasharray"]);
                                    arrCloneSVGNodes[i].setAttribute("stroke-width", isElemenetNotVisible ? 0 : style["stroke-width"]);
                                    if (style["stroke-linejoin"]) arrCloneSVGNodes[i].setAttribute("stroke-linejoin", style["stroke-linejoin"]);
                                    if (style["stroke-linecap"]) arrCloneSVGNodes[i].setAttribute("stroke-linecap", style["stroke-linecap"]);
                                    if (style["stop-color"]) arrCloneSVGNodes[i].setAttribute("stop-color", style["stop-color"]);
                                    if (style["transform"] && style["transform"] != "none") arrCloneSVGNodes[i].setAttribute("transform", style["transform"]);
                                }
                            }
                        }
                    }

                    // for (let c = 0; c < cloningNode.children.length; c++) {
                    //     useStyle = window.getComputedStyle(cloningNode.children[c]);
                    //     let fillValue = useStyle["fill"];
                    //     let strokeValue = useStyle["stroke"];
                    //     if (fillValue == "none" && finalArray[a].style.fill != "none") fillValue = finalArray[a].style.fill;
                    //     if (strokeValue == "none" && finalArray[a].style.stroke != "none") strokeValue = finalArray[a].style.stroke;
                    //     if (fillValue != "rgb(0, 0, 0)") clonnedNode.children[c].setAttribute("fill", fillValue);
                    //     if (strokeValue != "rgb(0, 0, 0)" && strokeValue != "none" && fillValue == "none") clonnedNode.children[c].setAttribute("stroke", strokeValue);
                    // }
                    if (svgNode.getElementsByTagName("defs").length == 0) svgNode.appendChild(document.createElement("defs"));
                    svgNode.getElementsByTagName("defs")[0].appendChild(clonnedNode);
                }
            }
        }
    }

    let arrImageNodesG = iconNode.querySelectorAll("image");
    let arrCloneImageNodesG = svgNode.querySelectorAll("image");
    if (staticServerURL && arrImageNodesG.length > 0) {
        for (let i = 0; i < arrImageNodesG.length; i++) {
            if (arrImageNodesG[i].hasAttribute("xlink:href") && !arrImageNodesG[i].getAttribute("xlink:href").includes(staticServerURL) && !arrImageNodesG[i].getAttribute("xlink:href").startsWith("http")) arrCloneImageNodesG[i].setAttribute("xlink:href", staticServerURL + arrImageNodesG[i].getAttribute("xlink:href"));
        }
    }

    let coords = ExportUtils.getCoordsXY(parentNode, parentID, iconNode);
    try {
        if (iconNode.parentElement?.parentElement?.getAttribute("data-elementtype") == "origami") {
            coords.width = iconNode.parentElement.offsetWidth;
            coords.height = iconNode.parentElement.offsetHeight;
        } else {
            coords.width = iconNode.width?.baseVal?.value || 0;
            coords.height = iconNode.height?.baseVal?.value || 0;
        }
    } catch (error) {
        coords.width = 0;
        coords.height = 0;
    }

    let bbox = null;
    try {
        if (iconNode?.parentElement?.id?.includes("nodeBackgound") && iconNode?.dataset?.id?.includes("bgsvgNode")) {
            bbox = iconNode.getBBox();
        }
    } catch (error) {}

    if (bbox?.width && bbox?.height) {
        coords.width = bbox.width;
        coords.height = bbox.height;
    }

    // Percentage SVG dim fallback. Chart asset bars (.ci-asset-bar-svg,
    // .ci-shape-position-bar-svg, .ci-building-position-bar-svg) keep
    // their `width` / `height` attributes as "100%" so the inner SVG
    // stretches to the bar div. The corresponding `baseVal.value` then
    // depends on whether the SVG has an active viewport context — during
    // the offline export pass it often resolves to 0 or a viewBox-derived
    // fallback, which shrinks the picture frame and makes the asset render
    // tiny in PowerPoint (column balloons/buildings → pinhead size; arrow
    // bars → mis-stretched centerUse → broken arrowhead). Substitute the
    // element's live bounding rect whenever the attribute is a percentage —
    // that always reflects the actual rendered pixel size.
    try {
        if (iconNode?.tagName?.toLowerCase() === "svg") {
            const PCT = 2; // SVGLength.SVG_LENGTHTYPE_PERCENTAGE
            let rect = iconNode.getBoundingClientRect?.();
            if (rect) {
                if (iconNode.width?.baseVal?.unitType === PCT && rect.width > 0) coords.width = rect.width;
                if (iconNode.height?.baseVal?.unitType === PCT && rect.height > 0) coords.height = rect.height;
            }
        }
    } catch (error) {}

    try {
        let f = navigator.userAgent.search("Firefox");
        if (f > -1) {
            let iconStyle = window.getComputedStyle(iconNode);
            let iconW = parseFloat(iconStyle.width);
            let iconH = parseFloat(iconStyle.height);
            coords.width = !isNaN(iconW) && iconW > 0 ? iconW : iconNode.parentElement.offsetWidth;
            coords.height = !isNaN(iconH) && iconH > 0 ? iconH : iconNode.parentElement.offsetHeight;
        }
    } catch (error) {}

    svgNode.style.width = coords.width + "px";
    svgNode.style.height = coords.height + "px";

    // Replace any `width="100%"` / `height="100%"` SVG attributes with the
    // resolved pixel values. pptx-service rasterizes the serialized SVG to
    // a PNG and reads the root SVG's `width`/`height` ATTRIBUTES (not the
    // inline style above) to size its canvas. A "100%" attribute outside a
    // browser layout context resolves to the viewBox default — tiny canvas,
    // tiny output. Asset bars (.ci-asset-bar-svg, .ci-shape-position-bar-svg,
    // .ci-building-position-bar-svg) all set "100%" on width and/or height,
    // which makes balloons/buildings/arrows shrink to icon size in the
    // exported PPT. Setting the explicit px values here makes the
    // rasterizer's canvas match the picture frame exactly.
    try {
        if (svgNode?.tagName?.toLowerCase() === "svg") {
            if (coords.width > 0) svgNode.setAttribute("width", String(coords.width));
            if (coords.height > 0) svgNode.setAttribute("height", String(coords.height));

            // Strip `overflow: visible` from the root SVG. pptx-service's
            // `expandOverflowVisibleSvg` triggers on this hint and tries to
            // grow the viewBox to cover any path coords found outside the
            // declared box. Its parser walks `d="…"` strings as alternating
            // x/y numbers — but SVG path commands like `A` (arc: rx, ry,
            // x-axis-rotation, large-arc, sweep, dx, dy) have non-coordinate
            // numbers that get misread, producing wildly inflated bounds.
            // For the building/balloon assets that mis-expansion blows the
            // picture frame up 5× and the actual content appears tiny inside
            // it. The editor uses overflow:visible only for runtime layout —
            // for the standalone SVG export the viewBox already encloses
            // the drawn content, so removing the hint is safe.
            svgNode.removeAttribute("overflow");
            if (svgNode.style) svgNode.style.overflow = "";
        }
    } catch (error) {}

    svgNode.removeAttribute("data-node-graphic-text");
    const elements = svgNode.querySelectorAll("[data-node-graphic-text]");
    elements.forEach((element) => {
        element.removeAttribute("data-node-graphic-text");
    });

    // For TRL mood svg flip
    if (svgNode.querySelectorAll("[data-pptxnonsupport]").length > 0) {
        let node = svgNode.querySelectorAll("[data-pptxnonsupport]");
        for (let i = 0; i < node.length; i++) {
            if (node[i].getAttribute("data-pptxnonsupport") == "scaleX") {
                node[i].setAttribute("transform", "scale(-1, 1)");
                node[i].style.transformOrigin = "center";
                to = "center";
            }
            if (node[i].getAttribute("data-pptxnonsupport") == "scaleY") {
                node[i].setAttribute("transform", "scale(1, -1)");
                node[i].style.transformOrigin = "center";
                to = "center";
            }
        }
    }
    // Resolve CSS var() references in fill/stroke/stop-color attributes before
    // serialization. SVG assets like .ci-asset-bar-svg keep their fills as
    // `rgba(var(--th-section-primary),1)` — these render correctly in the
    // editor (the theme cascade defines the var on a host container) but the
    // standalone SVG sent to the export pipeline has no theme context, so the
    // var falls back to black. Substitute the resolved value here using the
    // original iconNode's computed style (which still has cascade access).
    try {
        let iconStyleForVar = window.getComputedStyle(iconNode);
        let resolveVar = (str) =>
            str.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (m, name, fallback) => {
                let val = iconStyleForVar.getPropertyValue(name);
                if (val && val.trim()) return val.trim();
                return fallback ? fallback.trim() : m;
            });
        let varAttrNodes = svgNode.querySelectorAll("*");
        for (let v = 0; v < varAttrNodes.length; v++) {
            let n = varAttrNodes[v];
            if (!n.getAttribute) continue;
            ["fill", "stroke", "stop-color"].forEach((attr) => {
                let av = n.getAttribute(attr);
                if (av && av.indexOf("var(") !== -1) n.setAttribute(attr, resolveVar(av));
            });
        }
    } catch (err) {
        console.log("SG - SVG var() resolution failed", err);
    }

    // Duotone/tritone icon paths are painted by page CSS classes (common-template-styles.css
    // .icon* rules), e.g. .iconfillbg { fill: rgba(var(--th-slide-primary),1) } — the theme
    // "knockout" layer. That stylesheet never travels with the serialized SVG, so the export
    // rasterizer lets classed paths inherit the <use> fill, and knockout triangles render
    // icon-colored (dark diagonal split) instead of slide-background-colored.
    // Resolve each class GENERICALLY with probe elements: mount a <path> carrying the class
    // inside the LIVE icon svg (same theme cascade, so --th-* vars and mood-scoped selectors
    // apply; the live <use>'s inline --icon*-color-rgb props are copied onto the probe since
    // the class rules reference them). Whatever paint properties the class changes relative
    // to a class-less base probe get inlined as concrete attributes on the cloned nodes.
    // CSS stays the single source of truth — new/edited .icon* rules are picked up
    // automatically, with var()s resolved exactly as the browser resolves them.
    try {
        const ICON_PAINT_PROPS = ["fill", "stroke", "fill-opacity", "stroke-opacity", "stroke-width"];
        let classedIconNodes = svgNode.querySelectorAll("[class*='iconfill'],[class*='iconstroke'],[class*='iconsec'],[class*='iconter'],[class*='iconquad']");
        if (classedIconNodes.length > 0) {
            let liveUseForIconVars = iconNode.querySelector("use");
            let classPaintCache = {};
            let resolveClassPaints = (clsAttr) => {
                if (classPaintCache[clsAttr] !== undefined) return classPaintCache[clsAttr];
                let probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
                let baseProbe = document.createElementNS("http://www.w3.org/2000/svg", "path");
                probe.setAttribute("class", clsAttr);
                if (liveUseForIconVars && liveUseForIconVars.style) {
                    for (let s = 0; s < liveUseForIconVars.style.length; s++) {
                        let prop = liveUseForIconVars.style[s];
                        if (prop && prop.indexOf("--") === 0) {
                            let pv = liveUseForIconVars.style.getPropertyValue(prop);
                            probe.style.setProperty(prop, pv);
                            baseProbe.style.setProperty(prop, pv);
                        }
                    }
                }
                let paints = null;
                iconNode.appendChild(baseProbe);
                iconNode.appendChild(probe);
                try {
                    let cs = window.getComputedStyle(probe);
                    let csBase = window.getComputedStyle(baseProbe);
                    paints = {};
                    for (let p = 0; p < ICON_PAINT_PROPS.length; p++) {
                        let v = cs.getPropertyValue(ICON_PAINT_PROPS[p]);
                        if (v && v !== csBase.getPropertyValue(ICON_PAINT_PROPS[p])) paints[ICON_PAINT_PROPS[p]] = v;
                    }
                } finally {
                    iconNode.removeChild(probe);
                    iconNode.removeChild(baseProbe);
                }
                classPaintCache[clsAttr] = paints;
                return paints;
            };
            for (let c = 0; c < classedIconNodes.length; c++) {
                let node = classedIconNodes[c];
                let paints = resolveClassPaints(node.getAttribute("class") || "");
                if (!paints) continue;
                for (let prop in paints) {
                    // Class rules outrank presentation attributes in the editor — mirror that
                    // by overriding the attribute. Inline styles outrank the class, so leave
                    // those, EXCEPT legacy unresolved var() styles the rasterizer can't read.
                    let inlinePaint = node.style ? node.style.getPropertyValue(prop) : "";
                    if (inlinePaint && inlinePaint.indexOf("var(") === -1) continue;
                    if (inlinePaint) node.style.removeProperty(prop);
                    node.setAttribute(prop, paints[prop]);
                }
            }
        }
        // Strip any remaining fill/stroke INLINE STYLES that still reference var() — the
        // rasterizer (librsvg) can't resolve them and may paint black. These styles only
        // exist on the detached export clone, so removing them changes nothing in the editor.
        let varStyleNodes = svgNode.querySelectorAll("*");
        for (let v = 0; v < varStyleNodes.length; v++) {
            let st = varStyleNodes[v].style;
            if (!st) continue;
            ["fill", "stroke"].forEach((p) => {
                let sv = st.getPropertyValue(p);
                if (sv && sv.indexOf("var(") !== -1) st.removeProperty(p);
            });
        }
    } catch (err) {
        console.log("SG - icon class paint inlining failed", err);
    }

    let xmlData = new XMLSerializer().serializeToString(svgNode);

    if (coords.width == 0 && parentNode && iconNode.width?.baseVal?.valueAsString?.includes("%")) coords.width = parentNode.offsetWidth;
    if (coords.height == 0 && parentNode && iconNode.height?.baseVal?.valueAsString?.includes("%")) coords.height = parentNode.offsetHeight;

    if (coords.x >= this.slideWidth) coords.width = 0;
    if (coords.y >= this.slideHeight) coords.height = 0;
    objData.coords = [coords.x, coords.y, coords.width, coords.height].toString().replace(/,/g, " ");
    try {
        objData.svg = window.btoa(xmlData);
    } catch (error) {
        console.log("SG - IMPORTANT - XML parse error while Export", error);
        return null;
    }

    let parentNodeStyle = window.getComputedStyle(parentNode);
    let iconStyle = window.getComputedStyle(iconNode);
    ExportUtils.updateMiniStyleData(objData, parentNodeStyle, false, iconStyle, null, "inner-style");
    objData["inner-style"]["width"] = coords.width + "px";
    objData["inner-style"]["height"] = coords.height + "px";

    if (iconNode.style.transform == "scaleX(-1)" && (objData["inner-style"].transform == "scaleX(-1)" || objData["inner-style"].transform == "matrix(-1, 0, 0, 1, 0, 0)")) {
        objData["inner-style"]["transform"] = "unset";
    }

    delete objData["inner-style"]["-webkit-mask-image"];
    delete objData["inner-style"]["-webkit-mask-position"];
    delete objData["inner-style"]["-webkit-mask-repeat"];
    delete objData["inner-style"]["-webkit-mask-size"];

    let centerSymbol = iconNode?.querySelector("[data-name='center']");
    if (centerSymbol) objData.nineScale = "true";

    objData["buffer-style"] = {
        width: coords.width + "px",
        height: coords.height + "px",
        position: "absolute",
        overflow: "hidden",
    };

    let type = "buffer-style";
    if (!objData[type].transform || !objData[type].transform == "" || !objData[type].transform == "none" || !objData[type].transform == "unset" || !objData[type].transform == "scale(1)") {
        let parentNodeStyle = window.getComputedStyle(parentNode);
        let isShapePoint = parentNode.parentElement.getAttribute("data-id") == "shapepoint";
        if ((!parentNodeStyle.transform || parentNodeStyle.transform == "" || parentNodeStyle.transform == "none" || parentNodeStyle.transform == "unset" || parentNodeStyle.transform == "scale(1)" || parentNodeStyle.transform == "matrix(1, 0, 0, 1, 0, 0)") && parentNode.parentElement && !isShapePoint)
            parentNodeStyle = window.getComputedStyle(parentNode.parentElement);
        let matrixValue = this.updateTransformData(parentNodeStyle);
        if (matrixValue) {
            objData[type].transform = matrixValue;
            let halfValX = parseFloat(objData["buffer-style"].width) / 2;
            let halfValY = parseFloat(objData["buffer-style"].height) / 2;
            let isCenterX = parentNodeStyle.transformOrigin.split(" ").includes(halfValX + "px");
            let isCenterY = parentNodeStyle.transformOrigin.split(" ").includes(halfValY + "px");
            let isScaled = false;
            const regex = /scaleX\(([^)]+)\) scaleY\(([^)]+)\)/;
            const matches = objData["buffer-style"].transform?.includes("scaleX") ? objData["buffer-style"].transform.match(regex) : objData["inner-style"].transform?.includes("scaleX") ? objData["inner-style"].transform?.match(regex) : null;
            let bufferStyleTransform = objData["buffer-style"]?.transform;
            if (bufferStyleTransform?.includes("matrix")) {
                try {
                    let scaleX = parseFloat(bufferStyleTransform.split(",")[0].split("(")[1]);
                    let scaleY = parseFloat(bufferStyleTransform.split(",")[3].split(")")[0]);
                    isScaled = scaleX.toFixed(2) != 1.0 && scaleY.toFixed(2) != 1.0;
                    matches = null;
                } catch (error) {}
            }
            if (matches) {
                const scaleXValue = parseFloat(matches[1]);
                const scaleYValue = parseFloat(matches[2]);
                isScaled = scaleYValue.toFixed(2) != 1.0 && scaleXValue.toFixed(2) != 1.0;
                let arrCoords = objData.coords.split(" ");
                if (scaleXValue != 1 && scaleXValue > 0) {
                    arrCoords[2] = parseFloat(arrCoords[2]) * scaleXValue;
                    // objData.coords = arrCoords.join(" ");
                    // objData["buffer-style"]["width"] = arrCoords[2] + "px";
                }
                if (scaleYValue != 1 && scaleYValue > 0) {
                    arrCoords[3] = parseFloat(arrCoords[3]) * scaleYValue;
                    // objData.coords = arrCoords.join(" ");
                    // objData["buffer-style"]["height"] = arrCoords[3] + "px";
                }
            }
            if (!isScaled && (isCenterX || isCenterY)) objData[type]["transform-origin"] = "center";
            else objData[type]["transform-origin"] = "left top";
            // } else {
            //     const regex = /scaleX\(([^)]+)\) scaleY\(([^)]+)\)/;
            //     const matches = objData["inner-style"]?.transform?.includes("scaleX") ? objData["inner-style"].transform.match(regex) : null;
            //     if (matches) {
            //         const scaleXValue = parseFloat(matches[1]);
            //         const scaleYValue = parseFloat(matches[2]);
            //         let arrCoords = objData.coords.split(" ");
            //         if (scaleXValue != 1 && scaleXValue > 0) {
            //             arrCoords[2] = parseFloat(arrCoords[2]) * scaleXValue;
            //             objData.coords = arrCoords.join(" ");
            //             objData["buffer-style"]["width"] = arrCoords[2] + "px";
            //             objData["inner-style"]["width"] = arrCoords[2] + "px";
            //             delete objData["inner-style"].transform;
            //         }
            //         if (scaleYValue != 1 && scaleYValue > 0) {
            //             arrCoords[3] = parseFloat(arrCoords[3]) * scaleYValue;
            //             objData.coords = arrCoords.join(" ");
            //             objData["buffer-style"]["height"] = arrCoords[3] + "px";
            //             objData["inner-style"]["height"] = arrCoords[3] + "px";
            //             delete objData["inner-style"].transform;
            //         }
            //     }
        }
    }
    if (objData["buffer-style"]["transform"] == objData["inner-style"]["transform"]) delete objData["buffer-style"]["transform"];

    if (mainSVG) {
        let svgIconStyle = window.getComputedStyle(mainSVG);
        if (svgIconStyle["filter"] && svgIconStyle["filter"] != undefined) objData["inner-style"]["filter"] = svgIconStyle["filter"];
        if (objData["inner-style"]?.["filter"] == "none") delete objData["inner-style"]["filter"];
    }
    if (objData["inner-style"]?.["transform"] == "matrix(1, 0, 0, 0, 0, 0)") objData.coords = "0 0 0 0";
    let arrCoords = objData.coords.split(" ");
    if (parseFloat(arrCoords[0]) + parseFloat(arrCoords[2]) <= 0 || parseFloat(arrCoords[1]) + parseFloat(arrCoords[3]) <= 0 || parseFloat(arrCoords[0]) > this.slideWidth || parseFloat(arrCoords[1]) > this.slideHeight) return null;

    if (window.isOrigamiPPTX) {
        if (iconNode.parentElement?.getAttribute("type") == "lottie" && iconNode.parentElement?.hasAttribute("path")) {
            objData.type = "lottie";
            objData.path = iconNode.parentElement?.getAttribute("path");
            objData.bufferStyle = { transform: "scale(1) rotate(0deg)" };
        }
        if (iconNode.parentElement?.parentElement?.dataset?.sticker) objData.sticker = true;
    }

    return objData;
};

ExportUtils.setTransfromOriginForImage = function (objData) {
    try {
        let halfValX = parseFloat(objData["buffer-style"].width) / 2;
        let halfValY = parseFloat(objData["buffer-style"].height) / 2;
        let transOrigin = objData["inner-style"].transformOrigin || objData["inner-style"]["transform-origin"] || "left top";
        let isCenterX = transOrigin.split(" ").includes(halfValX + "px");
        let isCenterY = transOrigin.split(" ").includes(halfValY + "px");
        let isScaled = false;
        const regex = /scaleX\(([^)]+)\) scaleY\(([^)]+)\)/;
        const matches = objData["inner-style"]?.transform?.includes("scaleX") ? objData["inner-style"].transform.match(regex) : null;
        if (matches) {
            const scaleXValue = parseFloat(matches[1]);
            const scaleYValue = parseFloat(matches[2]);
            isScaled = scaleYValue.toFixed(2) != 1.0 && scaleXValue.toFixed(2) != 1.0;
        }
        if (!isScaled && (isCenterX || isCenterY)) objData["inner-style"]["transform-origin"] = "center";
        else if (objData["inner-style"]["transform-origin"]?.includes("px")) objData["inner-style"]["transform-origin"] = objData["inner-style"]["transform-origin"];
        else objData["inner-style"]["transform-origin"] = "left top";

        if (objData["inner-style"]["transform"] == "matrix(-1, 0, 0, 1, 0, 0)") objData["inner-style"]["transform-origin"] = "center";
    } catch (error) {}
};

ExportUtils.getIconWithUseData = function (iconNode, parentNode, parentID, name = "IMAGE", iconPadding) {
    let mainSVG = iconNode.cloneNode(true);
    let allUses = mainSVG.querySelectorAll("use");
    allUses.forEach((useNode) => {
        let usePath = useNode.getAttribute("xlink:href");
        if (usePath) {
            let useMainNode = document.getElementById(usePath.replace("#", "").cloneNode(true));
            console.log(useMainNode);
        } else {
            console.log(useNode);
        }
    });

    let objData = { type: "image", name: name };

    ExportUtils.applyIconColor(styleData, cloneUseNode, actualUseNode, useNode);
    let xmlData = new XMLSerializer().serializeToString(cloneUseNode);
    let coords = ExportUtils.getCoordsXY(iconNode.parentElement, parentID);
    coords.width = iconNode.width.baseVal.value;
    coords.height = iconNode.height.baseVal.value;
    coords.x = coords.x + (iconNode.parentElement.offsetWidth - iconNode.width.baseVal.value) / 2;
    coords.y = coords.y + (iconNode.parentElement.offsetHeight - iconNode.height.baseVal.value) / 2;
    objData.coords = [coords.x, coords.y, coords.width, coords.height].toString().replace(/,/g, " ");
    objData.svg = window.btoa(xmlData);
    ExportUtils.updateMiniStyleData(objData, styleData);
    return objData;
};

ExportUtils.applyIconColor = function (styleData, clonedUseNode, actualUseNode, useNode) {
    let arrIllus = clonedUseNode.querySelectorAll("[class='illustration1'],[class='illustration2'],[class='illustration3'],[class='illustration4']");
    if (arrIllus.length > 0) {
        let objColor = {};
        objColor.illustration1 = CommonDataUtils.hexToRGB(styleData.getPropertyValue("--item1-color").replace(/\s/g, "")) || { r: 255, g: 255, b: 255 };
        objColor.illustration2 = CommonDataUtils.hexToRGB(styleData.getPropertyValue("--secondary-color").replace(/\s/g, "")) || { r: 255, g: 255, b: 255 };
        objColor.illustration3 = CommonDataUtils.hexToRGB(styleData.getPropertyValue("--contrast-color").replace(/\s/g, "")) || { r: 255, g: 255, b: 255 };
        objColor.illustration4 = CommonDataUtils.hexToRGB(styleData.getPropertyValue("--bg-color").replace(/\s/g, "")) || { r: 255, g: 255, b: 255 };
        for (let i = 0; i < arrIllus.length; i++) {
            let className = arrIllus[i].getAttribute("class");
            let colorItems = objColor[className];
            let illusColor = "rgb(" + colorItems.r + "," + colorItems.g + "," + colorItems.b + ")";
            if (!!colorItems.a) {
                illusColor = "rgba(" + colorItems.r + "," + colorItems.g + "," + colorItems.b + "," + colorItems.a + ")";
            }
            arrIllus[i].setAttribute("fill", illusColor);
        }
    } else {
        let className = useNode.className.baseVal;

        let colorValue = CommonDataUtils.hexToRGB(styleData.getPropertyValue("--icon-color").replace(/\s/g, "")) || { r: 255, g: 255, b: 255 };
        let opacity = styleData.getPropertyValue("--icon-opacity").replace(/\s/g, "");
        let icon2Color = "rgb(" + colorValue.r + "," + colorValue.g + "," + colorValue.b + ")";
        if (opacity && opacity != "" && opacity != "0" && opacity != 0) {
            icon2Color = "rgba(" + colorValue.r + "," + colorValue.g + "," + colorValue.b + "," + opacity + ")";
        }

        let arrDefault = clonedUseNode.querySelectorAll("path,rect,circle,polygon");
        let defaultFill = styleData["fill"];
        for (let i = 0; i < arrDefault.length; i++) {
            let pathItem = arrDefault[i];
            let fillNone = pathItem.getAttribute("fill") == "none";
            let strokeNone = pathItem.getAttribute("stroke") == "none";
            if (fillNone && !strokeNone) {
                pathItem.setAttribute("stroke", defaultFill);
            } else if (!fillNone && strokeNone) {
                pathItem.setAttribute("fill", defaultFill);
            }
        }

        let icon1Color = styleData.getPropertyValue("fill");
        let arrIcon1Path = className.includes("accent") ? actualUseNode.querySelectorAll("[class='icon2']") : actualUseNode.querySelectorAll("[class='icon1']");
        let arrIcon2Path = className.includes("accent") ? actualUseNode.querySelectorAll("[class='icon1']") : actualUseNode.querySelectorAll("[class='icon2']");

        for (let i = 0; i < arrIcon1Path.length; i++) {
            let pathItem = arrIcon1Path[i];
            let fillNone = pathItem.getAttribute("fill") == "none";
            let strokeNone = pathItem.getAttribute("stroke") == "none";
            if (fillNone && !strokeNone) {
                pathItem.setAttribute("stroke", icon1Color);
            } else if (!fillNone && strokeNone) {
                pathItem.setAttribute("fill", icon1Color);
            }
        }

        for (let j = 0; j < arrIcon2Path.length; j++) {
            let pathItem = arrIcon2Path[j];
            let fillNone = pathItem.getAttribute("fill") == "none";
            let strokeNone = pathItem.getAttribute("stroke") == "none";
            if (fillNone && !strokeNone) {
                pathItem.setAttribute("stroke", icon2Color);
            } else if (!fillNone && strokeNone) {
                pathItem.setAttribute("fill", icon2Color);
            }
        }
    }
};

ExportUtils.getRectValue = function (contentNode, parentID, objName, arrElements, istextBg = false) {
    let styleData = contentNode ? window.getComputedStyle(contentNode) : null;
    if (!contentNode || styleData?.opacity == 0) return;
    let objData = { type: "drawing", name: objName || contentNode?.id || contentNode?.getAttribute("name") || "Rect", "drawing-type": "rect" };
    try {
        objData.coords = ExportUtils.getCoords(contentNode, parentID, false);
        objData.zindex = styleData.zIndex || 0;

        ExportUtils.updateBufferStyle(objData, styleData, contentNode, "inner-style");

        // update coords if border-width is present
        let bw = objData["inner-style"]?.["border-width"] || 0;
        bw = parseFloat(bw);
        if (!isNaN(bw) && bw > 0) {
            let arrCoords = objData.coords.split(" ");
            arrCoords[3] = parseFloat(arrCoords[3]) + bw;
            objData.coords = arrCoords.join(" ");
        }

        let parentNodeStyle = window.getComputedStyle(contentNode.parentElement);
        let matrix3D = styleData.transform?.includes("matrix3d") ? styleData.transform : parentNodeStyle.transform?.includes("matrix3d") ? parentNodeStyle.transform : null;
        // updating parent's mask image to inner style
        if (!objData["inner-style"]["-webkit-mask-image"]) {
            let maskValue = parentNodeStyle["-webkit-mask-image"];
            if (maskValue && maskValue != "none" && maskValue != "unset") {
                objData["inner-style"]["-webkit-mask-image"] = maskValue;
                objData["inner-style"]["-webkit-mask-size"] = parentNodeStyle["-webkit-mask-size"];
                objData["inner-style"]["-webkit-mask-repeat"] = parentNodeStyle["-webkit-mask-repeat"];
                objData["inner-style"]["-webkit-mask-position"] = parentNodeStyle["-webkit-mask-position"];
            }
        }
        // Border-radius from parent if not available in child
        if (!objData["inner-style"]["border-radius"]) {
            let borderRadius = parentNodeStyle["border-radius"];
            if (borderRadius && borderRadius != "none" && borderRadius != "unset") {
                objData["inner-style"]["border-radius"] = borderRadius;
            }
        }

        if (!objData["inner-style"]["-webkit-mask-image"]) {
            let maskValue = parentNodeStyle["-webkit-mask-image"];
            if (maskValue && maskValue != "none" && maskValue != "unset") {
                objData["inner-style"]["-webkit-mask-image"] = maskValue;
                objData["inner-style"]["-webkit-mask-size"] = parentNodeStyle["-webkit-mask-size"];
                objData["inner-style"]["-webkit-mask-repeat"] = parentNodeStyle["-webkit-mask-repeat"];
                objData["inner-style"]["-webkit-mask-position"] = parentNodeStyle["-webkit-mask-position"];
            }
        }

        objData["buffer-style"] = {
            width: "100%",
            height: "100%",
            position: "absolute",
            overflow: "hidden",
            left: "0px",
            top: "0px",
        };
        if (parentNodeStyle?.overflow == "visible") objData["buffer-style"]["overflow"] = parentNodeStyle.overflow;

        if (objData["inner-style"]["background-image"]?.includes("gradient")) {
            delete objData["inner-style"]["background"];
            if (window.isOrigamiPPTX) objData.colorlock = "true";
        }

        let type = "buffer-style";
        if (!objData[type].transform || !objData[type].transform == "" || !objData[type].transform == "none" || !objData[type].transform == "unset" || !objData[type].transform == "scale(1)") {
            if ((!parentNodeStyle.transform || parentNodeStyle.transform == "" || parentNodeStyle.transform == "none" || parentNodeStyle.transform == "unset" || parentNodeStyle.transform == "scale(1)" || parentNodeStyle.transform == "matrix(1, 0, 0, 1, 0, 0)") && contentNode.parentElement.parentElement)
                parentNodeStyle = window.getComputedStyle(contentNode.parentElement.parentElement);
            let matrixValue = this.updateTransformData(parentNodeStyle);
            if (matrixValue) {
                objData[type].transform = matrixValue;
                objData[type]["transform-origin"] = "left top";
            }
        }
        if (objData["buffer-style"]["transform"] == objData["inner-style"]["transform"]) delete objData["buffer-style"]["transform"];

        if (!objData["buffer-style"]["transform"]) {
            objData["buffer-style"]["transform"] = objData["inner-style"]["transform"];
            objData["buffer-style"]["transform-origin"] = objData["inner-style"]["transform-origin"];
            delete objData["inner-style"]["transform"];
            delete objData["inner-style"]["transform-origin"];
        }
        if (matrix3D) objData["buffer-style"]["transform"] = matrix3D;

        // ExportUtils.updateStyleData(objData, styleData, contentNode, "inner-style");
        // let coordsVal = objData.coords.split(" ");
        // ExportUtils.defaultBufferStyle(objData, styleData, { w: contentNode.offsetWidth, h: contentNode.offsetHeight }, contentNode);
    } catch (error) {
        console.log(error);
    }
    let safariBFcheck = styleData["-webkit-backdrop-filter"] != "none" && styleData["-webkit-backdrop-filter"] != "" && styleData["-webkit-backdrop-filter"] != "unset";
    if (safariBFcheck && styleData["backdrop-filter"] != "none" && styleData["backdrop-filter"] != "" && styleData["backdrop-filter"] != "unset") {
        if (objData["inner-style"]?.["background-color"]) {
            let bgC = objData["inner-style"]?.["background-color"];
            if (!bgC.includes("rgba(0, 0, 0, 0)")) {
                if (bgC.includes("rgba")) {
                    let rgbaValues = bgC.replace("rgba(", "").replace(")", "").split(",");
                    let newRgbaValue = "rgba(" + rgbaValues[0] + "," + rgbaValues[1] + "," + rgbaValues[2] + ",0.8)";
                    objData["inner-style"]["background-color"] = newRgbaValue;
                    objData["inner-style"]["background"] = newRgbaValue;
                } else if (bgC.includes("rgb")) {
                    let rgbValues = bgC.replace("rgb(", "").replace(")", "").split(",");
                    let newRgbaValue = "rgba(" + rgbValues[0] + "," + rgbValues[1] + "," + rgbValues[2] + ",0.8)";
                    objData["inner-style"]["background-color"] = newRgbaValue;
                    objData["inner-style"]["background"] = newRgbaValue;
                } else {
                    objData.opacity = 0.8;
                    objData.alpha = objData.opacity;
                }
            }
        }
    }
    if (objData.alpha != undefined && objData.alpha != null) {
        delete objData["inner-style"]["opacity"];
        delete objData["inner-style"]["alpha"];
    }
    if (objData["inner-style"]?.["transform"] == "matrix(1, 0, 0, 0, 0, 0)") objData.coords = "0 0 0 0";
    if (istextBg) {
        let hasBg = objData["inner-style"]["background-image"] && objData["inner-style"]["background-image"]?.includes("gradient");
        let textClip = styleData["-webkit-background-clip"] == "text" || styleData["background-clip"] == "text";
        if (hasBg && textClip) objData.coords = [0, 0, 0, 0].join(" ");
    }
    if ((contentNode?.id == "TITLE" || contentNode?.id == "title") && contentNode.children.length > 0 && contentNode.querySelector("[class*='TITLEBG']")) {
        let titleBg = contentNode.querySelector("[class*='TITLEBG']");
        if (titleBg && window.getComputedStyle(titleBg).backgroundImage.includes("gradient")) {
            objData.coords = [0, 0, 0, 0].join(" ");
        }
    }
    objData["inner-style"] = ExportUtils.removeEmptyItems(objData["inner-style"]);
    if (objData["inner-style"]?.["border-width"] == "0px 1px 1px") {
        objData["inner-style"]["border-width"] = "1px";
        if (objData["inner-style"].height == "1px") {
            objData["inner-style"].height = "2px";
            objData.coords = objData.coords.replace(" 1", " 2");
        }
    }
    let arrCoords = objData.coords.split(" ");
    if (parseFloat(arrCoords[0]) + parseFloat(arrCoords[2]) <= 0 || parseFloat(arrCoords[1]) + parseFloat(arrCoords[3]) <= 0 || parseFloat(arrCoords[0]) > this.slideWidth || parseFloat(arrCoords[1]) > this.slideHeight) return null;
    ExportUtils.addStyleElement(arrElements, objData);
    return objData;
};

// Apply vertical writing-mode as a rotation + width/height swap on the meta3 entry.
// PPT has no writing-mode, so vertical text is emitted as a rotated horizontal text box.
//   vertical-rl / sideways-rl / vertical-lr -> reads top->bottom  => rotate(90deg)
//   sideways-lr                              -> reads bottom->top  => rotate(-90deg)
// A 180deg flip already on the element inverts the visual direction, so the sign is negated.
// Returns true when a vertical mode was handled (so callers can skip their normal transform path).
ExportUtils.applyVerticalWritingMode = function (objData, styleData) {
    let wm = styleData ? styleData["writing-mode"] : "";
    if (wm != "vertical-rl" && wm != "vertical-lr" && wm != "sideways-rl" && wm != "sideways-lr") return false;
    let baseDeg = wm == "sideways-lr" ? -90 : 90;
    let tf = styleData["transform"] || "";
    let isFlipped = tf == "rotate(180deg)" || tf.replaceAll(" ", "") == "matrix(-1,0,0,-1,0,0)";
    let deg = isFlipped ? -baseDeg : baseDeg;
    objData.transform = "rotate(" + deg + "deg)";
    let arrPositionData = objData.coords ? objData.coords.split(" ") : [];
    if (arrPositionData.length == 4) {
        let newX = parseFloat(arrPositionData[0]) + (-parseFloat(arrPositionData[3]) / 2 + parseFloat(arrPositionData[2]) / 2);
        let newY = parseFloat(arrPositionData[1]) + (parseFloat(arrPositionData[3]) / 2 - parseFloat(arrPositionData[2]) / 2);
        objData.coords = newX + " " + newY + " " + parseFloat(arrPositionData[3]) + " " + parseFloat(arrPositionData[2]);
    }
    return true;
};

ExportUtils.updateStyleData = function (objData, styleData, contentNode, key = "style") {
    let cntParentStyle = contentNode?.parentElement ? window.getComputedStyle(contentNode.parentElement) : null;

    let takeparentStyle = key == "buffer-style" ? false : true;
    let style = {};
    if (styleData["box-shadow"] && styleData["box-shadow"] != "" && styleData["box-shadow"] != undefined) objData.shadow = styleData["box-shadow"];
    if (styleData["display"] && styleData["display"] != undefined) style["display"] = styleData["display"];
    if (style["display"] == "table-cell" || style["display"] == "table-row") style["display"] = "flex";
    if (styleData["border-radius"] && styleData["border-radius"] != "" && styleData["border-radius"] != undefined) {
        style["border-radius"] = styleData["border-radius"];
    } else if (contentNode && takeparentStyle) {
        let parentStyle = cntParentStyle?.borderRadius;
        if (!!parentStyle) style["border-radius"] = parentStyle;
    }
    let hasBorder = styleData["border-width"] && styleData["border-width"] != "" && styleData["border-width"] != undefined && styleData["border-width"] != "0px";
    let hasOutline = styleData["outline-width"] && styleData["outline-width"] != "" && styleData["outline-width"] != undefined && styleData["outline-width"] != "0px" && styleData["outline-style"] && styleData["outline-style"] != "none";
    if (styleData["border-width"] && styleData["border-width"] != "" && styleData["border-width"] != undefined && styleData["border-width"] != "0px") {
        style["border-width"] = styleData["border-width"];
    }
    if (hasBorder && styleData["border-style"] && styleData["border-style"] != "" && styleData["border-style"] != undefined) {
        style["border-style"] = styleData["border-style"];
        if (style["border-style"].includes(" ") && style["border-style"].includes("solid")) style["border-style"] = "solid";
        else if (style["border-style"].includes(" ") && style["border-style"].includes("dashed")) style["border-style"] = "dashed";
        else if (style["border-style"].includes(" ") && style["border-style"].includes("dotted")) style["border-style"] = "dotted";
    }
    if (hasBorder && styleData["border-color"] && styleData["border-color"] != "" && styleData["border-color"] != undefined) {
        style["border-color"] = styleData["border-color"];
    }
    if (hasOutline && styleData["outline-width"] && styleData["outline-width"] != "" && styleData["outline-width"] != undefined && styleData["outline-width"] != "0px") {
        style["outline-width"] = styleData["outline-width"];
    }
    if (hasOutline && styleData["outline-style"] && styleData["outline-style"] != "" && styleData["outline-style"] != undefined) {
        style["outline-style"] = styleData["outline-style"];
    }
    if (hasOutline && styleData["outline-color"] && styleData["outline-color"] != "" && styleData["outline-color"] != undefined) {
        style["outline-color"] = styleData["outline-color"];
    }
    if (styleData["background-image"] && styleData["background-image"] != "" && styleData["background-image"] != undefined) {
        style["background-image"] = styleData["background-image"];
    }
    if (styleData["background-color"] && styleData["background-color"] != "" && styleData["background-color"] != undefined) {
        style["background-color"] = styleData["background-color"];
    }
    if (styleData["background"] && styleData["background"] != "" && styleData["background"] != undefined) {
        style["background"] = styleData["background"];
    }
    if (styleData["background-image"] && styleData["background-image"] != "" && styleData["background-image"] != undefined && styleData["background-image"].includes("gradient")) {
        style["background"] = styleData["background-image"];
    }
    if (styleData["background-size"] && styleData["background-size"] != "" && styleData["background-size"] != undefined) {
        style["background-size"] = styleData["background-size"];
    }
    if (styleData["background-position"] && styleData["background-position"] != "" && styleData["background-position"] != undefined) {
        style["background-position"] = styleData["background-position"];
    }
    if (styleData["transform"] && styleData["transform"] != "" && styleData["transform"] != undefined) {
        style["transform"] = styleData["transform"];
        let matrixValue = this.updateTransformData(styleData, style);
        if (matrixValue) style["transform"] = matrixValue;
    }
    if (!style["origincheck"] && styleData["transform-origin"] && styleData["transform-origin"] != undefined && styleData["transform-origin"] != "none" && styleData["transform-origin"] != "") {
        style["transform-origin"] = styleData["transform-origin"];
    }
    delete style["origincheck"];
    if ((styleData["transform"] == "none" || styleData["transform"] == "" || styleData["transform"] == "unset") && contentNode?.parentElement) {
        style["transform"] = cntParentStyle["transform"];
        style["transform-origin"] = "left top";
        let matrixValue = this.updateTransformData(cntParentStyle);
        if (matrixValue) style["transform"] = matrixValue;
    }
    if (styleData["filter"] && styleData["filter"] != "" && styleData["filter"] != undefined) {
        style["filter"] = styleData["filter"];
    }
    if (styleData["clip-path"] && styleData["clip-path"] != "" && styleData["clip-path"] != undefined) {
        style["clip-path"] = styleData["clip-path"];
    }
    if (styleData["opacity"] && styleData["opacity"] != "" && styleData["opacity"] != "0" && styleData["opacity"] != 0) {
        let opacityVal = styleData ? styleData["opacity"] : 1;
        if (contentNode?.parentElement && takeparentStyle) {
            if ((opacityVal == 1 || opacityVal == "1") && !isNaN(parseFloat(cntParentStyle["opacity"])) && parseFloat(cntParentStyle["opacity"]) != 1) opacityVal = parseFloat(cntParentStyle["opacity"]);
        }
        if (opacityVal != 1 && opacityVal != "1") {
            style.opacity = opacityVal;
            style.alpha = opacityVal;
            objData.opacity = opacityVal;
            objData.alpha = objData.opacity;
        }
    }
    if (styleData["backdrop-filter"] && styleData["backdrop-filter"] != "" && styleData["backdrop-filter"] != undefined) {
        style["backdrop-filter"] = styleData["backdrop-filter"];
    }
    if (styleData["-webkit-mask-image"]) {
        style["-webkit-mask-image"] = styleData["-webkit-mask-image"];
        style["-webkit-mask-size"] = styleData["-webkit-mask-size"] || "100%";
        style["-webkit-mask-position"] = styleData["-webkit-mask-position"] || "center";
        style["-webkit-mask-repeat"] = styleData["-webkit-mask-repeat"] || "no-repeat";
    }
    ExportUtils.applyVerticalWritingMode(objData, styleData);
    style = ExportUtils.removeEmptyItems(style);
    objData[key] = style;
};

ExportUtils.updateMiniStyleData = function (objData, styleData, takeParentStyle = true, childStyle = null, element = null, key = "style") {
    let style = {};
    if (styleData["box-shadow"] && styleData["box-shadow"] != "" && styleData["box-shadow"] != undefined) {
        style["box-shadow"] = styleData["box-shadow"];
        objData.shadow = styleData["box-shadow"];
    }
    if (styleData["display"] && styleData["display"] != undefined) {
        style["display"] = styleData["display"];
    }
    if (style["display"] == "table-cell" || style["display"] == "table-row") style["display"] = "flex";
    if (takeParentStyle) {
        if (styleData["transform-origin"] && styleData["transform-origin"] != undefined) style["transform-origin"] = styleData["transform-origin"];
        if (styleData["transform"] && styleData["transform"] != undefined) {
            style["transform"] = styleData["transform"];
            let matrixValue = this.updateTransformData(styleData);
            if (matrixValue) style["transform"] = matrixValue;
            if (style["transform"] == "none" && childStyle) {
                if (childStyle["transform-origin"] && childStyle["transform-origin"] != undefined) style["transform-origin"] = childStyle["transform-origin"];
                if (childStyle["transform"] && childStyle["transform"] != undefined) {
                    style["transform"] = childStyle["transform"];
                    let matrixValue = this.updateTransformData(styleData);
                    if (matrixValue) style["transform"] = matrixValue;
                }
            }
        }
    } else if (childStyle) {
        if (childStyle["transform-origin"] && childStyle["transform-origin"] != undefined) style["transform-origin"] = childStyle["transform-origin"];
        if (childStyle["transform"] && childStyle["transform"] != undefined) {
            style["transform"] = childStyle["transform"];
            let matrixValue = this.updateTransformData(childStyle);
            if (matrixValue) style["transform"] = matrixValue;
        }
    }
    if (styleData["filter"] && styleData["filter"] != undefined) {
        style["filter"] = styleData["filter"];
    }
    if (styleData["text-shadow"] && styleData["text-shadow"] != undefined && styleData["text-shadow"] != "none") {
        style["text-shadow"] = styleData["text-shadow"];
    }
    if (styleData["-webkit-mask-image"]) {
        style["-webkit-mask-image"] = styleData["-webkit-mask-image"];
        style["-webkit-mask-size"] = styleData["-webkit-mask-size"] || "100%";
        style["-webkit-mask-position"] = styleData["-webkit-mask-position"] || "center";
        style["-webkit-mask-repeat"] = styleData["-webkit-mask-repeat"] || "no-repeat";
    }

    style = ExportUtils.removeEmptyItems(style);
    let opacityVal = childStyle ? childStyle["opacity"] : 1;
    if ((opacityVal == 1 || opacityVal == "1") && !isNaN(parseFloat(styleData["opacity"])) && parseFloat(styleData["opacity"]) != 1) opacityVal = parseFloat(styleData["opacity"]);
    if (element?.parentElement) {
        let parentStyle = window.getComputedStyle(element.parentElement);
        if ((opacityVal == 1 || opacityVal == "1") && !isNaN(parseFloat(parentStyle["opacity"])) && parseFloat(parentStyle["opacity"]) != 1) opacityVal = parseFloat(parentStyle["opacity"]);
    }
    if (opacityVal != 1 && opacityVal != "1") {
        objData.opacity = opacityVal;
        objData.alpha = opacityVal;
    }
    style = ExportUtils.removeEmptyItems(style);
    objData[key] = style;
};

ExportUtils.removeEmptyItems = function (style) {
    if (!style) return style;
    if (style["pointer-events"]) delete style["pointer-events"];
    if (style["transform"] == "none" || style["transform"] == "scale(1)" || style["transform"] == "") delete style["transform"];
    if (style["style"] == "normal") delete style["style"];

    if (style["left"] == "unset" || style["left"] == "" || style["left"] == "0%") delete style["left"];
    if (style["top"] == "unset" || style["top"] == "" || style["top"] == "0%") delete style["top"];
    if (style["right"] == "unset" || style["right"] == "" || style["right"] == "0%") delete style["right"];
    if (style["bottom"] == "unset" || style["bottom"] == "" || style["bottom"] == "0%") delete style["bottom"];

    if (style["margin-left"] == "unset" || style["margin-left"] == "" || style["margin-left"] == "0px" || style["margin-left"] == "0%") delete style["margin-left"];
    if (style["margin-top"] == "unset" || style["margin-top"] == "" || style["margin-top"] == "0px" || style["margin-top"] == "0%") delete style["margin-top"];
    if (style["margin-right"] == "unset" || style["margin-right"] == "" || style["margin-right"] == "0px" || style["margin-right"] == "0%") delete style["margin-right"];
    if (style["margin-bottom"] == "unset" || style["margin-bottom"] == "" || style["margin-bottom"] == "0px" || style["margin-bottom"] == "0%") delete style["margin-bottom"];

    if (style["padding-left"] == "unset" || style["padding-left"] == "" || style["padding-left"] == "0px" || style["padding-left"] == "0%") delete style["padding-left"];
    if (style["padding-top"] == "unset" || style["padding-top"] == "" || style["padding-top"] == "0px" || style["padding-top"] == "0%") delete style["padding-top"];
    if (style["padding-right"] == "unset" || style["padding-right"] == "" || style["padding-right"] == "0px" || style["padding-right"] == "0%") delete style["padding-right"];
    if (style["padding-bottom"] == "unset" || style["padding-bottom"] == "" || style["padding-bottom"] == "0px" || style["padding-bottom"] == "0%") delete style["padding-bottom"];

    if (style["box-shadow"] == "none") delete style["box-shadow"];
    if (style["x"] == "0px" || style["x"] == "0%") delete style["x"];
    if (style["y"] == "0px" || style["y"] == "0%") delete style["y"];
    if (style["filter"] == "none") delete style["filter"];
    if (style["clip-path"] == "none") delete style["clip-path"];
    if (style["transform-origin"] == "") delete style["transform-origin"];
    if (style["background-image"] == "none") delete style["background-image"];
    if (style["background-size"] == "auto") delete style["background-size"];
    if (style["background-position"] == "0% 0%") delete style["background-position"];
    if (style["column-count"] == "auto") delete style["column-count"];
    if (style["stretch"] == "100%") delete style["stretch"];
    if (style["opacity"] == "1" || style["opacity"] == null) delete style["opacity"];
    if (style["alpha"] == "1" || style["alpha"] == null) delete style["alpha"];
    if (style["backdrop-filter"] == "none") delete style["backdrop-filter"];
    if (style["border-radius"] == "0px") delete style["border-radius"];
    if (style["-webkit-mask-image"] == "none") {
        delete style["-webkit-mask-image"];
        delete style["-webkit-mask-position"];
        delete style["-webkit-mask-repeat"];
        delete style["-webkit-mask-size"];
    }
    if (style["transition-duration"] == "0s") {
        delete style["transition-duration"];
        delete style["transition-timing-function"];
        delete style["transition-delay"];
        delete style["transition-property"];
    }
    return style;
};

ExportUtils.getCoords = function (contentNode, parentID, isText) {
    let x = ExportUtils.calculatePosition(contentNode, parentID, "offsetLeft");
    let y = ExportUtils.calculatePosition(contentNode, parentID, "offsetTop");

    let moodParentDiv = document.getElementById("PPTXContainer");
    if (moodParentDiv && moodParentDiv?.querySelector("[id='" + parentID + "']")) {
        let slideDom = moodParentDiv.querySelector("[id='" + parentID + "']");
        let parentRect = slideDom.getBoundingClientRect();
        let childRect = contentNode.getBoundingClientRect();
        let parentTop = parentRect.top;
        let childTop = childRect.top;
        let parentLeft = parentRect.left;
        let childLeft = childRect.left;

        let computedStyle = window.getComputedStyle(contentNode);
        const transformValue = computedStyle.transform || computedStyle.webkitTransform;
        if (transformValue != "none" && transformValue != "" && transformValue != "unset") {
            let values = transformValue.match(/-?[\d.]+/g);
            var a = parseFloat(values[0]);
            var b = parseFloat(values[1]);

            var rotationInRadians = Math.atan2(b, a);
            var rotationInDegrees = rotationInRadians * (180 / Math.PI);
            if (rotationInDegrees == 0) {
                x = childLeft - parentLeft;
                y = childTop - parentTop;
            }
        } else {
            x = childLeft - parentLeft;
            y = childTop - parentTop;
        }
    }

    let w = contentNode.offsetWidth;
    let h = contentNode.offsetHeight;
    if (isText) {
        if (!window.isOrigamiPPTX) w = w + 3.5;

        if (contentNode.parentElement.offsetHeight != 0 && contentNode.offsetHeight > 0) h = contentNode.offsetHeight > contentNode.parentElement.offsetHeight ? contentNode.parentElement.offsetHeight : contentNode.offsetHeight + 1;
        if (w != 6) {
            let padding = ExportUtils.getPadding(contentNode);
            if (padding && padding.paddingLeft) {
                x = parseFloat(x) + parseFloat(padding.paddingLeft);
                w = parseFloat(w) - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight);
            }
            if (padding && padding.paddingTop) {
                y = parseFloat(y) + parseFloat(padding.paddingTop);
                h = parseFloat(h) - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom);
            }
        }
    }
    ExportUtils.outLineSizeUpdate(contentNode, x, y, w, h);
    if (x >= this.slideWidth) w = 0;
    if (y >= this.slideHeight) h = 0;
    return [x, y, w, h].toString().replace(/,/g, " ");
};

ExportUtils.outLineSizeUpdate = function (contentNode, x, y, w, h) {
    if (contentNode) {
        let outlineWidth = window.getComputedStyle(contentNode).outlineWidth;
        if (!isNaN(parseFloat(outlineWidth))) {
            x = parseFloat(x) - parseFloat(outlineWidth) / 2;
            y = parseFloat(y) - parseFloat(outlineWidth) / 2;
            w = parseFloat(w) + parseFloat(outlineWidth) * 2;
            h = parseFloat(h) + parseFloat(outlineWidth) * 2;
        }
    }
};

ExportUtils.getPadding = function (element) {
    let objPadding = { paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 };
    if (element) {
        let elementStyle = window.getComputedStyle(element);
        objPadding.paddingLeft = elementStyle.paddingLeft;
        objPadding.paddingRight = elementStyle.paddingRight;
        objPadding.paddingTop = elementStyle.paddingTop;
        objPadding.paddingBottom = elementStyle.paddingBottom;
    }
    return objPadding;
};

ExportUtils.getCoordsXY = function (contentNode, parentID, iconNode) {
    let x = ExportUtils.calculatePosition(contentNode, parentID, "offsetLeft");
    let y = ExportUtils.calculatePosition(contentNode, parentID, "offsetTop");

    let svgNode = iconNode ? iconNode : contentNode;
    let moodParentDiv = document.getElementById("PPTXContainer");
    if (moodParentDiv && moodParentDiv?.querySelector("[id='" + parentID + "']")) {
        let slideDom = moodParentDiv.querySelector("[id='" + parentID + "']");
        let parentRect = slideDom.getBoundingClientRect();
        let childRect = svgNode.getBoundingClientRect();
        let parentTop = parentRect.top;
        let childTop = childRect.top;
        let parentLeft = parentRect.left;
        let childLeft = childRect.left;

        let computedStyle = window.getComputedStyle(contentNode);
        let transformValue = computedStyle.transform || computedStyle.webkitTransform;
        if (transformValue == "none" || transformValue == "" || transformValue == "unset") {
            computedStyle = window.getComputedStyle(svgNode);
            transformValue = computedStyle.transform || computedStyle.webkitTransform;
        }
        if (transformValue != "none" && transformValue != "" && transformValue != "unset") {
            let values = transformValue.match(/-?[\d.]+/g);
            var a = parseFloat(values[0]);
            var b = parseFloat(values[1]);

            var rotationInRadians = Math.atan2(b, a);
            var rotationInDegrees = rotationInRadians * (180 / Math.PI);
            if (rotationInDegrees == 0) {
                x = childLeft - parentLeft;
                y = childTop - parentTop;
            }
        } else {
            x = childLeft - parentLeft;
            y = childTop - parentTop;
        }
    }

    return { x: x, y: y };
};

ExportUtils.calculatePosition = function (objElement, mainParentID, strOffset) {
    let iOffset = 0;
    if (objElement.offsetParent) {
        do {
            iOffset += objElement[strOffset];
            objElement = objElement.offsetParent;
        } while (objElement && objElement.id != mainParentID);
    }
    return iOffset;
};

ExportUtils.getRandomNumber = function rand() {
    let randomNum = Math.random() * (500 - 400) + 400;
    return Math.round(randomNum);
};

ExportUtils.getMetaData = function (node, parentID) {
    let objData = {};
    if (node && (node != "" || (node.tagName.toLowerCase() == "a" && node.textContent != "")) && node.style) {
        let prompt = node?.id || node.getAttribute("name") || node.getAttribute("data-prompt-text") || "";
        let index = node.getAttribute("data-index") || ExportUtils.getRandomNumber();
        let cssStyle = window.getComputedStyle(node);
        objData.type = "text";
        objData.zindex = cssStyle.zIndex || 0;
        objData.name = prompt + "-" + index;
        objData.text = node.textContent == "" ? prompt : node.textContent;
        if (window.isOrigamiPPTX) objData.innerHTML = node.innerHTML;

        // Per-run highlight styles are now read per-span inside highlightToString /
        // convertHighLightToOutline via getSpanHighlightStyle (each run carries its own
        // markers, e.g. **word**|color| for the background fill). The old slide-wide
        // window.highlightdata snapshot is no longer needed.
        let newString = TextHighLightUtils.highlightToString(node.innerHTML, window.isOrigamiPPTX ? false : true, node);
        if (newString) {
            if (newString.includes("rgb{var(--") || newString.includes("var{--")) {
                const result = ExportUtils.extractUniqueVarRgbValues(newString);
                if (result.length > 0) {
                    let nodeStyle = window.getComputedStyle(node);
                    result.forEach((rgbVariable) => {
                        let cssVarName = rgbVariable.replace("var(", "").replace(")", "");
                        let rgbValue = nodeStyle.getPropertyValue(cssVarName);
                        if (!rgbValue) rgbValue = window.getComputedStyle(document.documentElement).getPropertyValue(cssVarName);
                        if (rgbValue) newString = newString.replaceAll(rgbVariable, rgbValue.replace(/\s+/g, ""));
                    });
                }
                // Handle var{--...} pattern (color without rgb wrapper)
                const varPattern = /\|var\{([^}]+)\}\|/g;
                let varMatch;
                while ((varMatch = varPattern.exec(newString)) !== null) {
                    let cssVarName = "--" + varMatch[1].replace("--", "");
                    let resolvedValue = window.getComputedStyle(node).getPropertyValue(cssVarName);
                    if (!resolvedValue) resolvedValue = window.getComputedStyle(document.documentElement).getPropertyValue(cssVarName);
                    if (resolvedValue) {
                        resolvedValue = resolvedValue.replace(/\s+/g, "").replace("(", "{").replace(/\)$/, "}");
                        newString = newString.replaceAll("var{" + varMatch[1] + "}", resolvedValue);
                    }
                }
            }
            objData.text = newString;
        }
        if (node.querySelector("[id*='quillicon']")) {
            let iconNode = node.querySelector("[id*='quillicon']");
            objData.text = objData.text.replace(iconNode.textContent, "");
        }

        let isText = node.tagName.toLowerCase() == "td" ? false : true;
        let textIndent = cssStyle["text-indent"] ? parseFloat(cssStyle["text-indent"].replace("px", "")) : 0;
        let extraSpace = 0;
        if (textIndent > 0) {
            let dummyNode = node.cloneNode(true);
            dummyNode.innerHTML = "i";
            dummyNode.style.textIndent = "0px";
            dummyNode.style.position = "absolute";
            dummyNode.style.width = "auto";
            dummyNode.style.opacity = "0";
            node.parentElement.appendChild(dummyNode);
            let ow = parseFloat(window.getComputedStyle(dummyNode).width).toFixed(2);
            node.parentElement.removeChild(dummyNode);
            extraSpace = parseInt(textIndent / parseFloat(ow)) + 3;
        }
        for (let i = 0; i < extraSpace; i++) {
            objData.text = " " + objData.text;
            if (window.isOrigamiPPTX) objData.innerHTML = "&nbsp;" + objData.innerHTML;
        }
        objData.coords = ExportUtils.getCoords(node, parentID, isText);
        let listNode = node.querySelector("[data-id='secondaryTextItem'");
        if (listNode) {
            cssStyle = window.getComputedStyle(listNode);
            objData.halign = ExportUtils.resolveHAlign(cssStyle);
        }
        ExportUtils.updateFontStyleData(objData, cssStyle, listNode ? listNode : node);
        ExportUtils.updateMiniStyleData(objData, cssStyle, true, null, node);
        if (window.isOrigamiPPTX) {
            objData["font"]["justify-content"] = cssStyle["justify-content"];
            objData["font"]["align-items"] = cssStyle["align-items"];
        }
        if (objData.font?.style == "italic") objData.text = "!" + objData.text + "!";

        if (window.isOrigamiPPTX && objData["transform"]) {
            objData.style ? (objData.style["transform"] = objData["transform"]) : (objData.style = { transform: objData["transform"] });
        }

        try {
            if (objData.transform?.includes("rotate(") && objData["transform-origin"] == "center") {
                objData.transform = objData.transform.replace("scaleX(1) ", "").replace("scaleY(1) ", "").trim();
                var rotateRegex = /rotate\(([-+]?\d*\.?\d+)(deg)?\)/;
                var transMatch = objData.transform.match(rotateRegex);
                if (transMatch) {
                    var rotateAngle = parseFloat(transMatch[1]);
                    if (rotateAngle != 0) {
                        let arrCoords = objData.coords.split(" ");
                        let width = parseFloat(arrCoords[2]);
                        let height = parseFloat(arrCoords[3]);
                        let rotateLeft = -width / 2 + height / 2;
                        let rotateTop = -height / 2 + width / 2;
                        arrCoords[0] = parseFloat(arrCoords[0]) + rotateLeft;
                        arrCoords[1] = parseFloat(arrCoords[1]) + rotateTop;
                        arrCoords[2] = parseFloat(arrCoords[2]) + 3;
                        arrCoords[3] = parseFloat(arrCoords[3]) + 3;
                        objData.coords = arrCoords.toString().replace(/,/g, " ");
                    }
                } else {
                    console.log("No rotate angle found");
                }
            }
        } catch (error) {}

        const match = cssStyle["color"].match(/[\d\.]+/g);
        if (match?.[3] && !isNaN(parseFloat(match[3])) && parseFloat(match[3]) > 0 && parseFloat(match[3]) <= 1) {
            objData.opacity = match[3];
            objData.alpha = match[3];
        }

        if (objData.font && objData.font["text-transform"] == "uppercase") objData.text = objData.text.toUpperCase();
        if (objData.font && objData.font["text-transform"] == "lowercase") objData.text = objData.text.toLowerCase();
        if (objData.font && objData.font["text-transform"] == "capitalize")
            objData.text = objData.text
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

        // Replace |RGB{ with |rgb{ and <U> with <u> and </U> with </u>
        if (objData.text) {
            objData.text = objData.text.replaceAll("|RGB{", "|rgb{").replaceAll("<U>", "<u>").replaceAll("</U>", "</u>");
            // Decode custom entities back to actual characters
            objData.text = objData.text
                .replaceAll("&star;", "*")
                .replaceAll("&STAR;", "*")
                .replaceAll("&tilde;", "~")
                .replaceAll("&TILDE;", "~")
                .replaceAll("&lbrace;", "{")
                .replaceAll("&LBRACE;", "{")
                .replaceAll("&underscore;", "_")
                .replaceAll("&UNDERSCORE;", "_")
                .replaceAll("&rbrace;", "}")
                .replaceAll("&RBRACE;", "}")
                .replaceAll("&pipe;", "|")
                .replaceAll("&PIPE;", "|")
                .replaceAll("&exclamation;", "!")
                .replaceAll("&EXCLAMATION;", "!")
                .replaceAll("&lt;", "<")
                .replaceAll("&LT;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&GT;", ">")
                .replaceAll("&hat;", "^")
                .replaceAll("&HAT;", "^")
                .replaceAll("&equal;", "=")
                .replaceAll("&EQUAL;", "=")
                .replaceAll("&lbracket;", "[")
                .replaceAll("&LBRACKET;", "[")
                .replaceAll("&backslash;", "\\")
                .replaceAll("&BACKSLASH;", "\\")
                .replaceAll("&rbracket;", "]")
                .replaceAll("&RBRACKET;", "]")
                .replaceAll("&lparenthesis;", "(")
                .replaceAll("&LPARENTHESIS;", "(")
                .replaceAll("&rparenthesis;", ")")
                .replaceAll("&RPARENTHESIS;", ")")
                .replaceAll("&comma;", ",")
                .replaceAll("&COMMA;", ",");
        }
        if (objData.style?.["transform"] == "matrix(1, 0, 0, 0, 0, 0)") objData.coords = "0 0 0 0";
        if (cssStyle.backgroundImage.includes("gradient")) {
            try {
                objData.gradient = {};
                let gradientValue = ExportUtils.getOriginalGradientSyntax(cssStyle);
                if (gradientValue && (cssStyle.color == "rgba(0, 0, 0, 0)" || cssStyle.color == "transparent")) {
                    let isLinearGradient = gradientValue.includes("linear-gradient");
                    let isRadialGradient = gradientValue.includes("radial-gradient");
                    objData.gradient.type = isRadialGradient ? "Radial" : "Linear";
                    objData.gradient.direction = isRadialGradient ? "Ellipse" : "LinearRight";

                    // Remove gradient function wrapper and parentheses
                    const innerContent = gradientValue.replace(/^(linear-gradient|radial-gradient)\(|\)$/g, "");

                    // Improved parsing to handle complex splits
                    const parts = [];
                    const tokens = innerContent.split(/,\s*/);

                    // Reassemble rgb values that got split
                    let currentToken = "";
                    tokens.forEach((token) => {
                        if (token.startsWith("rgb(") || currentToken.startsWith("rgb(")) {
                            if (currentToken) currentToken += ", " + token;
                            else currentToken = token;

                            // Check if RGB value is complete
                            if (currentToken.includes(")")) {
                                parts.push(currentToken);
                                currentToken = "";
                            }
                        } else {
                            if (currentToken) {
                                parts.push(currentToken);
                                currentToken = "";
                            }
                            parts.push(token);
                        }
                    });

                    // If there's a dangling token, add it
                    if (currentToken) parts.push(currentToken);

                    function parseNumericAngle(angleStr) {
                        // Remove 'deg' and convert to number
                        const numericAngle = parseFloat(angleStr);
                        return isNaN(numericAngle) ? null : numericAngle;
                    }

                    // Parse angle for linear gradient
                    if (isLinearGradient) {
                        const firstPart = parts[0];
                        const parsedAngle = ExportUtils.parseLinearGradientAngle(firstPart);
                        if (parsedAngle) {
                            objData.gradient.angle = parseNumericAngle(parsedAngle.angle) + 270;
                            if (objData.gradient.angle >= 360) objData.gradient.angle = objData.gradient.angle - 360;
                            parts.shift();
                        }
                    } else if (isRadialGradient) {
                        objData.gradient.angle = 0;

                        const positions = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"];

                        // Check for position (at keyword or direct position)
                        const positionIndex = parts.findIndex((part) => part.startsWith("at "));
                        if (positionIndex !== -1) {
                            const positionPart = parts[positionIndex].replace("at ", "");
                            // Split position parts and find valid positions
                            const positionParts = positionPart.split(/\s+/);
                            const validPositionParts = positionParts.filter((part) => positions.includes(part.toLowerCase()));

                            if (validPositionParts.length > 0) {
                                objData.gradient.direction = validPositionParts.join(" ");
                            }

                            parts.splice(positionIndex, 1);
                        } else {
                            // Check for standalone position
                            const positionMatch = parts.find((part) => positions.some((pos) => part.toLowerCase().includes(pos)));

                            if (positionMatch) {
                                const validPositionParts = positionMatch.split(/\s+/).filter((part) => positions.includes(part.toLowerCase()));

                                if (validPositionParts.length > 0) {
                                    objData.gradient.direction = validPositionParts.join(" ");
                                    parts.splice(parts.indexOf(positionMatch), 1);
                                }
                            }
                        }
                        if (objData.gradient.direction == "right top") objData.gradient.direction = "TopRightCorner";
                        if (objData.gradient.direction == "left top") objData.gradient.direction = "TopLeftCorner";
                        if (objData.gradient.direction == "right bottom") objData.gradient.direction = "BottomRightCorner";
                        if (objData.gradient.direction == "left bottom") objData.gradient.direction = "BottomLeftCorner";
                    }

                    // Parse color stops
                    objData.gradient.stops = parts
                        .map((stop) => {
                            // Updated regex to support both % and px
                            const colorMatch = stop.match(/^(rgb\([^)]+\))\s*(\d+(?:%|px))?/);

                            // Convert position to numeric value
                            let position = null;
                            if (colorMatch && colorMatch[2]) {
                                const positionStr = colorMatch[2];
                                position = parseFloat(positionStr);

                                // If position is NaN, return null
                                position = isNaN(position) ? null : position;
                            }

                            return {
                                color: colorMatch ? colorMatch[1] : stop,
                                position: position,
                            };
                        })
                        .filter((stop) => stop.color); // Remove any empty stops
                    // if stops null means adding default value
                    objData.gradient.stops.forEach((stop) => {
                        if (stop.position == null) stop.position = 100 / objData.gradient.stops.length;
                    });
                    if (isLinearGradient) delete objData.gradient.direction;
                }
            } catch (error) {
                console.log("SG - error on gradient parsing", error);
            }
        }
        objData.font = ExportUtils.removeEmptyItems(objData.font);

        if (window.isOrigamiPPTX) {
            let fSize = objData.font["size"];
            let lh = objData.font["line-height"];
            let em = parseFloat(lh) / parseFloat(fSize);
            objData.font["line-height"] = em;
        }

        let arrCoords = objData.coords.split(" ");
        if ((parseFloat(arrCoords[0]) + parseFloat(arrCoords[2]) <= 0 || parseFloat(arrCoords[1]) + parseFloat(arrCoords[3]) <= 0 || parseFloat(arrCoords[0]) > this.slideWidth || parseFloat(arrCoords[1]) > this.slideHeight) && objData.transform == "none") return null;

        if (objData?.style?.filter == "grayscale(1)") {
            objData["foreground-color"] = "rgb(46, 46, 46)";
            objData["highlight-color"] = "rgb(46, 46, 46)";
            objData["font"]["color"] = "rgb(46, 46, 46)";
        }
    }
    if (objData.text?.includes("\v")) objData.text = objData.text.replaceAll("\v", " ");
    if (objData.text?.includes("\\u000")) objData.text = objData.text.replaceAll("\\u000", " ");
    if (objData.text?.includes("\\x0b")) objData.text = objData.text.replaceAll("\\x0b", " ");

    let nodeParentElement = node?.parentElement;
    if (node?.id == "TITLE" || nodeParentElement?.id == "TITLE" || node?.id == "title" || nodeParentElement?.id == "title" || node?.id?.includes("sgTitleNode") || nodeParentElement?.id?.includes("sgTitleNode")) objData.name = "Title 3";
    if (
        node?.id == "SUBTITLE" ||
        nodeParentElement?.id == "SUBTITLE" ||
        nodeParentElement?.parentElement?.id == "SUBTITLE" ||
        node?.id == "subtitle" ||
        nodeParentElement?.id == "subtitle" ||
        nodeParentElement?.parentElement?.id == "subtitle" ||
        node?.id?.includes("sgSubTitleNode") ||
        nodeParentElement?.id?.includes("sgSubTitleNode") ||
        nodeParentElement?.getAttribute("data-cssslide")?.endsWith("subtitle")
    ) {
        objData.name = "SubTitle";
    }
    if (node?.id == "FOOTER_MESSAGE" || node?.id == "sgFooterNode") objData.name = "Source";

    return objData;
};

ExportUtils.extractUniqueVarRgbValues = function (inputString) {
    // Regex pattern to match RGB values that contain var(--)
    const regex = /\|rgb\{(var\(--[^}]+)\}/g;

    // Get all matches using matchAll
    const matches = [...inputString.matchAll(regex)];

    // Extract unique RGB values using Set
    const uniqueRgbValues = [...new Set(matches.map((match) => match[1]))];

    return uniqueRgbValues;
};

ExportUtils.getOriginalGradientSyntax = function (computedStyle) {
    const backgroundImage = computedStyle?.backgroundImage;

    // If it's not a linear gradient, return as is
    if (!backgroundImage?.startsWith("linear-gradient")) {
        return backgroundImage;
    }

    // Remove 'linear-gradient(' from the start and ')' from the end
    const innerGradient = backgroundImage.slice(16, -1);
    const parts = innerGradient.split(",").map((part) => part.trim());

    // Mapping of degree angles to direction keywords
    const angleToDirection = {
        "0deg": "to top",
        "90deg": "to right",
        "180deg": "to bottom",
        "270deg": "to left",
        "-90deg": "to left",
    };

    // Check if the first part is an angle
    const angleRegex = /^(-?\d+)deg$/;
    const angleMatch = parts[0].match(angleRegex);

    if (angleMatch) {
        const angle = angleMatch[1] + "deg";
        const direction = angleToDirection[angle];

        if (direction) {
            // Reconstruct with direction keyword
            return `linear-gradient(${direction}, ${parts.slice(1).join(",")})`;
        } else {
            // If no predefined direction, keep the original degree
            return `linear-gradient(${angle}, ${parts.slice(1).join(",")})`;
        }
    }

    // Check for predefined direction keywords
    const directions = ["to top", "to right", "to bottom", "to left"];
    if (directions.includes(parts[0])) {
        // Already has a direction, return as is
        return `linear-gradient(${innerGradient})`;
    }

    // If no direction specified, add default direction
    return `linear-gradient(to bottom, ${innerGradient})`;
};

ExportUtils.parseLinearGradientAngle = function (angleStr) {
    // Predefined angle mappings with corresponding direct properties
    const angleMap = {
        "to top": { angle: 0, direct: "top" },
        top: { angle: 0, direct: "top" },

        "to right": { angle: 90, direct: "right" },
        right: { angle: 90, direct: "right" },

        "to bottom": { angle: 180, direct: "bottom" },
        bottom: { angle: 180, direct: "bottom" },

        "to left": { angle: 270, direct: "left" },
        left: { angle: 270, direct: "left" },

        "to top right": { angle: 45, direct: "top right" },
        "to bottom right": { angle: 135, direct: "bottom right" },

        "to bottom left": { angle: 225, direct: "bottom left" },
        "to top left": { angle: 315, direct: "top left" },
    };

    // If it's already a numeric deg value
    if (/^\d+deg$/.test(angleStr)) {
        return {
            angle: parseFloat(angleStr),
        };
    }

    // Check against predefined mappings
    const mappedAngle = angleMap[angleStr.toLowerCase()];
    if (mappedAngle) return mappedAngle;

    // If no match found, return null
    return {
        angle: null,
        direct: null,
    };
};

// Resolve a computed `content` value into the literal text that gets rendered.
// getComputedStyle resolves attr() to a quoted string but leaves counter()/counters()
// LITERAL (Chromium does not resolve list counters in computed style), so `content: counter(lvl0) "."`
// comes back as the string `counter(lvl0) "."`. We tokenize the value into quoted-string literals and
// counter() functions, replace each counter() with the list item's 1-based position (same number
// createMarkerMeta3 derives from indexOf), and concatenate WITHOUT separators — matching how the
// browser actually paints the pseudo-element (the space getComputedStyle inserts between tokens is
// presentational only and must be dropped).
ExportUtils.resolvePseudoContent = function (rawContent, node) {
    if (!rawContent || rawContent === "none" || rawContent === "normal") return "";
    // Resolve counter() to the multi-level ci-list value. The list is a FLAT <ol> whose items carry
    // a depth via class `ci-list-indent-N` (level 0 when absent). Per common-template-styles.css each
    // <li> does `counter-increment:lvlN; counter-reset:lvl(N+1)..lvl4` — i.e. it bumps its own level
    // counter and zeroes every DEEPER level. We replay that over the sibling <li>s in document order
    // up to and including this node; the node's own level counter is the value its ::before renders.
    let counterValue = 1;
    try {
        let parent = node ? node.parentElement : null;
        if (parent) {
            let levelOf = (li) => {
                let cls = li && typeof li.className === "string" ? li.className : "";
                let m = cls.match(/ci-list-indent-(\d+)/);
                return m ? parseInt(m[1], 10) : 0;
            };
            let counters = {};
            let lis = Array.prototype.filter.call(parent.children, (c) => c.tagName && c.tagName.toLowerCase() === "li");
            for (let i = 0; i < lis.length; i++) {
                let lvl = levelOf(lis[i]);
                counters[lvl] = (counters[lvl] || 0) + 1;
                Object.keys(counters).forEach((k) => {
                    if (parseInt(k, 10) > lvl) counters[k] = 0;
                });
                if (lis[i] === node) {
                    counterValue = counters[lvl];
                    break;
                }
            }
        }
    } catch (e) {}
    let result = "";
    let matched = false;
    // Each token is either a quoted string ("..." with escapes) or a counter()/counters() call.
    let tokenRegex = /"((?:[^"\\]|\\.)*)"|counters?\([^)]*\)/g;
    let match;
    while ((match = tokenRegex.exec(rawContent)) !== null) {
        matched = true;
        if (match[0][0] === '"')
            result += match[1]; // quoted string literal -> its inner text
        else result += counterValue; // counter(...) / counters(...) -> resolved number
    }
    // Fallback: value had no quoted/counter tokens (e.g. an already-resolved attr() bareword) — keep as-is.
    if (!matched) result = rawContent.replaceAll('"', "");
    return result;
};

// Detect the CSS "gradient border via mask-composite" pattern on a pseudo-element and, if found,
// rewrite the drawing's inner-style into border-gradient + border-gradient-width fields (and strip
// the gradient fill / mask props that would otherwise flood the whole box on export).
ExportUtils.applyGradientBorder = function (objData, cssStyle) {
    let innerStyle = objData["inner-style"];
    if (!innerStyle) return;
    let bgImage = cssStyle.getPropertyValue("background-image") || "";
    if (!bgImage.includes("linear-gradient")) return;
    // The mask-composite (std "exclude" / -webkit "xor") is what punches out the interior, leaving
    // only the padding ring painted — the defining signature of this trick.
    let maskComposite = (cssStyle.getPropertyValue("mask-composite") || "").trim();
    let wkMaskComposite = (cssStyle.getPropertyValue("-webkit-mask-composite") || "").trim();
    if (maskComposite !== "exclude" && wkMaskComposite !== "xor") return;
    // Ring width = padding (the gutter between the outer edge and the masked content-box).
    let widthPx = parseFloat(cssStyle.getPropertyValue("padding-top") || cssStyle.getPropertyValue("padding") || "");
    if (isNaN(widthPx) || widthPx <= 0) return;

    innerStyle["border-gradient"] = bgImage;
    innerStyle["border-gradient-width"] = widthPx + "px";
    // Drop fill + mask props so the exporter renders a gradient STROKE, not a filled/masked box.
    delete innerStyle["background-image"];
    delete innerStyle["background"];
    delete innerStyle["background-size"];
    delete innerStyle["background-position"];
    delete innerStyle["-webkit-mask-image"];
    delete innerStyle["-webkit-mask-size"];
    delete innerStyle["-webkit-mask-position"];
    delete innerStyle["-webkit-mask-repeat"];
};

ExportUtils.getPsudoRect = function (arrElements, parentNode, parentID, psudoItem = ":after", nodeParentStyle, objCallback) {
    if (parentNode && parentNode.offsetHeight == 0 && parentNode.offsetWidth == 0) return;
    let cssStyle = window.getComputedStyle(parentNode, psudoItem);
    let objData = { type: "drawing", "drawing-type": "rect", name: "PSudoRect" };
    objData.coords = ExportUtils.getCoords(parentNode, parentID, false);
    objData.name = psudoItem;
    let coords = objData.coords.split(" ");

    let parentPaddingL = 0;
    let parentPaddingT = 0;
    let isListEle = parentNode.parentElement.tagName.toLowerCase() == "ul" || parentNode.parentElement.tagName.toLowerCase() == "ol";
    if (isListEle) {
        let parentStyle = window.getComputedStyle(parentNode.parentElement);
        parentPaddingL = !isNaN(parseFloat(parentStyle.paddingLeft.replace("px", ""))) ? parseFloat(parentStyle.paddingLeft.replace("px", "")) : 0;
        parentPaddingT = !isNaN(parseFloat(parentStyle.paddingTop.replace("px", ""))) ? parseFloat(parentStyle.paddingTop.replace("px", "")) : 0;
    }

    let doCheckExtraValues = true;
    if (parentNode.tagName.toLowerCase() == "li" && isListEle && parentNode.parentElement.parentElement.tagName.toLowerCase() == "div") doCheckExtraValues = false;

    // ci-list indentation lives entirely in the li's own padding-left (ci-list-indent-N adds N*56px
    // on top of the base marker column). The number is a flex ::before at the li's CONTENT-box left,
    // while the text box (getCoords isText=true) also lands at content-box left = li.left + padding.
    // The marker here uses getCoords(...,false) = BORDER-box left, so for level-0 the number already
    // sits a natural gap (= base padding) before the text and looks correct; only INDENTED items need
    // help, because their bigger padding pushes the text further right while the number stayed put.
    // Shift the number right by ONLY the EXTRA indent (thisPadding - basePadding of a level-0 sibling)
    // so every level keeps the same number→text gap level-0 has. Shifting by the FULL padding would
    // put the number on top of the text (overlap). Skip ::marker (it re-derives its own coords).
    let selfPaddingL = 0;
    if (isListEle && parentNode.tagName.toLowerCase() == "li" && psudoItem != "::marker") {
        let thisPad = parseFloat(window.getComputedStyle(parentNode).paddingLeft);
        if (isNaN(thisPad)) thisPad = 0;
        // base = padding of a non-indented sibling <li>; fall back to the marker column (--list-element-size + 20px)
        let basePad = NaN;
        let baseSib = Array.prototype.find.call(parentNode.parentElement.children, (c) => c.tagName && c.tagName.toLowerCase() == "li" && !/ci-list-indent-\d/.test(typeof c.className === "string" ? c.className : ""));
        if (baseSib) basePad = parseFloat(window.getComputedStyle(baseSib).paddingLeft);
        if (isNaN(basePad)) {
            let elSize = parseFloat(window.getComputedStyle(parentNode).getPropertyValue("--list-element-size"));
            basePad = (isNaN(elSize) ? 0 : elSize) + 20;
        }
        selfPaddingL = thisPad - basePad;
        if (isNaN(selfPaddingL) || selfPaddingL < 0) selfPaddingL = 0;
    }
    coords[0] = parseFloat(coords[0]) + parseFloat(cssStyle["margin-left"]) + parseFloat(cssStyle["left"].includes("px") ? cssStyle["left"] : 0) - parentPaddingL + selfPaddingL;
    coords[1] = parseFloat(coords[1]) + parseFloat(cssStyle["margin-top"]) + (doCheckExtraValues ? parseFloat(cssStyle["top"].includes("px") ? cssStyle["top"] : 0) : 0) - parentPaddingT;
    let addNode = true;
    if (coords[0] > this.slideWidth) addNode = false;
    if (coords[1] > this.slideHeight) addNode = false;
    if (addNode && coords.length == 4 && psudoItem == "::marker") {
        // Marker number list text adding
        let objOldData = { psudoItem: psudoItem, coords: coords, parentPaddingL: parentPaddingL, parentPaddingT: parentPaddingT };
        objCallback.markerCallback(parentNode, parentID, arrElements, cssStyle, nodeParentStyle, objOldData);
    }
    if (addNode && coords.length == 4 && cssStyle.getPropertyValue("content") != "none") {
        coords[2] = isNaN(parseFloat(cssStyle.width.replace("px"))) ? 0 : parseFloat(cssStyle.width.replace("px"));
        coords[3] = isNaN(parseFloat(cssStyle.height.replace("px"))) ? 0 : parseFloat(cssStyle.height.replace("px"));
        objData.coords = coords.toString().replace(/,/g, " ");
        ExportUtils.updateStyleData(objData, cssStyle, null, "inner-style");
        // Gradient border via the CSS "mask-composite" trick: a ::before paints a gradient over the
        // whole box, then masks out the content-box so only the padding ring shows. OOXML can't
        // express the mask, and the plain gradient fill emitted above would flood the entire card.
        // Collapse it to explicit border-gradient + width fields the exporter turns into a gradient
        // stroke (see pptx-service handleDrawing / applyShapeGradients).
        ExportUtils.applyGradientBorder(objData, cssStyle);
        let borderWidth = objData["inner-style"]["border-width"] ? parseFloat(objData["inner-style"]["border-width"].replace("px", "")) : 0;
        if (isNaN(parseFloat(borderWidth))) borderWidth = 0;
        objData["inner-style"]["width"] = coords[2] - borderWidth * 2 + "px";
        objData["inner-style"]["height"] = coords[3] - borderWidth * 2 + "px";

        objData["buffer-style"] = {
            width: coords[2] + "px",
            height: coords[3] + "px",
            position: "absolute",
            overflow: "hidden",
        };
        if (!objData["buffer-style"]["transform"]) {
            objData["buffer-style"]["transform"] = objData["inner-style"]["transform"];
            objData["buffer-style"]["transform-origin"] = objData["inner-style"]["transform-origin"];
            delete objData["inner-style"]["transform"];
            delete objData["inner-style"]["transform-origin"];
        }

        // Before/after basic styles adding
        objCallback.callback(arrElements, objData, parentNode, nodeParentStyle);

        let contentValue = ExportUtils.resolvePseudoContent(cssStyle.content, parentNode);
        if (contentValue != "" && psudoItem != "::marker") {
            // Before/after content adding
            let objOldData = { psudoItem: psudoItem, coords: coords, contentValue: contentValue };
            objCallback.psudoContentCallback(parentNode, parentID, arrElements, cssStyle, nodeParentStyle, objOldData);
        }
    }
};

// Direction-aware text-align → halign. `direction` is inherited, so the computed style at the
// text node already reflects an rtl/ltr set on any ancestor. In RTL context an unset/`start`
// text-align renders right and `end` renders left, so the physical mapping must flip.
ExportUtils.resolveHAlign = function (cssStyle) {
    let ta = cssStyle["text-align"];
    let rtl = cssStyle.direction == "rtl";
    if (ta == "right" || ta == "center" || ta == "left" || ta == "justify") return ta;
    if (ta == "end") return rtl ? "left" : "right";
    return rtl ? "right" : "left"; // start / unset → direction default
};

ExportUtils.updateFontStyleData = function (objData, cssStyle, node) {
    let objFontData = {};
    let fontsize = cssStyle.getPropertyValue("font-size");
    let lineHeight = cssStyle.getPropertyValue("line-height");
    objFontData["face"] = cssStyle.getPropertyValue("font-family").replace(/\"/g, "");
    try {
        if (cssStyle.getPropertyValue("--alternate-font-family")?.trim()?.length > 0) objFontData["face"] = cssStyle.getPropertyValue("--alternate-font-family").replace(/^"|"$/g, "");
    } catch (error) {}
    objFontData["size"] = fontsize ? fontsize.replace("px", "") : "0";
    objFontData["weight"] = cssStyle.getPropertyValue("font-weight");
    if (cssStyle.getPropertyValue("line-height") != "normal") objFontData["line-height"] = lineHeight ? lineHeight.replace("px", "") : "normal";
    if (cssStyle.getPropertyValue("column-count")) objFontData["column-count"] = cssStyle.getPropertyValue("column-count");
    if (cssStyle.getPropertyValue("letter-spacing") != "normal") objFontData["letter-spacing"] = cssStyle.getPropertyValue("letter-spacing");
    objFontData["style"] = cssStyle.getPropertyValue("font-style");
    objFontData["stretch"] = cssStyle.getPropertyValue("font-stretch");
    objFontData["color"] = cssStyle.getPropertyValue("color");
    objFontData["background"] = cssStyle.getPropertyValue("background");
    if (cssStyle["background-image"] && cssStyle["background-image"] != "" && cssStyle["background-image"] != undefined) objFontData["background-image"] = cssStyle["background-image"];
    if (cssStyle["background-clip"] && cssStyle["background-clip"] != "" && cssStyle["background-clip"] != undefined) objFontData["background-clip"] = cssStyle["background-clip"];
    if (cssStyle["-webkit-background-clip"] && cssStyle["-webkit-background-clip"] != "" && cssStyle["-webkit-background-clip"] != undefined) objFontData["-webkit-background-clip"] = cssStyle["-webkit-background-clip"];
    if (!window.isOrigamiPPTX && cssStyle["-webkit-text-fill-color"] && cssStyle["-webkit-text-fill-color"] != "" && cssStyle["-webkit-text-fill-color"] != undefined) objFontData["-webkit-text-fill-color"] = cssStyle["-webkit-text-fill-color"];
    if (!window.isOrigamiPPTX && cssStyle["text-fill-color"] && cssStyle["text-fill-color"] != "" && cssStyle["text-fill-color"] != undefined) objFontData["text-fill-color"] = cssStyle["text-fill-color"];

    objFontData["display"] = cssStyle.getPropertyValue("display");
    if (objFontData["display"] == "table-cell" || objFontData["display"] == "table-row") objFontData["display"] = "flex";
    if (cssStyle.getPropertyValue("text-transform") && cssStyle.getPropertyValue("text-transform") != "none") objFontData["text-transform"] = cssStyle.getPropertyValue("text-transform");
    if (cssStyle.getPropertyValue("text-wrap-style") && cssStyle.getPropertyValue("text-wrap-style") != "auto") objFontData["text-wrap-style"] = cssStyle.getPropertyValue("text-wrap-style");
    let twStyle = cssStyle.getPropertyValue("text-wrap-style") || cssStyle.getPropertyValue("text-wrap");
    if (twStyle && (twStyle = twStyle.trim()) && twStyle !== "auto" && twStyle !== "wrap" && twStyle !== "nowrap" && twStyle !== "normal") {
        // Only emit when the DOM actually wraps to >1 visual line — otherwise the consumer's
        // TTF-based re-measurement can split a single-line element into two.
        let lineCount = 1;
        try {
            let r = document.createRange();
            r.selectNodeContents(node);
            lineCount = r.getClientRects().length || 1;
        } catch (e) {}
        if (lineCount > 1) objFontData["text-wrap-style"] = twStyle;
    }
    objData["shadow"] = cssStyle.getPropertyValue("text-shadow");
    if (objData["shadow"] == "none") delete objData["shadow"];
    objData["foreground-color"] = cssStyle.getPropertyValue("color");
    if (cssStyle.direction == "rtl") objData.direction = "rtl";
    objData.halign = ExportUtils.resolveHAlign(cssStyle);

    objData.anchor = "top";
    if (cssStyle["display"] == "flex" && ((cssStyle["flex-direction"] == "row" && cssStyle["align-items"] == "center") || (cssStyle["flex-direction"] == "column" && cssStyle["justify-content"] == "center"))) objData.anchor = "center";

    if (cssStyle["align-self"] == "center" && cssStyle["align-items"] == "center") objData.halign = "center";
    objData.font = objFontData;
    //Text Transform properties creation
    let writingMode = cssStyle.getPropertyValue("writing-mode") || cssStyle["writing-mode"] || "";
    let textOrientation = cssStyle.getPropertyValue("text-orientation") || cssStyle["text-orientation"] || "";
    if (writingMode && writingMode != "horizontal-tb") objFontData["writing-mode"] = writingMode;
    if (textOrientation && textOrientation != "mixed") objFontData["text-orientation"] = textOrientation;
    if (ExportUtils.applyVerticalWritingMode(objData, cssStyle)) {
    } else if (node) {
        let parentStyle = window.getComputedStyle(node);
        objData["transform"] = parentStyle.transform;
        let matrixValue = this.updateTransformData(parentStyle, null, null, true);
        if (matrixValue) objData["transform"] = matrixValue;
        objData["transform-origin"] = node.style.transformOrigin;
        if ((!objData["transform"] || objData["transform"] == "scale(1)" || objData["transform"] == "" || objData["transform"] == "unset" || objData["transform"] == "none") && node.parentElement) {
            parentStyle = window.getComputedStyle(node.parentElement);
            objData["transform"] = parentStyle.transform;
            matrixValue = this.updateTransformData(parentStyle);
            if (matrixValue) {
                objData["transform"] = matrixValue;
                objData["transform-origin"] = node.parentElement.style.transformOrigin || "left top";
            }
        }
    }
};

ExportUtils.getCurrentRotation = function (el) {
    var st = window.getComputedStyle(el, null);
    var tm = st.getPropertyValue("-webkit-transform") || st.getPropertyValue("-moz-transform") || st.getPropertyValue("-ms-transform") || st.getPropertyValue("-o-transform") || st.getPropertyValue("transform") || "none";
    if (tm != "none") {
        var values = tm.split("(")[1].split(")")[0].split(",");
        var angle = Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
        return angle < 0 ? angle + 360 : angle;
    }
    return 0;
};

ExportUtils.addStyleElement = function (arrElements, objData) {
    if (arrElements && objData) {
        let styleValue = objData.style ? objData.style : objData["inner-style"];

        let coords = objData.coords ? objData.coords.split(" ") : [];
        let hasProperCoords = objData.coords == "0 0 0 0" ? false : coords.length == 4 && parseFloat(coords[2] + "") > 0 && parseFloat(coords[3] + "") > 0;

        let hasInvisibleLayer = styleValue && styleValue.background && styleValue.background.replace(/\s/g, "").includes("rgba(0,0,0,0)") && !styleValue.background.replace(/\s/g, "").includes("-gradient") && !styleValue.background.replace(/\s/g, "").includes("url");

        if (!hasInvisibleLayer && styleValue && styleValue.backgroundColor?.includes("rgb") && !styleValue.background?.includes("gradient") && !styleValue.backgroundImage?.includes("gradient")) hasInvisibleLayer = styleValue.backgroundColor?.replace(/\s/g, "")?.includes("rgba(0,0,0,0)");

        if (!hasInvisibleLayer && styleValue && styleValue["background-color"]?.includes("rgb") && !styleValue["background"]?.includes("gradient") && !styleValue["background-image"]?.includes("gradient") && !styleValue["background-image"]?.includes("url"))
            hasInvisibleLayer = styleValue["background-color"]?.replace(/\s/g, "")?.includes("rgba(0,0,0,0)");

        if (hasInvisibleLayer && styleValue?.["border-color"]?.includes("rgb")) hasInvisibleLayer = styleValue["border-color"]?.replace(/\s/g, "")?.includes("rgba(0,0,0,0)");

        if (hasInvisibleLayer && styleValue?.["outline-color"]?.includes("rgb")) hasInvisibleLayer = styleValue["border-color"]?.replace(/\s/g, "")?.includes("rgba(0,0,0,0)");

        let isCorrectImage = (objData.type == "image" && objData.path && objData.src != "" && objData.src != "none") || objData.type == "video";
        if (hasInvisibleLayer && isCorrectImage) hasInvisibleLayer = false;

        let hasEmptyOutline = (styleValue && styleValue["outline-width"] == "0px") || (styleValue && !styleValue["outline-width"]);
        let hasEmptyBorder = (styleValue && styleValue["border-width"] == "0px") || (styleValue && !styleValue["border-width"]);
        let hasEmptyShadow = (styleValue && styleValue["box-shadow"] == "none") || (styleValue && !styleValue["box-shadow"]);

        if (hasEmptyShadow && objData.shadow && objData.shadow != "" && objData.shadow != "none") hasEmptyShadow = false;

        let hasDiaplayNone = styleValue && styleValue.display && styleValue.display.includes("none");

        if ((hasInvisibleLayer && hasEmptyBorder && hasEmptyOutline && hasEmptyShadow) || hasDiaplayNone || !hasProperCoords) return;
        arrElements.push(objData);
    }
};

function DataFormatUtil() {
    var STR_CURRENY = "\\$|\\xA2-\\xA5\\u058F\\u060B\\u09F2\\u09F3\\u09FB\\u0AF1\\u0BF9\\u0E3F\\u17DB\\u20A0-\\u20BD\\uA838\\uFDFC\\uFE69\\uFF04\\uFFE0\\uFFE1";
    var STR_CURRENY_SYSTEM = "million|mn|m|billion|bn|b|trillion|tn|t|thousand|k";
    var STR_REGEX_MONTH = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|(nov|dec)(?:ember)?)";
    var STR_REGEX_DAYS = "((mon|tues|wed(nes)?|thur(s)?|fri|sat(ur)?|sun)(day)?)";
    var STR_REGEX_YEAR = "(([1-3]{1}[0-9]{1})\\d{2}|(')?([0-9][0-9]))";
    var STR_REGEX_SEPERATOR = "(\\s)?(\\s|\\-|,|\\.|=)?(\\s)?";
    var STR_REGEX_EARNINGS = "((q|quarter)(\\s)?[1-9]|[1-9])";
    var STR_REGEX_MONTH_DATE = "(" + STR_REGEX_MONTH + "(\\s|,|\\-)?([0-9]|[0-3][0-9])\\b)";
    var STR_REGEX_DATE_MONTH = "(([0-9]|[0-3][0-9])(\\s|,|\\-)?" + STR_REGEX_MONTH + ")";
    var STR_REGEX_SIMPLE_DATE = "([1-3]{1}[0-9]{1})" + STR_REGEX_SEPERATOR + "(1[0-2]|[0-9]|0[1-9])" + STR_REGEX_SEPERATOR + "\\b(([1-3]{1}[0-9]{1})?\\d{2})\\b$";
    var STR_REGEX_SIMPLE_DATE_YEAR = "\\b(([1-3]{1}[0-9]{1})?\\d{2})\\b" + STR_REGEX_SEPERATOR + "([1-3]{1}[0-9]{1})" + STR_REGEX_SEPERATOR + "(1[0-2]|[0-9]|0[1-9])$";

    let monthRegEX = new RegExp("\\b^" + STR_REGEX_MONTH + "\\b", "i");
    let datMonthRegEX = new RegExp("\\b" + STR_REGEX_DATE_MONTH + "\\b", "i");
    let simeplDateRegEX = new RegExp(STR_REGEX_SIMPLE_DATE, "i");
    let simeplDateRegEXYearStart = new RegExp(STR_REGEX_SIMPLE_DATE_YEAR, "i");
    let updateDateFormat = new RegExp(
        "^(((3[01]|[12][0-9]|[1-9]|0[1-9])[/-\\s])?(\\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|(nov|dec)(?:ember)?)\\b)([/-\\s]([1-3]{1}[0-9]{1})\\d{2})?)|((3[01]|[12][0-9]|[1-9]|0[1-9])[/-\\s](1[0-2]|[0-9]|0[1-9])[/-\\s]\\b([1-3]{1}[0-9]{1})\\d{2}\\b)$",
        "ig",
    );
    let yearFormat = new RegExp("^\\b([1-3]{1}[0-9]{1})\\d{2}|([0-9][0-9])\\b", "g");

    let daysRegEX = new RegExp(STR_REGEX_DAYS, "i");
    let erningRegEX = new RegExp(STR_REGEX_EARNINGS, "i");
    let monthDateRegEX = new RegExp(STR_REGEX_MONTH_DATE, "i");
    let yearMonthDateYearRegEX = new RegExp("^(" + STR_REGEX_DAYS + "(\\-|,|\\s)(\\s)?" + STR_REGEX_MONTH_DATE + STR_REGEX_SEPERATOR + STR_REGEX_YEAR + "\\b)", "i");
    let monthYearRegEX = new RegExp("^(" + STR_REGEX_MONTH + STR_REGEX_SEPERATOR + STR_REGEX_YEAR + "\\b)", "i");
    let monthDateYearRegEX = new RegExp("^(" + STR_REGEX_MONTH_DATE + STR_REGEX_SEPERATOR + STR_REGEX_YEAR + "\\b)", "i");
    let earningYearRegEX = new RegExp("^(" + STR_REGEX_EARNINGS + STR_REGEX_SEPERATOR + STR_REGEX_YEAR + "\\b)", "i");

    function getNumberForMonth(month) {
        let numMonth = "janfebmaraprmayjunjulaugsepoctnovdec".indexOf(month.toLowerCase()) / 3 + 1;
        return numMonth < 10 ? "0" + numMonth : numMonth + "";
    }

    DataFormatUtil.prototype.checkValueInString = function (strValue) {
        let checkValue = new RegExp("(\\s|^)([" + STR_CURRENY + "\\%])?\\s?\\d+\\s?([" + STR_CURRENY + "\\%])?\\s", "gi");
        return strValue.match(checkValue);
    };

    DataFormatUtil.prototype.checkDate = function (strValue) {
        let boolDate = updateDateFormat.test(strValue.toLowerCase());
        let boolYear = yearFormat.test(strValue.toLowerCase());
        let type = boolDate || boolYear;
        if (type) {
            let format = boolDate ? updateDateFormat : yearFormat;
            let arrMatch = strValue.match(format);
            if (arrMatch && arrMatch.length > 0) {
                return boolYear ? (arrMatch[0].length == 4 ? arrMatch[0] : "") : arrMatch[0];
            }
        } else {
            return "";
        }
    };

    DataFormatUtil.prototype.format = function (arrInput, callBack) {
        //let arrInput = [strDate];
        let arrUpdated = [];
        let arrUpdatedShort = [];
        let forceShot = true;
        let process = false;
        if (arrInput.length > 0) {
            for (var i = 0; i < arrInput.length; i++) {
                let strValue = arrInput[i];
                let shortValue = strValue;
                if (yearMonthDateYearRegEX.test(strValue.toLowerCase())) {
                    process = true;
                    let year = strValue
                        .toLowerCase()
                        .replace(monthDateRegEX, "")
                        .replace(/[^0-9]/g, "");
                    let day = strValue
                        .replace(year, "")
                        .replace(monthRegEX, "")
                        .replace(/[^a-zA-Z]/g, "");

                    let monthMatch = strValue.match(new RegExp(STR_REGEX_MONTH, "ig"));
                    let month = monthMatch && monthMatch.length > 0 ? monthMatch[0] : strValue;

                    let monthSmall = month.substring(0, Math.min(3, month.length));
                    let value = strValue
                        .replace(monthRegEX, "")
                        .replace(year, "")
                        .replace(day, "")
                        .replace(/[^0-9]/g, "");
                    value = value.length == 1 ? "0" + value : value;
                    day = day.substring(0, Math.min(3, day.length));
                    strValue = day + ", " + value + "-" + monthSmall + "-" + (year.length > 2 ? year.substring(year.length - 2, year.length) : year);
                    shortValue = i == 0 && !forceShot ? strValue : day + ", " + value + "-" + getNumberForMonth(monthSmall) + "-" + (year.length > 2 ? year.substring(year.length - 2, year.length) : year);
                } else if (monthDateYearRegEX.test(strValue.toLowerCase())) {
                    process = true;
                    let year = strValue.toLowerCase().replace(monthDateRegEX, "");
                    let month = strValue.replace(year, "").replace(/[^a-zA-Z]/g, "");
                    let monthSmall = month.substring(0, Math.min(3, month.length));
                    let value = strValue
                        .replace(monthRegEX, "")
                        .replace(year, "")
                        .replace(/[^0-9]/g, "");
                    value = value.length == 1 ? "0" + value : value;

                    strValue = value + "-" + monthSmall + "-" + (year.length > 2 ? year.substring(year.length - 2, year.length) : year);
                    shortValue = i == 0 && !forceShot ? strValue : value + "-" + getNumberForMonth(monthSmall) + "-" + (year.length > 2 ? year.substring(year.length - 2, year.length) : year);
                } else if (earningYearRegEX.test(strValue)) {
                    process = true;
                    let year = strValue.toLowerCase().replace(erningRegEX, "");
                    let value = strValue
                        .replace(/quarter|Quarter|q|Q/, "")
                        .replace(year, "")
                        .replace(/[^0-9]/g, "");
                    strValue = "Q" + value + " '" + (year.length > 2 ? year.substring(year.length - 2, year.length) : year);
                    shortValue = strValue;
                } else if (monthYearRegEX.test(strValue)) {
                    process = true;
                    let year = strValue.replace(monthRegEX, "");
                    let month = strValue.replace(year, "").replace(/[^a-zA-Z]/g, "");
                    let monthSmall = month.substring(0, Math.min(3, month.length));
                    year = year.replace(/[^0-9]/g, "");
                    strValue = monthSmall + "-" + (year.length > 2 ? year.substring(year.length - 2, year.length) : year);
                    shortValue = i == 0 && !forceShot ? strValue : month.substring(0, Math.min(1, month.length));
                    shortValue = shortValue + "-" + (year.length > 2 ? year.substring(year.length - 2, year.length) : year);
                } else if (datMonthRegEX.test(strValue)) {
                    process = true;
                    let month = strValue.replace(/[^a-zA-Z]/g, "");
                    let monthSmall = month.substring(0, Math.min(3, month.length));
                    let value = strValue.replace(monthRegEX, "").replace(/[^0-9]/g, "");
                    strValue = value + "-" + monthSmall;
                    shortValue = strValue;
                } else if (monthRegEX.test(strValue)) {
                    process = true;
                    strValue = strValue.substring(0, Math.min(3, strValue.length));
                    shortValue = i == 0 && !forceShot ? strValue : strValue.substring(0, Math.min(1, strValue.length));
                } else if (daysRegEX.test(strValue)) {
                    process = true;
                    strValue = strValue.replace(/day|Day|DAY/, "");
                    shortValue = i == 0 && !forceShot ? strValue : strValue.substring(0, Math.min(1, strValue.length));
                } else if (simeplDateRegEX.test(strValue) || simeplDateRegEXYearStart.test(strValue)) {
                    process = true;
                    let isYearEnd = !simeplDateRegEXYearStart.test(strValue);
                    let arrSplit = strValue.split(/(\-|\s)/);
                    let arrDateData = [];
                    for (let d1 = 0; d1 < arrSplit.length; d1++) {
                        if (arrSplit[d1].replace(/(\-|\s)/g, "") != "") {
                            arrDateData.push(parseInt(arrSplit[d1]));
                        }
                    }
                    let year = isYearEnd ? arrDateData[arrDateData.length - 1] : arrDateData[0];
                    let month = arrDateData[1] - 1;
                    let day = !isYearEnd ? arrDateData[arrDateData.length - 1] : arrDateData[0];

                    const date = new Date(year, month, day); // 2009-11-10
                    const monthPrint = date.toLocaleString("en-us", { month: "long" });

                    strValue = day + " " + monthPrint + " " + year;
                    shortValue = strValue;
                }

                arrUpdated.push(strValue);
                arrUpdatedShort.push(shortValue);
            }
        }
        let result = { normal: arrInput, full: arrUpdated, short: arrUpdatedShort, processed: process };
        if (callBack) callBack(result);
        else return result;
    };

    DataFormatUtil.prototype.formatString = function (strData, callBack) {
        let ogData = strData;
        let bracketRegEX = new RegExp("\\(([^)]+)\\)", "g");
        let onlyBracket = strData.match(bracketRegEX, "g");
        let withOutBracket = strData.replace(bracketRegEX, "");
        var currency = "(" + STR_CURRENY_SYSTEM + "|" + STR_CURRENY + ")|(\brs|inr|usd\b)";
        var STR_REGEX_DAYS = "(\\s)(\\(?)(" + currency + "\\s?)?([0-9]+((\\.|,)[0-9]{1,6})?)(\\s?" + currency + "?)%?(\\))?(\\s+)?\\b";
        let currencyRegEX = new RegExp(STR_REGEX_DAYS, "gmi");

        let mainValue = [];
        let valueFromBracket = false;
        let bracketValue = [];

        if (onlyBracket && onlyBracket.length > 0) {
            let bracketRemoved = onlyBracket[0].replace(/\(|\)/g, "");
            if (currencyRegEX.test(bracketRemoved)) {
                bracketValue = bracketRemoved.match(currencyRegEX);
            }
        }

        if (currencyRegEX.test(withOutBracket) || currencyRegEX.test(" " + withOutBracket)) {
            let value = withOutBracket.match(currencyRegEX);
            mainValue = value ? value : (" " + withOutBracket).match(currencyRegEX);
        } else {
            valueFromBracket = true;
            mainValue = bracketValue;
        }

        let result = {};
        if (mainValue && mainValue.length > 0) {
            result.value = mainValue[0];
            result.input = mainValue[0];
            result.valueFromBracket = valueFromBracket;
            result.bracket = onlyBracket;
            result.bracketValue = bracketValue.length > 0 ? bracketValue[0] : "";
            this.formatCurrency(result);
        } else {
            result.value = "";
            result.valueFromBracket = false;
            result.bracket = "";
            result.bracketValue = "";
        }
        result.input = ogData;
        result.date = this.checkDate(ogData);

        if (callBack) callBack(result);
        else return result;
    };

    //Get the string and check its has valid number with decimal , if has any suffix like currecny system is there like million normalize the value and add the currecny system
    //if suffix is like user use same value in normlize and add suffix

    //All will work with decimal too

    //$ 10 Users -- Normalize ==> 10 --> currecny--> $ --> suffix ---> users
    //$ 10 K -- Normalize ==> 10000 --> currecny--> $ --> suffix ---> K --> Currency system -> k
    //10 -- Normalize ==> 10 --> currecny--> "" --> suffix ---> "" --> Currency system -> ""
    //somedata 10 K -- Normalize ==> 10000 --> currecny--> k --> suffix ---> "k" --> Currency system -> ""  prefix -> somedata
    //1sdfs12 -> invalis try to give 12(big number) as normalize

    //"dfadsf asdfas 43.4.5 $%#$%#".split(/[^0-9\.]+/)

    DataFormatUtil.prototype.formatCurrency = function (formatDetection, callBack) {
        let symbols = "[" + STR_CURRENY + "]|(\brs|inr|usd\b)";
        let currencyShort = "(" + STR_CURRENY_SYSTEM + ")\\b";
        let currencySuffix = "(((\\d)|(\\s)|(\\b))(" + STR_CURRENY_SYSTEM + "))\\b";

        let strData = formatDetection.input;
        let isInvalidData = formatDetection?.invalidData || false;

        //^(0|[1-9]\d*)(\.\d+)?$

        let regExCurrencySystem = new RegExp(currencyShort, "gmi");
        let regExCurrencySymbol = new RegExp(symbols, "gmi");
        let regExCurrencySuffix = new RegExp(currencySuffix, "gmi");

        let arrMatchValue = strData.match(/((\d+|\d)(\.|\,)?(\d+|\d)?)/g);
        if (isInvalidData) {
            arrMatchValue = strData.match(/\d+/g);
        }
        let isValidData = arrMatchValue?.length == 1;
        if (arrMatchValue && !isNaN(parseFloat(arrMatchValue[0].replace(/\,/g, ""))) && arrMatchValue.length > 1) {
            // Multiple numbers matched. Instead of concatenating them (which turned a
            // range like "15-20" into "1520" — no longer a substring of the input, so the
            // prefix/suffix split below failed and validData fell through to false), take
            // the substring spanning from the first to the last number. This keeps ranges
            // ("15-20stores" -> value "15-20", suffix "stores") and grouped numbers
            // ("1,234,567") intact as real substrings of the original input.
            let firstTok = arrMatchValue[0];
            let lastTok = arrMatchValue[arrMatchValue.length - 1];
            let start = strData.indexOf(firstTok);
            let end = start !== -1 ? strData.lastIndexOf(lastTok) + lastTok.length : -1;
            let span = end > start ? strData.slice(start, end) : "";
            // Only merge into a single value when what sits between the numbers is a
            // range/separator (dash, en/em dash, slash, tilde, comma, whitespace, "to") —
            // not arbitrary words, so genuinely unrelated numbers ("5 cats 3 dogs") stay invalid.
            if (span && /^(?:[\d.,\s\-–—\/~]|to)+$/i.test(span)) {
                arrMatchValue = [span];
                isValidData = true;
            } else {
                isValidData = false;
            }
        }
        if (arrMatchValue && arrMatchValue.length > 0 && !isNaN(parseFloat(arrMatchValue[0].replace(/\,/g, ""))) && isValidData) {
            // Split prefix/suffix on the ORIGINAL matched token (including any leading zeros)
            // so a value like "$08" splits as ["$", ""] instead of ["$0", ""] and the digit
            // stays after the currency symbol.
            let matchedToken = arrMatchValue[0];
            // Strip leading zeros only from the numeric value used for computation/display.
            let normalizedValue = /^0[0-9]+$/.test(arrMatchValue[0]) ? arrMatchValue[0].replace(/^0+/, "") : arrMatchValue[0];
            let currencyValue = normalizedValue.replace(/,/g, "");
            let arrPrefixSuffix = strData.includes(matchedToken) ? strData.split(matchedToken) : isInvalidData ? ["", ""] : [];
            if (arrPrefixSuffix.length > 0) {
                formatDetection.validData = true;
                let strSuffix = "";
                if (arrPrefixSuffix.length > 1) {
                    strSuffix = arrPrefixSuffix[1];
                }

                let valueData = this.currencyValuetoCurrencySystem(currencyValue);
                formatDetection.valueSystemDecimal = valueData.value.toFixed(2);
                formatDetection.valueSystem = valueData.value;
                formatDetection.currencySystem = valueData.currency;
                formatDetection.currencySystemShort = valueData.currency;
                formatDetection.prefix = "";
                formatDetection.suffix = "";
                formatDetection.currencysymbol = "";
                formatDetection.value = currencyValue;
                formatDetection.currencyValueNormalized = currencyValue;

                let validateCurrencySymbol = regExCurrencySymbol.test(strData);
                let validateCurrencySystem = regExCurrencySuffix.test(strSuffix);
                if (validateCurrencySystem) {
                    formatDetection.iscurrency = true;
                    formatDetection.currencySystem = strSuffix.match(regExCurrencySystem)[0];
                    formatDetection.currencySystemShort = this.shortFormCurrencySystem(formatDetection.currencySystem);
                    let valuePrefix = arrPrefixSuffix[1].split(formatDetection.currencySystem);
                    formatDetection.suffix = valuePrefix.length > 1 ? valuePrefix[1] : "";
                    formatDetection.currencyValueNormalized = currencyValue * this.convertWordToNumber(formatDetection.currencySystem);
                    formatDetection.currencyValueString = this.convertNumberToWords(formatDetection.currencyValueNormalized);
                } else if (strSuffix != "") {
                    formatDetection.suffix = arrPrefixSuffix[1];
                }

                if (validateCurrencySymbol) {
                    formatDetection.currencysymbol = strData.match(regExCurrencySymbol)[0];
                    formatDetection.prefix = arrPrefixSuffix[0];
                } else if (arrPrefixSuffix && arrPrefixSuffix.length > 0) {
                    formatDetection.prefix = arrPrefixSuffix[0];
                }

                formatDetection.prefix = formatDetection.prefix.replace(formatDetection.currencysymbol, "");
                formatDetection.prefix = formatDetection.prefix.replace(currencyValue, "");
                formatDetection.suffix = formatDetection.suffix.replace(currencyValue, "");
                formatDetection.suffix = formatDetection.suffix.replace(formatDetection.currencysymbol, "");

                // Apply negative sign from prefix to all numeric values (handles "-$1.8M", "-1.8M", etc.)
                if (formatDetection?.prefix?.trim()?.startsWith("-") && formatDetection?.valueSystem) {
                    formatDetection.valueSystem = -1 * Math.abs(formatDetection?.valueSystem);
                    formatDetection.valueSystemDecimal = formatDetection?.valueSystem?.toFixed(2);
                    formatDetection.value = formatDetection?.value?.indexOf("-") === -1 ? "-" + formatDetection?.value : formatDetection?.value;
                    formatDetection.currencyValueNormalized = -1 * Math.abs(formatDetection?.currencyValueNormalized || 0);
                    if (formatDetection?.currencyValueString) {
                        formatDetection.currencyValueString = "Minus " + formatDetection?.currencyValueString;
                    }
                }
            } else {
                formatDetection.validData = false;
            }
        } else {
            formatDetection.validData = false;
        }
        return formatDetection;
    };

    DataFormatUtil.prototype.convertNumberToWords = function (amountValue, callBack) {
        let amount = amountValue < 0 ? -1 * amountValue : amountValue;
        var words = new Array();
        words[0] = "";
        words[1] = "One";
        words[2] = "Two";
        words[3] = "Three";
        words[4] = "Four";
        words[5] = "Five";
        words[6] = "Six";
        words[7] = "Seven";
        words[8] = "Eight";
        words[9] = "Nine";
        words[10] = "Ten";
        words[11] = "Eleven";
        words[12] = "Twelve";
        words[13] = "Thirteen";
        words[14] = "Fourteen";
        words[15] = "Fifteen";
        words[16] = "Sixteen";
        words[17] = "Seventeen";
        words[18] = "Eighteen";
        words[19] = "Nineteen";
        words[20] = "Twenty";
        words[30] = "Thirty";
        words[40] = "Forty";
        words[50] = "Fifty";
        words[60] = "Sixty";
        words[70] = "Seventy";
        words[80] = "Eighty";
        words[90] = "Ninety";
        amount = amount.toString();
        var atemp = amount.split(".");
        var number = atemp[0].split(",").join("");
        var n_length = number.length;
        var words_string = "";
        if (n_length <= 9) {
            var n_array = new Array(0, 0, 0, 0, 0, 0, 0, 0, 0);
            var received_n_array = new Array();
            for (var i = 0; i < n_length; i++) {
                received_n_array[i] = number.substr(i, 1);
            }
            for (var i = 9 - n_length, j = 0; i < 9; i++, j++) {
                n_array[i] = received_n_array[j];
            }
            for (var i = 0, j = 1; i < 9; i++, j++) {
                if (i == 0 || i == 2 || i == 4 || i == 7) {
                    if (n_array[i] == 1) {
                        n_array[j] = 10 + parseInt(n_array[j]);
                        n_array[i] = 0;
                    }
                }
            }
            let value = "";
            for (var i = 0; i < 9; i++) {
                if (i == 0 || i == 2 || i == 4 || i == 7) {
                    value = n_array[i] * 10;
                } else {
                    value = n_array[i];
                }
                if (value != 0) {
                    words_string += words[value] + " ";
                }
                if ((i == 1 && value != 0) || (i == 0 && value != 0 && n_array[i + 1] == 0)) {
                    words_string += "Crores ";
                }
                if ((i == 3 && value != 0) || (i == 2 && value != 0 && n_array[i + 1] == 0)) {
                    words_string += "Lakhs ";
                }
                if ((i == 5 && value != 0) || (i == 4 && value != 0 && n_array[i + 1] == 0)) {
                    words_string += "Thousand ";
                }
                if (i == 6 && value != 0 && n_array[i + 1] != 0 && n_array[i + 2] != 0) {
                    words_string += "Hundred and ";
                } else if (i == 6 && value != 0) {
                    words_string += "Hundred ";
                }
            }
            words_string = words_string.split("  ").join(" ");
        }
        return words_string;
    };

    DataFormatUtil.prototype.currencyValuetoCurrencySystem = function (value) {
        let absValue = Math.abs(Number(value));
        if (absValue >= 1.0e9) {
            return { value: absValue / 1.0e9, currency: this.shortFormCurrencySystem("b") };
        } else if (absValue >= 1.0e6) {
            return { value: absValue / 1.0e6, currency: this.shortFormCurrencySystem("m") };
        } else if (absValue >= 1.0e3) {
            return { value: absValue / 1.0e3, currency: this.shortFormCurrencySystem("k") };
        } else {
            return { value: absValue, currency: "" };
        }
    };

    DataFormatUtil.prototype.convertWordToNumber = function (strData) {
        if (/\bmillion|mn|m\b/i.test(strData)) {
            return 1000000;
        } else if (/\bbillion|bn|b\b/i.test(strData)) {
            return 1000000000;
        } else if (/\btrillion|tn|t\b/i.test(strData)) {
            return 1000000000000;
        } else if (/\bthousand|k\b/i.test(strData)) {
            return 1000;
        }
        return 1;
    };

    DataFormatUtil.prototype.shortFormCurrencySystem = function (strData) {
        if (/\bmillion|mn|m\b/i.test(strData)) {
            return "Mn";
        } else if (/\bbillion|bn|b\b/i.test(strData)) {
            return "Bn";
        } else if (/\btrillion|tn|t\b/i.test(strData)) {
            return "Tn";
        } else if (/\bcrores|k\b/i.test(strData)) {
            return "K";
        } else if (/\blakh|lakhs|l|lks|lh\b/i.test(strData)) {
            return "L";
        }
        return 1;
    };
}

/**
 * Author:    Bala Krishnan K
 * Created:   17.11.2023
 *
 * (c) Copyright by Gs.
 **/

"use strict";

function AISearchUtils() {}

AISearchUtils.prototype.constructor = AISearchUtils;

// In-flight XHR registry — lets the editor abort pending searches on unmount/navigate
// so late responses cannot mutate a torn-down DocumentStore (which triggers the
// "doc creation error" popup) or call setState on unmounted diagram components.
AISearchUtils._pending = new Set();

AISearchUtils.cancelAllPending = function () {
    AISearchUtils._pending.forEach((xhr) => {
        try { xhr.abort(); } catch (e) {}
    });
    AISearchUtils._pending.clear();
};

// ---- NEW client API (presentation-services) --------------------------------
// Replaces the legacy /docs/getSingleIconOrImage endpoint entirely:
// GET {clientApiBase}workspaces/{id}/asset-search/{kind}
// (?q=<text>&q=<text2>…&style=<iconstyle> | &img_type=<bg|nodes|coverpage>).
// Cookie-authed and same-origin (the dev proxy forwards /api/client/v1). The
// workspace id comes from objSearch.workspaceid (per call) or the
// AISearchUtils.workspaceID static the app sets at editor boot — bundle callers
// (react-charts-lib) don't pass one and rely on the static. No id → the search
// fails through searchFailureCallBack; there is no legacy fallback anymore.
AISearchUtils.clientApiBase = "/api/client/v1/";
AISearchUtils.workspaceID = "";

AISearchUtils._KIND_BY_TYPE = { icon: "icons", image: "images", logo: "logos", illustration: "illustrations" };

// ---- Result count ----------------------------------------------------------
// Non-image kinds consume exactly ONE asset per keyword, so they ask for limit=1 —
// smaller payloads, less upstream work than the server default (25). Image searches
// ask for a short candidate list instead (AI_SEARCH_LIMIT_MIN … MAX, growing with the
// deck's slide count and the batch size) so pickTrackedItem can hand every slide a
// picture no other slide already shows. AI-search only; the browse/asset-picker
// searches keep their own page sizes. Ignored by kinds whose route has no limit
// param (logos/people/flags).
AISearchUtils.AI_SEARCH_LIMIT = 1;
AISearchUtils.AI_SEARCH_LIMIT_MIN = 5;
AISearchUtils.AI_SEARCH_LIMIT_MAX = 25;
// Host hook: () => number of slides in the open deck (EditorScreen wires DocumentStore.getCount).
AISearchUtils.getSlideCount = null;

AISearchUtils.getKind = function (objSearch) {
    return AISearchUtils._KIND_BY_TYPE[objSearch?.type] || objSearch?.type || "";
};

// Kinds whose picks are tracked per slide so one url is not reused across slides.
AISearchUtils.TRACKED_KINDS = ["images"];

AISearchUtils.isTrackedKind = function (objSearch) {
    return AISearchUtils.TRACKED_KINDS.indexOf(AISearchUtils.getKind(objSearch)) >= 0;
};

AISearchUtils.getAiSearchLimit = function (objSearch) {
    if (!AISearchUtils.isTrackedKind(objSearch)) return AISearchUtils.AI_SEARCH_LIMIT;
    let nSlides = 0;
    try {
        nSlides = Number(AISearchUtils.getSlideCount?.()) || 0;
    } catch (e) {}
    let nTexts = (objSearch?.text || []).length;
    return Math.min(AISearchUtils.AI_SEARCH_LIMIT_MAX, Math.max(AISearchUtils.AI_SEARCH_LIMIT_MIN, nSlides, nTexts));
};

// ---- Per-deck asset usage ---------------------------------------------------
// url → Set(owner). Owner is "slide:<id>" when the caller passes objSearch.slideid
// (or flags a rendered picture via markSlideAsset); callers without a slide id are
// keyed by their request signature so a re-render of the same caller still lands on
// its earlier picks. The host resets the registry per deck (EditorScreen).
AISearchUtils._usedAssets = new Map();

AISearchUtils.resetAssetUsage = function () {
    AISearchUtils._usedAssets.clear();
};

AISearchUtils.getAssetOwners = function (strUrl) {
    return AISearchUtils._usedAssets.get(strUrl) || null;
};

// Inline pictures (data:/blob:) never come back from a search, and a base64 key
// would pin megabytes in the registry — only http(s)/path urls are tracked.
AISearchUtils.isTrackableUrl = function (strUrl) {
    return typeof strUrl == "string" && strUrl != "" && !/^(data|blob):/i.test(strUrl);
};

AISearchUtils.markAssetUsed = function (strUrl, strOwner) {
    if (!AISearchUtils.isTrackableUrl(strUrl) || !strOwner) return;
    let setOwners = AISearchUtils._usedAssets.get(strUrl);
    if (!setOwners) {
        setOwners = new Set();
        AISearchUtils._usedAssets.set(strUrl, setOwners);
    }
    setOwners.add(strOwner);
};

AISearchUtils.unmarkAssetUsed = function (strUrl, strOwner) {
    let setOwners = AISearchUtils._usedAssets.get(strUrl);
    if (!setOwners || !strOwner) return;
    setOwners.delete(strOwner);
    if (setOwners.size == 0) AISearchUtils._usedAssets.delete(strUrl);
};

// Flag a picture a slide already shows (saved, imported or searched) under that slide.
AISearchUtils.markSlideAsset = function (strUrl, strSlideId) {
    if (strSlideId) AISearchUtils.markAssetUsed(strUrl, "slide:" + strSlideId);
};

// A slide stopped showing a picture (replaced) — free it for the other slides.
AISearchUtils.unmarkSlideAsset = function (strUrl, strSlideId) {
    if (strSlideId) AISearchUtils.unmarkAssetUsed(strUrl, "slide:" + strSlideId);
};

// A slide is gone — free everything it owned.
AISearchUtils.releaseSlideAssets = function (strSlideId) {
    if (!strSlideId) return;
    let strOwner = "slide:" + strSlideId;
    Array.from(AISearchUtils._usedAssets.keys()).forEach((strUrl) => AISearchUtils.unmarkAssetUsed(strUrl, strOwner));
};

AISearchUtils.getSearchOwner = function (objSearch) {
    if (objSearch?.slideid) return "slide:" + objSearch.slideid;
    return "req:" + AISearchUtils.getKind(objSearch) + "|" + (objSearch?.imgtype || "") + "|" + (objSearch?.text || []).join("\u0001");
};

// The candidate this owner should show for one keyword: its own earlier pick (stable
// re-render), else an unused url, else the least-shared one — never a url handed out
// earlier in the same response (setBatchUrls). Only when every candidate is already
// in the batch does it fall back to the first one.
AISearchUtils.pickTrackedItem = function (arrItems, strOwner, setBatchUrls) {
    let arrAll = (arrItems || []).filter((objItem) => objItem?.url);
    let arrCandidates = arrAll.filter((objItem) => !setBatchUrls?.has(objItem.url));
    if (arrCandidates.length == 0) return arrAll[0] || null;
    let objOwn = strOwner ? arrCandidates.find((objItem) => AISearchUtils.getAssetOwners(objItem.url)?.has(strOwner)) : null;
    if (objOwn) return objOwn;
    let objBest = null;
    let nBest = Infinity;
    arrCandidates.forEach((objItem) => {
        let nOwners = AISearchUtils.getAssetOwners(objItem.url)?.size || 0;
        if (nOwners < nBest) {
            nBest = nOwners;
            objBest = objItem;
        }
    });
    return objBest;
};

AISearchUtils.buildClientSearchURL = function (strWorkspaceId, objSearch) {
    let strKind = AISearchUtils._KIND_BY_TYPE[objSearch.type] || objSearch.type;
    let arrParams = (objSearch.text || []).map((strText) => "q=" + encodeURIComponent(strText));
    arrParams.push("limit=" + AISearchUtils.getAiSearchLimit(objSearch));
    if (objSearch.imgtype) arrParams.push("img_type=" + encodeURIComponent(objSearch.imgtype));
    else if (objSearch.style) arrParams.push("style=" + encodeURIComponent(objSearch.style));
    return AISearchUtils.clientApiBase + "workspaces/" + strWorkspaceId + "/asset-search/" + strKind + "?" + arrParams.join("&");
};

// New response [{keyword, items:[…]}] → legacy {status:0, data:[one item per search
// text, positional]} that every callback expects. Items pass through as-is
// (url/width/height/focus_area/alignment); icon items also get .icon = asset name.
// Texts with no result become {status:1} placeholders to keep positions aligned.
// Tracked kinds (images) take the candidate pickTrackedItem chooses for this slide
// instead of items[0] and record it; a temp/preview search (objSearch.istemp) picks
// the same way but records nothing.
AISearchUtils.toLegacySearchResponse = function (arrResults, objSearch) {
    if (!Array.isArray(arrResults)) return arrResults; // error payload → no status:0 → failure path
    let boolTracked = AISearchUtils.isTrackedKind(objSearch);
    let strOwner = boolTracked && !objSearch.istemp ? AISearchUtils.getSearchOwner(objSearch) : null;
    let setBatchUrls = new Set();
    let arrData = (objSearch.text || []).map(function (strText, nIndex) {
        let objResult =
            arrResults.find(function (objRes) {
                return String(objRes?.keyword || "").toLowerCase() == String(strText).toLowerCase();
            }) || arrResults[nIndex];
        let objItem = boolTracked ? AISearchUtils.pickTrackedItem(objResult?.items, strOwner, setBatchUrls) : objResult?.items?.[0];
        if (!objItem || !objItem.url) return { status: 1 };
        if (boolTracked) {
            setBatchUrls.add(objItem.url);
            AISearchUtils.markAssetUsed(objItem.url, strOwner);
        }
        let objLegacy = Object.assign({ status: 0 }, objItem);
        if (String(objSearch.type || "").indexOf("icon") == 0 && !objLegacy.icon) {
            objLegacy.icon = objItem.name || String(objItem.url).split("/").pop().replace(/\.[a-z0-9]+$/i, "");
        }
        return objLegacy;
    });
    return { status: 0, msg: "success", data: arrData };
};

// One-keyword pick for callers that fetch the client API themselves
// (NetworkManager.textToImage): same tracking as a searchPrompts response.
AISearchUtils.pickAndTrackItem = function (arrItems, objSearch) {
    let objResponse = AISearchUtils.toLegacySearchResponse([{ keyword: objSearch?.text?.[0], items: arrItems || [] }], objSearch);
    let objItem = objResponse?.data?.[0];
    return objItem && objItem.status == 0 ? objItem : null;
};

// objSearch = {text: ["search text1","search text2"], type: "icon", style: "solid","imgtype":"nodes", workspaceid: "<uuid>"}
// appBaseURL is kept for signature compatibility (legacy callers pass serverURL) but is no longer used.
AISearchUtils.searchPrompts = function (appBaseURL, objSearch, searchCallBack, extraAttribs = {}, searchFailureCallBack) {
    let strWorkspaceId = objSearch.workspaceid || AISearchUtils.workspaceID;
    if (!strWorkspaceId) {
        console.log("AI Search skipped — no workspace id for the client asset-search API");
        searchFailureCallBack?.({ status: 1, msg: "missing workspace id for asset-search" });
        return null;
    }
    let strURL = AISearchUtils.buildClientSearchURL(strWorkspaceId, objSearch);

    let xhr = new XMLHttpRequest();
    AISearchUtils._pending.add(xhr);
    const cleanup = () => AISearchUtils._pending.delete(xhr);
    xhr.open("GET", strURL.trim());
    // Client API auth rides on cookies (only matters if clientApiBase is made absolute).
    xhr.withCredentials = true;
    xhr.onload = () => {
        cleanup();
        try {
            let objResponse = AISearchUtils.toLegacySearchResponse(JSON.parse(xhr.responseText), objSearch);
            if (objResponse && objResponse.status == 0) {
                AISearchUtils.setFocusAreaForImage(objResponse?.data?.[0], extraAttribs);
                searchCallBack?.(objResponse, extraAttribs, searchFailureCallBack);
            } else {
                searchFailureCallBack?.(objResponse);
            }
        } catch (e) {
            searchFailureCallBack?.(e);
            console.log("Error in Applying AI Search : " + e);
        }
    };
    xhr.onerror = (e) => {
        cleanup();
        searchFailureCallBack?.(e);
        console.log("Fetch Error in AI Search" + e);
    };
    // Aborted by cancelAllPending — swallow silently, do NOT call failure callback
    // (failure callbacks save the doc / show popups, which is what we're avoiding).
    xhr.onabort = () => cleanup();
    xhr.send();
    return xhr;
};

AISearchUtils.setFocusAreaForImage = function (objResponse, extraAttribs) {
    let currentImageNode = extraAttribs.bgNode || extraAttribs.imageNode;
    if (currentImageNode && currentImageNode.dataset.focusarea) {
        currentImageNode.removeAttribute("data-focusarea");
    }
    if (objResponse?.focus_area && Object.keys(objResponse.focus_area).length > 0) {
        let focusArea = objResponse.focus_area;
        // objResponse.width = 1500;
        // objResponse.height = 1850;
        // objResponse.url = "https://devcdn.presentations.ai/nodes/nodes32230.jpg";
        // let focusArea = {
        //     x: 93,
        //     y: 564,
        //     width: 1395,
        //     height: 913,
        // };
        // objResponse.alignment = "center";
        // objResponse.width = 1920;
        // objResponse.height = 1080;
        // objResponse.url = "https://cdn.presentations.ai/rightfullbg/rightfullbg442.jpg";
        // let focusArea = {
        //     height: 935,
        //     width: 946,
        //     x: 0,
        //     y: 145,
        // };
        // objResponse.alignment = "left";
        // objResponse.width = 1500;
        // objResponse.height = 1991;
        // objResponse.url = "https://devcdn.presentations.ai/nodes/nodes25238.jpg";
        // let focusArea = {
        //     height: 1827,
        //     width: 1166,
        //     x: 11,
        //     y: 164,
        // };
        // objResponse.alignment = "bottom";
        if (currentImageNode) {
            currentImageNode.dataset.focusarea = `${focusArea.x},${focusArea.y},${focusArea.width},${focusArea.height},${objResponse.alignment},${objResponse.width},${objResponse.height}`;
        }
    }
};
/**
 * Author:    BalaKrishnan K.
 * Created:   22.11.2023
 *
 * (c) Copyright by Gs.
 **/

"use strict";

function CommonImageUtils() {}

CommonImageUtils.updateImageBounds = function (imageNode, properties, scaleFacetor = 1) {
    if (imageNode && imageNode.parentElement) {
        let position = CommonImageUtils.getOffsetLeftTop(imageNode.parentElement);
        imageNode.setAttribute("data-x", position.x / scaleFacetor);
        imageNode.setAttribute("data-y", position.y / scaleFacetor);
        imageNode.setAttribute("data-width", imageNode.parentElement.clientWidth * scaleFacetor);
        imageNode.setAttribute("data-height", imageNode.parentElement.clientHeight * scaleFacetor);
        CommonImageUtils.updateImageReSize(imageNode, properties);
    }
};

CommonImageUtils.getOffsetLeftTop = function (imageParent, parenttype = "SLIDE") {
    let item = { x: 0, y: 0 };
    let itemParent = imageParent;
    while (itemParent && itemParent.dataset && itemParent.dataset.type != parenttype) {
        item.x = itemParent.offsetLeft + item.x;
        item.y = itemParent.offsetTop + item.y;
        itemParent = itemParent.offsetParent;
    }
    return { x: item.x, y: item.y };
};

// params - (originalImageNode, properties = { filltype="fitcanvas/fillcanvas", containerwidth = 1000px ,containerheight = 1000px ,islogofit: true/false, contenttype: "image/logo" }, callback, callbackparam)
CommonImageUtils.updateImageReSize = function (originalImageNode, properties, callback, callbackparam) {
    let imageDataSet = originalImageNode.dataset;
    if (imageDataSet && (parseInt(imageDataSet.height) == 0 || parseInt(imageDataSet.width) == 0)) return;
    if (originalImageNode.complete) CommonImageUtils.updateImageReSizeAfterLoad(originalImageNode, properties, callback, callbackparam);
    else if (originalImageNode) {
        try {
            originalImageNode.onload = function () {
                CommonImageUtils.updateImageReSizeAfterLoad(originalImageNode, properties, callback, callbackparam);
            };
            const imgSrc = originalImageNode.src;
            originalImageNode.src = imgSrc;
        } catch (error) {
            if (callback) callback(callbackparam);
        }
    }
};

// params - (originalImageNode, properties = { filltype="fitcanvas/fillcanvas", containerwidth = 1000px ,containerheight = 1000px ,islogofit: true/false, contenttype: "image/logo" }, callback, callbackparam)
CommonImageUtils.updateImageReSizeAfterLoad = function (originalImageNode, properties, callback, callbackparam) {
    let imageDataSet = originalImageNode.dataset;
    let focusArea = originalImageNode.dataset.focusarea;
    if (focusArea) {
        focusArea = focusArea.split(",");
        focusArea = {
            x: focusArea[0],
            y: focusArea[1],
            width: focusArea[2],
            height: focusArea[3],
            alignment: focusArea[4],
            originalWidth: focusArea[5],
            originalHeight: focusArea[6],
        };
    }
    if (imageDataSet && !properties?.filltype && (parseInt(imageDataSet.height) == 0 || parseInt(imageDataSet.width) == 0 || (originalImageNode.dataset.style && originalImageNode.style.cssText && originalImageNode.style.cssText != ""))) return;
    const numContainerW = properties?.containerwidth ? properties?.containerwidth : originalImageNode.parentElement ? originalImageNode.parentElement.offsetWidth : 1;
    const numContainerH = properties?.containerheight ? properties?.containerheight : originalImageNode.parentElement ? originalImageNode.parentElement.offsetHeight : 1;
    let hasLogo = properties?.contenttype == "logo" && properties?.islogofit ? properties.islogofit : "false";
    let imageFit = properties?.isimagefit;
    CommonImageUtils.resetImageStyle(originalImageNode);
    if (originalImageNode.dataset.hasinternalflip == "true") {
        originalImageNode.style.transform = "scale(1) scaleX(-1)";
    }
    if (originalImageNode.parentNode && originalImageNode.parentNode.dataset.horflipvalue) {
        originalImageNode.style.transform = "scale(1) scaleX(" + originalImageNode.parentNode.dataset.horflipvalue + ")";
    }
    let imageDimensionRatio = originalImageNode.width / originalImageNode.height;
    let canvasDimensionRatio = numContainerW / numContainerH;

    let filltype = properties?.filltype || (hasLogo != "false" || imageFit ? "fitcanvas" : "fillcanvas");
    let contentNode = originalImageNode?.parentElement?.parentElement;
    let isContentNode = contentNode && contentNode.getAttribute("name") && contentNode.getAttribute("name") == "contentNode";
    if (imageDimensionRatio < canvasDimensionRatio || (hasLogo != "false" && imageDimensionRatio == canvasDimensionRatio)) {
        if (filltype == "fitcanvas") CommonImageUtils.fitHeight(originalImageNode, numContainerW, focusArea);
        else CommonImageUtils.fitWidth(originalImageNode, numContainerH, focusArea);
    } else if (imageDimensionRatio > canvasDimensionRatio) {
        if (filltype == "fitcanvas") CommonImageUtils.fitWidth(originalImageNode, numContainerH, focusArea);
        else CommonImageUtils.fitHeight(originalImageNode, numContainerW, focusArea);
    } else {
        originalImageNode.style.cssText += `
            width: 100%;
            height: auto;
            left: 0;
            margin: unset;
            top: 0;
        `;
    }

    let imageCropAlign = focusArea ? null : properties?.graphicData?.alignment || originalImageNode?.dataset?.imagecropalignment;
    if (originalImageNode && imageCropAlign && imageCropAlign == "bottom" && hasLogo != "center") {
        originalImageNode.style.cssText += `
            top: unset;
            bottom: 0px;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "center";
            contentNode.style.alignItems = "flex-end";
        }
    }

    if (originalImageNode && imageCropAlign && imageCropAlign == "center") {
        originalImageNode.style.cssText += `
            top: 0px;
            bottom: 0px;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "center";
            contentNode.style.alignItems = "center";
        }
    }

    if (originalImageNode && imageCropAlign && imageCropAlign == "right") {
        originalImageNode.style.cssText += `
            right: 0px;
            left: unset;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "flex-end";
            contentNode.style.alignItems = "center";
        }
    }

    if (originalImageNode && imageCropAlign && imageCropAlign == "left") {
        originalImageNode.style.cssText += `
            right: unset;
            left: 0px;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "flex-start";
            contentNode.style.alignItems = "center";
        }
    }
    if (originalImageNode && imageCropAlign && imageCropAlign == "rightbottom") {
        originalImageNode.style.cssText += `
            right: 0px;
            left: unset;
            top: unset;
            bottom: 0px;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "flex-end";
            contentNode.style.alignItems = "flex-end";
        }
    }

    if (originalImageNode && imageCropAlign && imageCropAlign == "leftbottom") {
        originalImageNode.style.cssText += `
            right: unset;
            left: 0px;
            top: unset;
            bottom: 0px;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "flex-start";
            contentNode.style.alignItems = "flex-end";
        }
    }

    if (originalImageNode && imageCropAlign && imageCropAlign == "righttop") {
        originalImageNode.style.cssText += `
            right: 0px;
            left: unset;
            top: 0px;
            bottom: unset;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "flex-end";
            contentNode.style.alignItems = "flex-start";
        }
    }

    if (originalImageNode && imageCropAlign && imageCropAlign == "lefttop") {
        originalImageNode.style.cssText += `
            right: unset;
            left: 0px;
            top: 0px;
            bottom: unset;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "flex-start";
            contentNode.style.alignItems = "flex-start";
        }
    }
    if (originalImageNode && imageCropAlign && imageCropAlign == "top") {
        originalImageNode.style.cssText += `
            top: 0px;
            bottom: unset;
            margin: auto;
        `;
        if (isContentNode) {
            contentNode.style.justifyContent = "center";
            contentNode.style.alignItems = "flex-start";
        }
    }
    if (originalImageNode?.parentNode) {
        originalImageNode.parentNode.dataset.originalwidth = originalImageNode.width;
        originalImageNode.parentNode.dataset.originalheight = originalImageNode.height;
        originalImageNode.parentNode.dataset.containerwidth = numContainerW;
        originalImageNode.parentNode.dataset.containerheight = numContainerH;
    }
    if (!properties || !properties?.isSpecialgraphcis) originalImageNode?.setAttribute("data-csstext", originalImageNode.style.cssText);
    // if (focusArea) {
    //     originalImageNode.removeAttribute("data-focusarea");
    // }
    callback?.(callbackparam);
};

CommonImageUtils.fitHeight = function (originalImageNode, numContainerW, focusArea) {
    originalImageNode.style.cssText += `
        height: 100%;
        width: auto;
        margin: unset;
        top: 0;
    `;
    let originalWidth = parseInt(focusArea?.originalWidth);
    if (focusArea && Object.keys(focusArea).length > 0 && originalImageNode.width > numContainerW && originalWidth >= focusArea?.width) {
        // Calculate the scale ratio between the displayed image and original image
        const scaleRatio = originalImageNode.width / originalWidth;
        // Calculate the scaled x-coordinate
        const scaledX = focusArea.x * scaleRatio;
        // Calculate the new left position as a percentage
        if (focusArea.alignment == "right") {
            originalImageNode.style.left = (scaledX / (numContainerW / 100)) * -1 + (numContainerW - focusArea.width * scaleRatio) / (numContainerW / 100) + "%";
            // originalImageNode.style.top = (scaledY / (numContainerW / 100)) * -1 + (numContainerW - focusArea.height * scaleRatio) / (numContainerW / 100) + "%";
        } else if (focusArea.alignment == "left") {
            originalImageNode.style.left = (scaledX / (numContainerW / 100)) * -1 + "%";
            // originalImageNode.style.top = (scaledY / (numContainerW / 100)) * -1 + "%";
        } else {
            originalImageNode.style.left = (scaledX / (numContainerW / 100)) * -1 + (numContainerW - focusArea.width * scaleRatio) / 2 / (numContainerW / 100) + "%";
            // originalImageNode.style.top = (scaledY / (numContainerW / 100)) * -1 + (numContainerW - focusArea.height * scaleRatio) / 2 / (numContainerW / 100) + "%";
        }
    } else {
        originalImageNode.style.left = (numContainerW - originalImageNode.width) / 2 / (numContainerW / 100) + "%";
    }
};

CommonImageUtils.fitWidth = function (originalImageNode, numContainerH, focusArea) {
    originalImageNode.style.cssText += `
        width: 100%;
        height: auto;
        left: 0;
        margin: unset;
    `;
    let originalHeight = parseInt(focusArea?.originalHeight);
    if (focusArea && Object.keys(focusArea).length > 0 && originalImageNode.height > numContainerH && originalHeight >= focusArea?.height) {
        // Calculate the scale ratio between the displayed image and original image
        const scaleRatio = originalImageNode.height / originalHeight;
        // Calculate the scaled x-coordinate
        const scaledY = focusArea.y * scaleRatio;
        // Calculate the new left position as a percentage
        // originalImageNode.style.top = (scaledY / (numContainerH / 100)) * -1 + (numContainerH - focusArea.height * scaleRatio) / 2 / (numContainerH / 100) + "%";
        // if (focusArea.alignment == "bottom") {
        //     originalImageNode.style.top = (scaledY / (numContainerH / 100)) * -1 - numContainerH / (numContainerH / 100) + "%";
        // } else if (focusArea.alignment == "top") {
        //     originalImageNode.style.top = (scaledY / (numContainerH / 100)) * -1 + "%";
        // } else {
        //     originalImageNode.style.top = (scaledY / (numContainerH / 100)) * -1 - numContainerH / 2 / (numContainerH / 100) + "%";
        // }
        if (focusArea.alignment == "bottom") {
            originalImageNode.style.top = (scaledY / (numContainerH / 100)) * -1 + (numContainerH - focusArea.height * scaleRatio) / (numContainerH / 100) + "%";
            // originalImageNode.style.top = (scaledY / (numContainerW / 100)) * -1 + (numContainerW - focusArea.height * scaleRatio) / (numContainerW / 100) + "%";
        } else if (focusArea.alignment == "top") {
            originalImageNode.style.top = (scaledY / (numContainerH / 100)) * -1 + "%";
            // originalImageNode.style.top = (scaledY / (numContainerW / 100)) * -1 + "%";
        } else {
            originalImageNode.style.top = (scaledY / (numContainerH / 100)) * -1 + (numContainerH - focusArea.height * scaleRatio) / 2 / (numContainerH / 100) + "%";
            // originalImageNode.style.top = (scaledY / (numContainerW / 100)) * -1 + (numContainerW - focusArea.height * scaleRatio) / 2 / (numContainerW / 100) + "%";
        }
    } else {
        originalImageNode.style.top = (numContainerH - originalImageNode.height) / 2 / (numContainerH / 100) + "%";
    }
};

CommonImageUtils.resetImageStyle = function (originalImageNode) {
    originalImageNode.style.removeProperty("min-width");
    originalImageNode.style.removeProperty("min-height");
    originalImageNode.style.removeProperty("max-width");
    originalImageNode.style.removeProperty("max-height");
    originalImageNode.style.removeProperty("filter");

    originalImageNode.style.cssText += `
        width: auto;
        height: auto;
        margin: auto;
        position: absolute;
        left: unset;
        right: unset;
        top: unset;
        bottom: unset;
        x: 0;
        y: 0;
        transform: scale(1);
        object-fit: unset;
    `;
};

// Origami Image fit
CommonImageUtils.updateImageReSizeOrigami = function (imgSize, parentSize, properties = {}) {
    let holderRatio = parentSize.width / parentSize.height;
    let imageRatio = imgSize.width / imgSize.height;

    if (holderRatio > imageRatio) {
        //fit width
        let wRatio = parentSize.width / imgSize.width;
        let nWidth = imgSize.width * wRatio;
        let nHeight = imgSize.height * wRatio;
        imgSize.width = nWidth;
        imgSize.height = nHeight;
    } else if (holderRatio < imageRatio) {
        //fit height
        let hRatio = parentSize.height / imgSize.height;
        let nWidth = imgSize.width * hRatio;
        let nHeight = imgSize.height * hRatio;
        imgSize.width = nWidth;
        imgSize.height = nHeight;
    }

    const numContainerW = parentSize.width;
    const numContainerH = parentSize.height;
    let hasLogo = properties?.contenttype == "logo" && properties?.islogofit ? properties.islogofit : "false";
    let imageFit = properties?.isimagefit;

    let imageDimensionRatio = imgSize.width / imgSize.height;
    let canvasDimensionRatio = numContainerW / numContainerH;

    let filltype = properties?.filltype || (hasLogo != "false" || imageFit ? "fitcanvas" : "fillcanvas");
    if (imageDimensionRatio < canvasDimensionRatio || (hasLogo != "false" && imageDimensionRatio == canvasDimensionRatio)) {
        if (filltype == "fitcanvas") return fitHeightOrigami(imgSize, numContainerW);
        else return fitWidthOrigami(imgSize, numContainerH);
    } else if (imageDimensionRatio > canvasDimensionRatio) {
        if (filltype == "fitcanvas") return fitWidthOrigami(imgSize, numContainerH);
        else return fitHeightOrigami(imgSize, numContainerW);
    } else
        return {
            width: "100%",
            height: "100%",
            left: properties?.imgLeft || 0,
            top: properties?.imgTop || 0,
            margin: "auto",
        };

    function fitHeightOrigami(originalImageNode, numContainerW) {
        return {
            width: "auto",
            height: "100%",
            left: properties?.imgLeft || 0,
            top: properties?.imgTop || 0,
            margin: "unset",
        };
    }

    function fitWidthOrigami(originalImageNode, numContainerH) {
        return {
            width: "100%",
            height: "auto",
            left: properties?.imgLeft || 0,
            top: properties?.imgTop || 0,
            margin: "unset",
        };
    }

    function checkForImageRectInContainer(imgSize, parentSize, properties) {
        let imageScale = properties?.imgParent?.dataset?.currentscale || 1;
        let imageLeftPercent = parseFloat(properties?.imgLeft || 0);
        let imageTopPercent = parseFloat(properties?.imgTop || 0);
        let imageWidth = imgSize.width * imageScale;
        let imageHeight = imgSize.height * imageScale;
        let containerWidth = parentSize.width;
        let containerHeight = parentSize.height;

        let imageLeftInPx = (imageLeftPercent * containerWidth) / 100;
        let imageTopInPx = (imageTopPercent * containerHeight) / 100;
        let currentImageBottom = imageHeight + imageTopInPx;
        let currentImageRight = imageWidth + imageLeftInPx;
        let diffBottom = parseFloat(currentImageBottom - containerHeight).toFixed(2);
        let diffRight = parseFloat(currentImageRight - containerWidth).toFixed(2);
        console.log(`diffBottom ${diffBottom} diffRight ${diffRight}`);
        return {
            diffBottom: parseFloat(diffBottom),
            diffRight: parseFloat(diffRight),
        };
    }
};

CommonImageUtils.updateImageFitforOrigami = function (newElement, data) {
    let imageRatio = newElement.imagesize.width / newElement.imagesize.height;
    let parentRatio = data.size.width / data.size.height;

    let fittype = parentRatio > imageRatio ? "fit-width" : "fit-height";

    if (fittype == "fit-width") {
        newElement["inner-style"] = { ...newElement["inner-style"], width: "100%", height: "auto" };
    } else if (fittype == "fit-height") {
        newElement["inner-style"] = { ...newElement["inner-style"], height: "100%", width: "auto" };
    }

    const str = newElement["inner-style"].transform;
    if (!str) return;
    const regex = /scale\(([\d.]+)\)/g;
    const matches = [...str.matchAll(regex)].map((match) => match[1]);
    let imgScale = parseFloat(matches?.[0]) || 1;
    let { left, top } = newElement["inner-style"];
    let { diffBottom, diffRight } = checkForImageRectInContainer(newElement.imagesize, data.size, { imgLeft: left, imgTop: top, imgScale });
    console.log(`diffBottom ${diffBottom} diffRight ${diffRight}`);

    if (diffBottom < 0) {
        let imgTop = parseFloat(top);
        let newImgTop = imgTop + (Math.abs(diffBottom) / data.size.height) * 100;
        newElement["inner-style"] = { ...newElement["inner-style"], top: newImgTop + "%" };
    }

    if (diffRight < 0) {
        let imgLeft = parseFloat(left);
        let newImgLeft = imgLeft + (Math.abs(diffRight) / data.size.width) * 100;
        newElement["inner-style"] = { ...newElement["inner-style"], left: newImgLeft + "%" };
    }

    function checkForImageRectInContainer(imgSize, parentSize, properties) {
        let imageScale = properties?.imgScale || 1;
        let imageLeftPercent = parseFloat(properties?.imgLeft || 0);
        let imageTopPercent = parseFloat(properties?.imgTop || 0);
        let imageWidth = imgSize.width * imageScale;
        let imageHeight = imgSize.height * imageScale;
        let containerWidth = parentSize.width;
        let containerHeight = parentSize.height;

        console.log("parent size", parentSize);

        let imageLeftInPx = (imageLeftPercent * containerWidth) / 100;
        let imageTopInPx = (imageTopPercent * containerHeight) / 100;
        let currentImageBottom = imageHeight + imageTopInPx;
        let currentImageRight = imageWidth + imageLeftInPx;
        let diffBottom = parseFloat(currentImageBottom - containerHeight).toFixed(2);
        let diffRight = parseFloat(currentImageRight - containerWidth).toFixed(2);
        console.log(`diffBottom ${diffBottom} diffRight ${diffRight}`);
        return {
            diffBottom: parseFloat(diffBottom),
            diffRight: parseFloat(diffRight),
        };
    }
};

function CommonDataUtils() {}

CommonDataUtils.hexToRGB = function (hexColor) {
    if (hexColor.includes("rgb")) {
        let arrRBG = hexColor.replace("rgb(", "").replace("rgba(", "").replace(")", "").split(",");
        return arrRBG
            ? {
                  r: arrRBG[0],
                  g: arrRBG[1],
                  b: arrRBG[2],
              }
            : {};
    } else {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : {};
    }
};

CommonDataUtils.checkAppStaticUrl = function (imageURL, appStaticURL, diagramStyle) {
    return imageURL?.startsWith("http") || imageURL?.startsWith(appStaticURL) ? imageURL : appStaticURL + imageURL;
};

CommonDataUtils.uuidv4 = function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

CommonDataUtils.checkNumberFormat = function (target, parent, mooddata, nodeProps = {}, isConvertOperation = false) {
    try {
        let isNumberPlaceholder = nodeProps ? Object.keys(nodeProps).length == 0 : true;

        if (target && (target.dataset.id == "numberNode" || target.dataset.type == "value")) {
            let disableCurrencyFormat = parent.getAttribute("data-currencyformat") && parent.getAttribute("data-currencyformat") == "disable" ? false : true;
            if (!disableCurrencyFormat) {
                if (target) target.scrollTop = 0;
                return;
            }
            let str = target.textContent;
            let formatcount = parent.getAttribute("data-currencyformatcount");
            if (!formatcount && parent?.children?.length > 0) {
                // For takeaway sankar commit
                formatcount = parent?.children[0]?.getAttribute("data-currencyformatcount");
            }
            if (formatcount && parseInt(formatcount)) {
                if (str.length <= parseInt(formatcount)) return;
            }
            let gDataFormatter = eval("new " + "DataFormatUtil" + "()");
            let charcount = parent.getAttribute("data-charactercount");
            if (!charcount && parent?.children?.length > 0) {
                // For takeaway sankar commit
                charcount = parent?.children[0]?.getAttribute("data-charactercount");
            }
            if (parseInt(charcount)) {
                str = str.substr(0, parseInt(charcount));
            }
            let objFormatted = gDataFormatter.formatCurrency({ input: str });
            if (objFormatted && objFormatted.validData == false && str != "") {
                target.setAttribute("data-validdata", false);
                if (isNumberPlaceholder) target.innerText = str;
                // else target.innerHTML = str;
            } else if (str != "") {
                if (disableCurrencyFormat && objFormatted.value) {
                    CommonDataUtils.checkPrefixSuffix(target, objFormatted, mooddata, parseInt(charcount), parent.dataset.valueformat, isConvertOperation);
                } else target.innerText = str;
            }
            if (target) target.scrollTop = 0;
        }
    } catch (error) {
        console.log(error);
    }
};
CommonDataUtils.getTintVariableArrayBySlideTheme = function (count, graphicDiv = null, graphicClass = null) {
    let arrVarCount = [];
    let slideTheme = graphicDiv?.getAttribute("data-sections-color-class") || graphicClass || "";
    if (slideTheme.includes("-tint")) {
        const tintPatterns = {
            2: [1, 12],
            3: [1, 6, 12],
            4: [1, 5, 9, 12],
            5: [1, 4, 6, 9, 12],
            6: [1, 3, 5, 8, 10, 12],
            7: [1, 3, 5, 7, 9, 10, 12],
            8: [1, 3, 4, 6, 7, 9, 10, 12],
            9: [1, 3, 4, 5, 7, 8, 9, 10, 12],
            10: [1, 3, 4, 5, 6, 7, 8, 9, 10, 12],
            11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12],
            12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        };
        arrVarCount = tintPatterns[count] || [];
    } else {
        for (let i = 1; i <= count; i++) {
            arrVarCount.push(i);
        }
    }
    return arrVarCount;
};

CommonDataUtils.checkPrefixSuffix = function (target, objFormatted, mooddata, count, value = "actualnumber", isConvertOperation = false) {
    mooddata = mooddata.basicgraphics || {};
    let prefixSpecial = null;
    if (mooddata.numberprefix) prefixSpecial = mooddata.numberprefix.special;
    let prefix = TextHighLightUtils.createSpan("spanPrefix", prefixSpecial);
    let prefixStr = objFormatted.prefix + (objFormatted.currencysymbol ? objFormatted.currencysymbol : "");
    if (prefixStr && prefixStr != "") prefixStr = CommonDataUtils.removelinebreaks(prefixStr);
    let prefixObj = CommonDataUtils.checkCharCount(prefixStr, count);
    prefix.innerText = value == "currency" ? "$" : value != "percentage" ? prefixObj[0] : "";
    count = count - prefixObj[1];
    prefix.className = mooddata && mooddata.numberprefix ? mooddata.numberprefix.style : "clsSpanPrefix";

    let forceConvertActualNumber = isConvertOperation && value == "actualnumber";
    let textMain = TextHighLightUtils.createSpan("spanMainText");
    textMain.className = "clSpanMainText";
    let valueSystem = objFormatted.valueSystem != null ? (objFormatted.valueSystem % 1 != 0 ? objFormatted.valueSystem.toFixed(1) : objFormatted.valueSystem) : null;
    textMain.innerText = value == "compactdecimal" && valueSystem ? valueSystem : forceConvertActualNumber && objFormatted.currencyValueNormalized ? objFormatted.currencyValueNormalized : objFormatted.value;
    // textMain.innerText = valueSystem ? valueSystem : forceConvertActualNumber && objFormatted.currencyValueNormalized ? objFormatted.currencyValueNormalized : objFormatted.value;
    textMain.innerText = objFormatted?.input?.startsWith("-") && !textMain.textContent.startsWith("-") && !prefix.textContent.startsWith("-") ? "-" + textMain.textContent : textMain.textContent; // Add minus need to optimize it.
    let mainObj = CommonDataUtils.checkCharCount(textMain.textContent, count);
    textMain.innerText = value == "percentage" ? (parseFloat(mainObj[0]) > 100 ? 100 : parseFloat(mainObj[0])) : parseFloat(mainObj[0]).toLocaleString("en-US", { currency: "USD" });
    count = count - mainObj[1];

    let actualNumber = value == "actualnumber" && objFormatted.input.toLowerCase().endsWith(objFormatted.currencySystemShort.toLowerCase());
    // let actualNumber = value == "actualnumber";
    let suffixSpecial = null;
    if (mooddata.numbersuffix) suffixSpecial = mooddata.numbersuffix.special;
    let suffix = TextHighLightUtils.createSpan("spanSuffix", suffixSpecial);
    suffix.className = mooddata && mooddata.numbersuffix ? mooddata.numbersuffix.style : "clsSpanSuffix";
    let isTypedCurrency = objFormatted.input.includes(objFormatted.value) && objFormatted.input.includes(objFormatted.currencySystem);
    let suffixStr = ((actualNumber || value == "compactdecimal") && !forceConvertActualNumber && objFormatted.currencySystemShort ? objFormatted.currencySystemShort : isTypedCurrency && !forceConvertActualNumber ? objFormatted.currencySystem : "") + objFormatted.suffix;
    if (suffixStr && suffixStr != "") suffixStr = CommonDataUtils.removelinebreaks(suffixStr);
    let suffixObj = CommonDataUtils.checkCharCount(suffixStr, count);
    suffix.innerText = value == "percentage" ? "%" : value != "currency" ? suffixObj[0] : "";

    target.innerHTML = prefix.outerHTML + textMain.outerHTML + suffix.outerHTML;
    return textMain;
};

CommonDataUtils.checkCharCount = function (str, count) {
    if (count == null || count == undefined || isNaN(count)) return [str, count];
    if (count > 0 && str.length > 0) {
        str = str.substr(0, count);
        return [str, str.length];
    } else {
        return [str, 0];
    }
};

CommonDataUtils.removelinebreaks = function (str) {
    return str.replace(/[\r\n]+/gm, "");
};

CommonDataUtils.calcSlideScale = function (parent, appmode = "") {
    let slideContainer = parent?.parentElement?.parentElement;
    if (slideContainer) {
        if (slideContainer?.getAttribute("data-exportmode") == "true" || parent?.parentElement?.getAttribute("data-exportmode") == "true") return 1;
        let slideRect = slideContainer.getBoundingClientRect();
        let scale = 1;
        let widgetElement = document.getElementsByClassName("widgetView")?.[0];
        let widgetElementStyle = widgetElement ? window.getComputedStyle(widgetElement) : null;
        let zoom = widgetElementStyle?.zoom;
        if (widgetElement && appmode.toLowerCase() == "present") scale = widgetElementStyle?.transform;
        else scale = window.getComputedStyle(parent.parentElement.parentElement).transform;
        if (scale && scale != "" && scale != "none") {
            return Number(scale.substring(7, scale.indexOf(",")));
        } else if (zoom && zoom != "" && zoom != "none" && slideRect.width == 0) {
            let intScale = zoom;
            intScale = intScale.split("%")[0];
            intScale = intScale ? intScale : 1;
            return intScale;
        } else {
            let slideRect = slideContainer.getBoundingClientRect();
            // console.log("slideWidth diagramresizeutil", DiagramResizeUtils.slideWidth);
            return Math.min(slideRect.width / 1920, slideRect.height / 1080);
        }
    } else return 1;
};

CommonDataUtils.createMicroNode = function (parentNode, objMicro = {}) {
    let content = objMicro.content || {};
    let name = objMicro.name || "microChartHolder";
    let holdertype = objMicro.holdertype || "primary";
    let nodeObj = objMicro.nodeObj || {};
    let index = objMicro.index || 0;
    let microchartFontSize = objMicro.microchartFontSize || "n1";
    let microStyle = objMicro.microStyle || "clsGradientMicro";
    let innerStroke = objMicro.innerStroke || "clsAccentStroke";
    let globalMoodData = objMicro.globalMoodData || {};
    let globalStyle = objMicro.globalStyle || "";
    let dataAnimation = objMicro.dataAnimation || "valuetext";
    let diagramParent = objMicro.diagramParent || null;
    if (parentNode.getAttribute("name") != "nodeGroup") parentNode.setAttribute("data-content-type", "microchart");
    let contentParentNode = document.createElement("div");
    contentParentNode.className = "cls" + name + " " + globalStyle;
    CommonDataUtils.assignAttributes(contentParentNode, {
        name: name,
        "data-dck-selector": true,
        "data-node-content-type": "microchart",
        "data-content-type": "microchart",
        "data-type": "contentmicrochartparent",
        "data-id": "contentmicrochartparent",
        "data-holder-type": holdertype,
        id: name + index,
        "data-index": index,
    });
    parentNode.appendChild(contentParentNode);
    CommonDataUtils.addClassesFromMenu(nodeObj.objClass, contentParentNode);
    let nodeParent = document.createElement("div");
    nodeParent.className = "clsMicroChartBg";
    nodeParent.setAttribute("id", "microChartBG" + index);
    nodeParent.setAttribute("name", "microChartBG");
    nodeParent.setAttribute("data-index", index);
    contentParentNode.appendChild(nodeParent);
    CommonDataUtils.addClassesFromMenu(nodeObj.objClass, nodeParent);

    let microParentNode = document.createElement("div");
    microParentNode.className = "clsMicroChartContent clssimpleMicroDashed";
    microParentNode.setAttribute("name", "microchartContent");
    microParentNode.setAttribute("data-index", index);
    contentParentNode.appendChild(microParentNode);
    CommonDataUtils.addClassesFromMenu(nodeObj.objClass, microParentNode);
    CommonDataUtils.createMicroChartSVG(microStyle, microParentNode);

    let removeMicroNode = nodeObj.removeMicroNode;
    if (!removeMicroNode) {
        let microchartNode = document.createElement("div");
        microchartNode.className = "clsMicroChartNode moodanimation " + microchartFontSize;
        microchartNode.style.fontSize = "48px";
        microchartNode.setAttribute("data-id", "microchartNode");
        microchartNode.setAttribute("data-animation", dataAnimation);
        microchartNode.setAttribute("id", "microchartNode" + index);
        microchartNode.setAttribute("name", "microchartNode");
        microchartNode.setAttribute("data-index", index);
        microchartNode.setAttribute("data-focus-parent", "nodeGroup");
        microchartNode.setAttribute("contentEditable", true);
        contentParentNode.appendChild(microchartNode);
        CommonDataUtils.addClassesFromMenu(nodeObj.objClass, microchartNode);
        CommonDataUtils.checkTextContrast(nodeObj, microchartNode);
        if (objMicro?.isFromAi && (content.value == "" || content.value == null || content.value == undefined)) {
            content.value = "100%";
        } else {
            content.value = content.type == "image" || content.type == "icon" || content.value == "" || content.value == null || content.value == undefined ? CommonDataUtils.getRndInteger(10, 100) : content.value;
        }
        CommonDataUtils.parseMicroChartValue(content.value, microchartNode, contentParentNode, globalMoodData);
        microchartNode.classList.add(microStyle + "Text");
    }

    let microMainCircle = microParentNode.querySelector(".clsMainCircle");
    if (microMainCircle) {
        microMainCircle.classList.add("moodanimation");
        microMainCircle.setAttribute("data-animation", "microchart");
        microMainCircle.setAttribute("data-charttype", "micro");
        if (nodeObj.colorClass) microMainCircle.classList.add(nodeObj.colorClass);
        else microMainCircle.classList.add(innerStroke);
    }

    let microMainCircleBG = microParentNode.querySelector(".clsCircleBG");
    if (microMainCircleBG) {
        microMainCircleBG.classList.add("moodanimation");
        let computedStyle = window.getComputedStyle(microMainCircleBG);
        microMainCircleBG.setAttribute("data-customopacity", computedStyle.opacity);
        microMainCircleBG.setAttribute("data-animation", "microcirclebg");
        microMainCircleBG.setAttribute("id", "clsCircleBG" + index);
        microMainCircleBG.classList.add(innerStroke.includes("inner") ? "clsAlterSecondaryStroke" : "clsTertiaryFill");
        microMainCircleBG.classList.add(innerStroke.includes("inner") ? "clsContrastFill" : "clsTertiaryStroke");
    }
    if (index == 0 && diagramParent && holdertype == "primary") {
        let originalresizewidth = diagramParent.style.getPropertyValue("--originalresizewidth");
        if (!parseInt(originalresizewidth)) {
            diagramParent.style.setProperty("--originalresizewidth", contentParentNode.offsetWidth + "px");
            diagramParent.style.setProperty("--originalresizeheight", contentParentNode.offsetHeight + "px");
        }
    }
};

CommonDataUtils.getRndInteger = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

CommonDataUtils.getIconStyle = function (item) {
    let arrIconStyle = ["fill", "stroke", "glyph", "duotone", "colorfull", "line", "dual", "detailedline", "smoothline", "rounded", "roundfill", "dualline"];
    let iconStyle = null;
    arrIconStyle.forEach((element) => {
        if (item.value && item.value.includes("/" + element + "/") && item.id && !item.id.endsWith("_" + element)) iconStyle = "_" + element;
    });
    return iconStyle;
};

CommonDataUtils.getIconName = function (item) {
    if (!item.id) {
        item.id = item.value.substring(item.value.lastIndexOf("/") + 1).split(".")[0];
    }
    return item.id + (item.id != "placeholder" && CommonDataUtils.getIconStyle(item) ? CommonDataUtils.getIconStyle(item) : "");
};

CommonDataUtils.createMicroChartSVG = function (microStyle, parentNode) {
    parentNode.className = "clsMicroChartContent " + microStyle;
    let innerHTML = "";
    let uuid = CommonDataUtils.uuidv4();

    switch (microStyle) {
        case "clsSemiCircleStrokeDiagram":
            innerHTML = '<svg viewBox="0 0 32 16" height="100%" width="100%">';
            innerHTML +=
                '<defs><linearGradient id="gradmicro" x1="1" y1="1" x2="0"><stop offset=".12" stop-color="rgba(var(--gradient2-color-rgb),1)"/><stop offset=".83" stop-color="rgba(var(--gradient1-color-rgb),1)"/></linearGradient><clipPath id="clipMicro"><path class="clsMainCircleClip"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831" /></clipPath> </defs>';
            // innerHTML += "<path class='clsMainCircle' id='clsMainCircle'  d='" + DiagramCreateUtil.drawConnector( 180, 360,14,{x:0,y:0},{x:parentNode.clientWidth,y:parentNode.clientWidth}) + "'/>";
            // innerHTML += "<path class='clsMainCircleDash' id='clsMainCircleDash'  d='" + DiagramCreateUtil.drawConnector( 180, 360, 14,{x:0,y:0},{x:parentNode.clientWidth,y:parentNode.clientWidth}) + "'/>";
            innerHTML += "<path class='clsMainCircleDash moodanimation' data-animation='microcirclebg' id='clsMainCircleDash'  d='" + CommonDataUtils.circlePathWithAngle(16, 16, 14, 14) + "'/>";
            innerHTML += "<path class='clsMainCircle' id='clsMainCircle'  d='" + CommonDataUtils.circlePathWithAngle(16, 16, 14, 14) + "'/>";
            innerHTML += "</svg>";
            parentNode.innerHTML = innerHTML;
            let path = parentNode.querySelector("[id='clsMainCircleDash']");
            parentNode.parentElement.style.setProperty("--pathLength", path.getTotalLength());
            break;
        case "clsCircleFillDiagram":
            innerHTML += '<div class="clsMainCircle" id="clsMainCircle"  />';
            parentNode.innerHTML = innerHTML;
            break;
        case "clsLinePieDiagram":
            innerHTML = '<svg viewBox="0 0 32 32" height="100%">';
            innerHTML += '<circle class="clsCircleBG" id="clsCircleBG"   r="16" cx="16" cy="16" fill="transparent" stroke="#FF0000"  stroke-dasharray="101 100" />';
            innerHTML += '<circle class="clsMainCircle"  id="clsMainCircle" r="16" cx="16" cy="16" fill="transparent" stroke="green" stroke-dasharray="10 100" />';
            innerHTML += '<circle  class="clsSlideBG"  r="16" cx="16" cy="16" stroke="#FFFFFF" stroke-dasharray="1" fill="transparent" />';
            innerHTML += "</svg>";
            parentNode.innerHTML = innerHTML;
            break;
        case "clsPieMicroDiagram":
            innerHTML = '<svg viewBox="0 0 32 32" height="100%" width="100%">';
            innerHTML += "<defs>";
            innerHTML += '<clipPath id="' + uuid + '">';
            innerHTML += '<circle  r="16" cx="16" cy="16" />';
            innerHTML += "</clipPath>";
            innerHTML += "</defs>";
            innerHTML += '<g clip-path="url(#' + uuid + ')">';
            //innerHTML += '<circle  class="clsCircleBG" id="clsCircleBG" r="50%" cx="50%" cy="50%" "></circle>';
            innerHTML += '<circle class="clsCircleBG" id="clsCircleBG"   r="16" cx="16" cy="16" fill="transparent" stroke="#0000FF" stroke-width="32" stroke-dasharray="101 100" />';
            innerHTML += '<circle class="clsMainCircle"  id="clsMainCircle" r="16" cx="16" cy="16" fill="transparent" stroke="#FF0000" stroke-width="32" stroke-dasharray="40 100" />';
            //innerHTML += '<circle  fill-opacity= "0" stroke-opacity= "1" class="clsMainCircle"  id="clsMainCircle" r="9px" cx="18px" cy="18px" class="clsMainCircle"> </circle>';
            innerHTML += "</g>";
            innerHTML += "</svg>";
            parentNode.innerHTML = innerHTML;
            break;
        case "clsPieCutMicroDiagram":
            innerHTML = '<svg viewBox="0 0 32 32" height="100%">';
            innerHTML += "<defs>";
            innerHTML += '<clipPath id="' + uuid + '">';
            innerHTML += '<circle  r="16" cx="16" cy="16" />';
            innerHTML += "</clipPath>";
            innerHTML += "</defs>";
            innerHTML += '<g clip-path="url(#' + uuid + ')">';
            //innerHTML += '<circle  class="clsCircleBG" id="clsCircleBG" r="50%" cx="50%" cy="50%" "></circle>';
            innerHTML += '<circle class="clsCircleBG" id="clsCircleBG"   r="6" cx="16" cy="16" fill="transparent" stroke="#0000FF" stroke-width="32" stroke-dasharray="101 100" />';
            innerHTML += '<circle class="clsMainCircle"  id="clsMainCircle" r="16" cx="16" cy="16" fill="transparent" stroke="#FF0000" stroke-width="32" stroke-dasharray="40 100" />';
            //innerHTML += '<circle  fill-opacity= "0" stroke-opacity= "1" class="clsMainCircle"  id="clsMainCircle" r="9px" cx="18px" cy="18px" class="clsMainCircle"> </circle>';
            innerHTML += "</g>";
            innerHTML += "</svg>";
            parentNode.innerHTML = innerHTML;
            break;
        case "clsGradientPieMicroDiagram":
            innerHTML = '<svg viewBox="0 0 32 32" height="100%" width="100%">';
            innerHTML += "<defs>";
            innerHTML += '<linearGradient id="gradmicro"><stop offset=".22" stop-color="rgba(var(--gradient2-color-rgb),1)"></stop><stop offset=".83" stop-color="rgba(var(--gradient1-color-rgb),1)"></stop></linearGradient>';
            innerHTML += "</defs>";
            //innerHTML += '<circle  class="clsCircleBG" id="clsCircleBG" r="50%" cx="50%" cy="50%" "></circle>';
            innerHTML += '<circle class="clsCircleBG" id="clsCircleBG"   r="16" cx="16" cy="16" fill="transparent" stroke="#0000FF" stroke-width="32" stroke-dasharray="101 100" />';
            innerHTML += '<circle class="clsMainCircle"  id="clsMainCircle" r="16" cx="16" cy="16" fill="transparent" stroke="#FF0000" stroke-width="32" stroke-dasharray="40 100" />';
            //innerHTML += '<circle  fill-opacity= "0" stroke-opacity= "1" class="clsMainCircle"  id="clsMainCircle" r="9px" cx="18px" cy="18px" class="clsMainCircle"> </circle>';
            innerHTML += "</svg>";
            parentNode.innerHTML = innerHTML;
            break;
        case "clssimpleMicroSimpleFill":
            parentNode.innerHTML = '<svg><rect class="clsMicroRect"  x=0 y=0   /> <rect class="clsCircleBG" x=0 y=0   /> <rect  x=0 y=0   class="clsMainCircle" />  </svg>';
            break;
        case "clsGradientSimpleFillMicro":
            parentNode.innerHTML =
                '<svg><defs><linearGradient x1="0%" y1="0%" x2="100%" y2="0%" id="gradmicro"><stop offset=".22" stop-color="rgba(var(--gradient1-color-rgb),1)"></stop><stop offset=".83" stop-color="rgba(var(--gradient2-color-rgb),1)"></stop></linearGradient><clipPath id="clipMicro"><path class="clsMainCircleClip"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831" /></clipPath> </defs><rect class="clsMicroRect"  x=0 y=0   /> <rect class="clsCircleBG" x=0 y=0   /> <rect  x=0 y=0   class="clsMainCircle" />  </svg>';
            break;
        case "clsRatingMicro":
            // innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="rating_rounded-Layer_1" width="100%" data-name="Layer 1" width="100%" viewBox="0 0 426 68"><defs><clipPath id="rating_rounded-clip-path"><rect id="rating_rounded-_Clipping_Path_" data-name="&lt;Clipping Path&gt;" x="0.3" y="0.3" width="425.5" height="67.33" fill="none" stroke="none"/></clipPath></defs><g clip-path="url(#rating_rounded-clip-path)"><path id="rating_rounded-clsCircleBG" d="M15.2,67.6a1,1,0,0,1-1.5-1.1c1.9-5.8,6.2-18.7,7.8-23.7.1-.4.1-.7-.3-.9L.8,27.2a1,1,0,0,1,.6-1.8H27.3l8-24.1a1,1,0,0,1,1.9,0L45,24.8a.7.7,0,0,0,.8.6H71a1,1,0,0,1,.6,1.8L51.3,41.8a.9.9,0,0,0-.4,1.1c2.2,6.5,6,18.2,7.8,23.6a1,1,0,0,1-1.5,1.1L36.8,53a.8.8,0,0,0-1.1,0ZM126.1,53a.8.8,0,0,1,1.1,0l20.4,14.6a1,1,0,0,0,1.5-1.1l-7.8-23.6a.9.9,0,0,1,.4-1.1L162,27.2a1,1,0,0,0-.6-1.8H136.2a.7.7,0,0,1-.8-.6h0c-1.8-5.7-6-18-7.8-23.6a1,1,0,0,0-1.9,0l-8,24.2H91.8a1,1,0,0,0-.6,1.8l20.5,14.7c.4.2.4.5.3.9-1.8,5.2-5.8,17.7-7.8,23.7a1,1,0,0,0,1.5,1.1Zm88.4,0a.8.8,0,0,1,1.1,0L236,67.6a1,1,0,0,0,1.5-1.1l-7.7-23.6a.8.8,0,0,1,.3-1.1h0l20.4-14.6a1,1,0,0,0-.6-1.8H224.6a.7.7,0,0,1-.8-.6h0c-1.8-5.7-6-18-7.8-23.6a1,1,0,0,0-1.9,0l-8,24.2H180.2a1,1,0,0,0-.6,1.8l20.5,14.7c.4.2.4.5.3.9-1.7,5.2-5.8,17.7-7.8,23.7a1,1,0,0,0,1.5,1.1Zm89.4,0a.8.8,0,0,1,1.1,0l20.4,14.6a1,1,0,0,0,1.5-1.1l-7.7-23.6a.8.8,0,0,1,.3-1.1h.1l20.3-14.6a1,1,0,0,0-.6-1.8H314c-.4,0-.6-.2-.8-.6-1.8-5.7-6-18-7.8-23.6a1,1,0,0,0-1.9,0l-8,24.2H269.6a1,1,0,0,0-.6,1.8l20.5,14.7c.4.2.4.5.3.9C288.1,48,284,60.5,282,66.4a1,1,0,0,0,1.5,1.1Zm85.4,0a.8.8,0,0,1,1.1,0l20.4,14.6a1,1,0,0,0,1.5-1.1l-7.7-23.6a.8.8,0,0,1,.3-1.1h0l20.4-14.6a1,1,0,0,0-.6-1.8H399.4c-.5,0-.6-.2-.8-.6-1.8-5.7-5.9-18-7.8-23.6a1,1,0,0,0-1.9,0l-8.1,24.2H355a1,1,0,0,0-.6,1.8l20.5,14.7c.4.2.4.5.3.9-1.7,5.2-5.8,17.7-7.8,23.7a1,1,0,0,0,1.5,1.1Z" stroke="none"/><path id="rating_rounded-clsMainCircle" d="M15.2,67.6a1,1,0,0,1-1.5-1.1c1.9-5.8,6.2-18.7,7.8-23.7.1-.4.1-.7-.3-.9L.8,27.2a1,1,0,0,1,.6-1.8H27.3l8-24.1a1,1,0,0,1,1.9,0L45,24.8a.7.7,0,0,0,.8.6H71a1,1,0,0,1,.6,1.8L51.3,41.8a.9.9,0,0,0-.4,1.1c2.2,6.5,6,18.2,7.8,23.6a1,1,0,0,1-1.5,1.1L36.8,53a.8.8,0,0,0-1.1,0ZM126.1,53a.8.8,0,0,1,1.1,0l20.4,14.6a1,1,0,0,0,1.5-1.1l-7.8-23.6a.9.9,0,0,1,.4-1.1L162,27.2a1,1,0,0,0-.6-1.8H136.2a.7.7,0,0,1-.8-.6h0c-1.8-5.7-6-18-7.8-23.6a1,1,0,0,0-1.9,0l-8,24.2H91.8a1,1,0,0,0-.6,1.8l20.5,14.7c.4.2.4.5.3.9-1.8,5.2-5.8,17.7-7.8,23.7a1,1,0,0,0,1.5,1.1Zm88.4,0a.8.8,0,0,1,1.1,0L236,67.6a1,1,0,0,0,1.5-1.1l-7.7-23.6a.8.8,0,0,1,.3-1.1h0l20.4-14.6a1,1,0,0,0-.6-1.8H224.6a.7.7,0,0,1-.8-.6h0c-1.8-5.7-6-18-7.8-23.6a1,1,0,0,0-1.9,0l-8,24.2H180.2a1,1,0,0,0-.6,1.8l20.5,14.7c.4.2.4.5.3.9-1.7,5.2-5.8,17.7-7.8,23.7a1,1,0,0,0,1.5,1.1Zm89.4,0a.8.8,0,0,1,1.1,0l20.4,14.6a1,1,0,0,0,1.5-1.1l-7.7-23.6a.8.8,0,0,1,.3-1.1h.1l20.3-14.6a1,1,0,0,0-.6-1.8H314c-.4,0-.6-.2-.8-.6-1.8-5.7-6-18-7.8-23.6a1,1,0,0,0-1.9,0l-8,24.2H269.6a1,1,0,0,0-.6,1.8l20.5,14.7c.4.2.4.5.3.9C288.1,48,284,60.5,282,66.4a1,1,0,0,0,1.5,1.1Zm85.4,0a.8.8,0,0,1,1.1,0l20.4,14.6a1,1,0,0,0,1.5-1.1l-7.7-23.6a.8.8,0,0,1,.3-1.1h0l20.4-14.6a1,1,0,0,0-.6-1.8H399.4c-.5,0-.6-.2-.8-.6-1.8-5.7-5.9-18-7.8-23.6a1,1,0,0,0-1.9,0l-8.1,24.2H355a1,1,0,0,0-.6,1.8l20.5,14.7c.4.2.4.5.3.9-1.7,5.2-5.8,17.7-7.8,23.7a1,1,0,0,0,1.5,1.1Z" fill="none" stroke="none"/></g></svg>`;
            innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 429 71" width="100%">';
            innerHTML += '<defs><clipPath id="' + uuid + '"><rect class="clsMicroRect" id="clsMicroRect" height="100%"/></clipPath></defs>';
            // innerHTML += '<rect x="0" y="0" width="100%" height="100%" />';
            innerHTML +=
                '<path class="clsCircleBG" id="clsCircleBG" d="M15.7,59.3a3,3,0,0,1-4.6-3.4L17.1,38c.1-.4.1-.7-.3-.9L1.3,26.1a3,3,0,0,1,1.7-5.4H22.8L28.8,2.2a3,3,0,0,1,5.7,0L40.5,20a.7.7,0,0,0,.8.6H60.3a3,3,0,0,1,1.7,5.4L46.8,37a.9.9,0,0,0-.4,1.1l5.9,17.8a3,3,0,0,1-4.6,3.4L32.3,48.2a.8.8,0,0,0-1.1,0ZM121.6,48.2a.8.8,0,0,1,1.1,0l15.4,11a3,3,0,0,0,4.6-3.4l-5.9-17.8a.9.9,0,0,1,.4-1.1l15.3-11a3,3,0,0,0-1.7-5.4h-19a.7.7,0,0,1-.8-.6h0c-1.3-4.2-3.9-11.9-5.9-17.9a3,3,0,0,0-5.7,0l-6.1,18.5H93.5a3,3,0,0,0-1.7,5.4l15.4,11.1c.4.2.4.5.3.9-1.3,3.9-3.9,11.6-5.9,17.9a3,3,0,0,0,4.6,3.4Zm88.4,0a.8.8,0,0,1,1.1,0l15.4,11.1a3,3,0,0,0,4.6-3.4l-5.8-17.8a.8.8,0,0,1,.3-1.1h0l15.3-11a3,3,0,0,0-1.7-5.4h-19a.7.7,0,0,1-.8-.6h0c-1.3-4.2-3.9-11.9-5.9-17.9a3,3,0,0,0-5.7,0l-6.1,18.5H181.9a3,3,0,0,0-1.7,5.4l15.4,11.1c.4.2.4.5.3.9L190,55.9a3,3,0,0,0,4.6,3.4Zm89.4,0a.8.8,0,0,1,1.1,0l15.4,11.1a3,3,0,0,0,4.6-3.4l-5.8-17.8a.8.8,0,0,1,.3-1.1h.1l15.2-11a3,3,0,0,0-1.8-5.4H309.5c-.4,0-.6-.2-.8-.6-1.3-4.2-3.9-11.9-5.9-17.9a3,3,0,0,0-5.7,0L291,20.6H271.3a3,3,0,0,0-1.7,5.4L285,37.1c.4.2.4.5.3.9l-5.8,17.8a3,3,0,0,0,4.6,3.4Zm85.4,0a.8.8,0,0,1,1.1,0l15.4,11.1a3,3,0,0,0,4.6-3.4l-5.8-17.8a.8.8,0,0,1,.3-1.1h0l15.3-11a3,3,0,0,0-1.7-5.4h-19c-.5,0-.6-.2-.8-.6-1.3-4.2-3.9-11.8-5.9-17.8a3,3,0,0,0-5.7,0l-6.1,18.4H356.7a3,3,0,0,0-1.7,5.4l15.4,11.1c.4.2.4.5.3.9l-5.8,17.8a3,3,0,0,0,4.6,3.4Z" fill="green" />';
            innerHTML +=
                '<g clip-path="url(#' +
                uuid +
                ')"><path  class="clsMainCircle"  id="clsMainCircle" d="M15.7,59.3a3,3,0,0,1-4.6-3.4L17.1,38c.1-.4.1-.7-.3-.9L1.3,26.1a3,3,0,0,1,1.7-5.4H22.8L28.8,2.2a3,3,0,0,1,5.7,0L40.5,20a.7.7,0,0,0,.8.6H60.3a3,3,0,0,1,1.7,5.4L46.8,37a.9.9,0,0,0-.4,1.1l5.9,17.8a3,3,0,0,1-4.6,3.4L32.3,48.2a.8.8,0,0,0-1.1,0ZM121.6,48.2a.8.8,0,0,1,1.1,0l15.4,11a3,3,0,0,0,4.6-3.4l-5.9-17.8a.9.9,0,0,1,.4-1.1l15.3-11a3,3,0,0,0-1.7-5.4h-19a.7.7,0,0,1-.8-.6h0c-1.3-4.2-3.9-11.9-5.9-17.9a3,3,0,0,0-5.7,0l-6.1,18.5H93.5a3,3,0,0,0-1.7,5.4l15.4,11.1c.4.2.4.5.3.9-1.3,3.9-3.9,11.6-5.9,17.9a3,3,0,0,0,4.6,3.4Zm88.4,0a.8.8,0,0,1,1.1,0l15.4,11.1a3,3,0,0,0,4.6-3.4l-5.8-17.8a.8.8,0,0,1,.3-1.1h0l15.3-11a3,3,0,0,0-1.7-5.4h-19a.7.7,0,0,1-.8-.6h0c-1.3-4.2-3.9-11.9-5.9-17.9a3,3,0,0,0-5.7,0l-6.1,18.5H181.9a3,3,0,0,0-1.7,5.4l15.4,11.1c.4.2.4.5.3.9L190,55.9a3,3,0,0,0,4.6,3.4Zm89.4,0a.8.8,0,0,1,1.1,0l15.4,11.1a3,3,0,0,0,4.6-3.4l-5.8-17.8a.8.8,0,0,1,.3-1.1h.1l15.2-11a3,3,0,0,0-1.8-5.4H309.5c-.4,0-.6-.2-.8-.6-1.3-4.2-3.9-11.9-5.9-17.9a3,3,0,0,0-5.7,0L291,20.6H271.3a3,3,0,0,0-1.7,5.4L285,37.1c.4.2.4.5.3.9l-5.8,17.8a3,3,0,0,0,4.6,3.4Zm85.4,0a.8.8,0,0,1,1.1,0l15.4,11.1a3,3,0,0,0,4.6-3.4l-5.8-17.8a.8.8,0,0,1,.3-1.1h0l15.3-11a3,3,0,0,0-1.7-5.4h-19c-.5,0-.6-.2-.8-.6-1.3-4.2-3.9-11.8-5.9-17.8a3,3,0,0,0-5.7,0l-6.1,18.4H356.7a3,3,0,0,0-1.7,5.4l15.4,11.1c.4.2.4.5.3.9l-5.8,17.8a3,3,0,0,0,4.6,3.4Z" fill="red" /></g>';
            innerHTML += "</svg>";
            parentNode.innerHTML = innerHTML;
            break;
        case "clsGradientMicro":
            innerHTML = '<svg viewBox="0 0 36 36">';
            innerHTML +=
                '<defs><linearGradient id="gradmicro" x1="1" y1="1" x2="0"><stop offset=".12" stop-color="rgba(var(--gradient2-color-rgb),1)"/><stop offset=".83" stop-color="rgba(var(--gradient1-color-rgb),1)"/></linearGradient><clipPath id="clipMicro"><path class="clsMainCircleClip"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831" /></clipPath> </defs>';
            innerHTML +=
                '<rect class="clsMicroRect"  fill="none" stroke="none" x=0 y=0 width="100%" height="100%" /><path class="clsCircleBG"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831"  /> <path   class="clsMainCircle"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831" /><path class="clsMainCircleDash"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>';
            parentNode.innerHTML = innerHTML;
            break;
        default:
            innerHTML = '<svg viewBox="0 0 36 36">';
            innerHTML += '<defs><clipPath id="clipMicro"><path class="clsMainCircleClip"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831" /></clipPath> </defs>';
            innerHTML +=
                '<rect class="clsMicroRect"  fill="none" stroke="none" x=0 y=0 width="100%" height="100%" /><path class="clsCircleBG"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831"  /> <path   class="clsMainCircle"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831" /><path class="clsMainCircleDash"  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831  a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>';
            parentNode.innerHTML = innerHTML;
            break;
    }
};

CommonDataUtils.circlePathWithAngle = function (cx, cy, r, deg) {
    var theta = (deg * Math.PI) / 180,
        dx = r * Math.cos(theta),
        dy = -r * Math.sin(theta);
    return "M " + cx + " " + cy + "m " + dx + "," + dy + "a " + r + "," + r + " 0 1,0 " + -2 * dx + "," + -2 * dy + "a " + r + "," + r + " 0 1,0 " + 2 * dx + "," + 2 * dy;
};

CommonDataUtils.parseMicroChartValue = function (data, microNode, parentNode, globalMoodData) {
    let mainCircle = parentNode.querySelector(".clsMainCircle");
    let textMain = TextHighLightUtils.createSpan("spanMainText");
    textMain.className = "clSpanMainText";
    microNode.innerText = data;
    let objFormat = CommonDataUtils.getNumberFormat(microNode);
    let value = !objFormat.validData ? 0 : objFormat.currencyValueNormalized != null ? Math.abs(objFormat.currencyValueNormalized) : objFormat.value.toLocaleString();
    value = value > 100 ? 100 : value < 0 ? 0 : value == "" || isNaN(value) ? 0 : value;
    textMain.innerText = value;
    parentNode.style.setProperty("--percentageValue", value + "%");
    parentNode.style.setProperty("--percentageData", value);
    if (mainCircle) mainCircle.setAttribute("data-percentageValue", value);
    let mooddata = globalMoodData && globalMoodData.basicgraphics ? globalMoodData.basicgraphics : {};
    let suffixSpecial = null;
    if (mooddata.numbersuffix) suffixSpecial = mooddata.numbersuffix.special;
    let suffix = TextHighLightUtils.createSpan("spanSuffix", suffixSpecial);
    suffix.className = mooddata && mooddata.numbersuffix ? mooddata.numbersuffix.style : "clsSpanSuffix";
    microNode.innerHTML = textMain.outerHTML + "%";
};

CommonDataUtils.getNumberFormat = function (target) {
    let gDataFormatter = eval("new " + "DataFormatUtil" + "()");
    var regex = new RegExp(",", "gi");
    let str = target.textContent.replace(regex, "").replace(/\s/g, "");
    return gDataFormatter.formatCurrency({ input: str });
};

CommonDataUtils.addClassesFromMenu = function (objClass, parent) {
    if (parent && objClass) {
        let name = parent.getAttribute("name");
        if (name && objClass[name]) {
            let strClasses = objClass[name].trim();
            parent.className = strClasses + " " + parent.className;
        }
    }
};

CommonDataUtils.checkTextContrast = function (holderObj, textNode) {
    if (holderObj.supportcontrast != null && holderObj.supportcontrast == false) {
    } else textNode.setAttribute("data-supportcontrast", "true");
};

CommonDataUtils.assignAttributes = function (node, attrs, unitCheck) {
    for (let i1 in attrs) {
        let ns = i1.substr(0, 4) === "xml:" ? "http://www.w3.org/2000/xmlns/" : i1.substr(0, 6) === "xlink:" ? "http://www.w3.org/1999/xlink" : null;
        try {
            if (ns) {
                node.setAttributeNS(ns, i1, attrs[i1]);
            } else if (!unitCheck && node) {
                node.setAttribute(i1, attrs[i1]);
            }
        } catch (error) {
            console.log(error);
        }
    }
};

CommonDataUtils.removeUnwantedBreaks = function (target) {
    if (target.innerHTML == "<br>") target.innerHTML = "";
    if (target.innerText.trim() == "") target.innerHTML = "";
};
