/**
 * DOM element selection box tools.
 * @module select
 * @license MIT
 *
 * @copyright 2010 Alexis Deveria, 2010 Jeff Schiller
 */

import { isWebkit } from "../common/browser.js"; // , isOpera
import { getRotationAngle, getBBox, getStrokedBBox } from "./utilities.js";
import {
  transformListToTransform,
  transformBox,
  transformPoint,
} from "./math.js";

let svgCanvas;
let selectorManager_; // A Singleton
// change radius if touch screen

let gripRadius = 4;
let gripStoke = 2;

const modifyBtnWidth = 36;
const modifyBtnHeight = 36;

const deleteBtnWidth = 36;
const deleteBtnHeight = 36;

const copyBtnWidth = 36;
const copyBtnHeight = 36;

/**
 * Private class for DOM element selection boxes.
 */
export class Selector {
  /**
   * @param {Integer} id - Internally identify the selector
   * @param {Element} elem - DOM element associated with this selector
   * @param {module:utilities.BBoxObject} [bbox] - Optional bbox to use for initialization (prevents duplicate `getBBox` call).
   */
  constructor(id, elem, bbox) {
    // this is the selector's unique number
    this.id = id;

    // this holds a reference to the element for which this selector is being used
    this.selectedElement = elem;

    // this is a flag used internally to track whether the selector is being used or not
    this.locked = true;

    // this holds a reference to the <g> element that holds all visual elements of the selector
    this.selectorGroup = svgCanvas.createSVGElement({
      element: "g",
      attr: { id: "selectorGroup" },
    });

    // this holds a reference to the path rect
    this.selectorRect = svgCanvas.createSVGElement({
      element: "path",
      attr: {
        id: "selectedBox",
        fill: "none",
        "fill-opacity": "0.001",
        stroke: "#22C",
        "stroke-width": "1",
        "stroke-dasharray": "5,5",
        // need to specify this so that the rect is not selectable
        //style: "pointer-events:none",
      },
    });
    this.selectorGroup.append(this.selectorRect);

    // this holds a reference to the grip coordinates for this selector
    this.gripCoords = {
      nw: null,
      n: null,
      ne: null,
      e: null,
      se: null,
      s: null,
      sw: null,
      w: null,
    };

    this.reset(this.selectedElement, bbox);
  }

  /**
   * Used to reset the id and element that the selector is attached to.
   * @param {Element} e - DOM element associated with this selector
   * @param {module:utilities.BBoxObject} bbox - Optional bbox to use for reset (prevents duplicate getBBox call).
   * @returns {void}
   */
  reset(e, bbox) {
    this.locked = true;
    this.selectedElement = e;
    this.resize(bbox);
    this.selectorGroup.setAttribute("display", "inline");
  }

  /**
   * Show the resize grips of this selector.
   * @param {boolean} show - Indicates whether grips should be shown or not
   * @returns {void}
   */
  showGrips(show) {

    const bShow = show ? "inline" : "none";
    selectorManager_.selectorGripsGroup.setAttribute("display", bShow);
    if (svgCanvas.getDisplayMobile()) {
      selectorManager_.modifyEventTag.setAttribute("display", bShow);
    }


    const elem = this.selectedElement;
    if (elem) {

      const isScale = elem.getAttribute("editor_scale");
      const isRotate = elem.getAttribute("editor_rotate");
      const isMove = elem.getAttribute("editor_move");
      const isDelete = true

      const scaleList = [];
      const rotateElem = [];
      const moveElem = [];
      Array.prototype.forEach.call(
          selectorManager_.selectorGripsGroup.children,
          (element) => {
            const idStr = element.getAttribute("id");
            if (idStr.indexOf("selectorGrip_resize") != -1) {
              scaleList.push(element);
            }

            if (
                ["selectorGrip_rotate", "selectorGrip_rotateconnector"].includes(
                    idStr
                )
            ) {
              rotateElem.push(element);
            }

            if ("selectorGrip_move" == idStr) {
              moveElem.push(element);
            }
          }
      );

      scaleList.forEach((element) => {
        if (!isScale || isScale == "false") {
          element.setAttribute("display", "none");
        } else {
          element.setAttribute("display", "inline");
        }
      });

      rotateElem.forEach((element) => {
        if (!isRotate || isRotate == "false") {
          element.setAttribute("display", "none");
        } else {
          element.setAttribute("display", "inline");
        }
      });

      moveElem.forEach((element) => {
        if (!isMove || isMove == "false") {
          element.setAttribute("stroke", "#c0c1c5");
        } else {
          element.setAttribute("stroke", "#00dcf0");
        }
      });

      if (svgCanvas.getDisplayMobile()) {

        let attrRock=elem.getAttribute("attr_rock")
        if(!elem.hasAttribute("image_id") && !elem.hasAttribute("shapes_id")&&elem.nodeName=="g") {
          //g태그인데 image_id shapes_id둘다 없다
          //attrRock을 걸어야 하는데
          attrRock="true"
        }
        if (attrRock=="false") {
          document
              .getElementById("selectorGrip_modify_a")
              .setAttribute("display", "inline");
        } else {
          document
              .getElementById("selectorGrip_modify_a")
              .setAttribute("display", "none");
        }
      }

      if (isDelete) {
        document
            .getElementById("selectorGrip_delete_a")
            .setAttribute("display", "inline");
      } else {
        document
            .getElementById("selectorGrip_delete_a")
            .setAttribute("display", "none");
      }

      document
          .getElementById("selectorGrip_copy_a")
          .setAttribute("display", "inline");
    }

    this.hasGrips = show;
    if (elem && show) {
      this.selectorGroup.append(selectorManager_.selectorGripsGroup);
      this.updateGripCursors(getRotationAngle(elem));
    }
  }

  /**
   * Updates the selector to match the element's size.
   * @param {module:utilities.BBoxObject} [bbox] - BBox to use for resize (prevents duplicate getBBox call).
   * @returns {void}
   */
  resize(bbox) {
    const dataStorage = svgCanvas.getDataStorage();
    const selectedBox = this.selectorRect;
    const mgr = selectorManager_;
    const selectedGrips = mgr.selectorGrips;
    const selected = this.selectedElement;
    const zoom = svgCanvas.getZoom();
    let offset = 1 / zoom;
    const sw = selected.getAttribute("stroke-width");
    if (selected.getAttribute("stroke") !== "none" && !isNaN(sw)) {
      offset += sw / 2;
    }

    const { tagName } = selected;
    if (tagName === "text") {
      offset += 2 / zoom;
    }

    // loop and transform our bounding box until we reach our first rotation
    const tlist = selected.transform.baseVal;

    const m = transformListToTransform(tlist).matrix;

    // This should probably be handled somewhere else, but for now
    // it keeps the selection box correctly positioned when zoomed
    m.e *= zoom;
    m.f *= zoom;

    if (!bbox) {
      bbox = getBBox(selected);
    }
    // TODO: getBBox (previous line) already knows to call getStrokedBBox when tagName === 'g'. Remove this?
    // TODO: getBBox doesn't exclude 'gsvg' and calls getStrokedBBox for any 'g'. Should getBBox be updated?
    if (tagName === "g" && !dataStorage.has(selected, "gsvg")) {
      // The bbox for a group does not include stroke vals, so we
      // get the bbox based on its children.
      const strokedBbox = getStrokedBBox([selected.childNodes]);
      if (strokedBbox) {
        bbox = strokedBbox;
      }
    }

    // apply the transforms
    const l = bbox.x;
    const t = bbox.y;
    const w = bbox.width;
    const h = bbox.height;
    // bbox = {x: l, y: t, width: w, height: h}; // Not in use

    // we need to handle temporary transforms too
    // if skewed, get its transformed box, then find its axis-aligned bbox

    // *
    offset *= zoom;

    const nbox = transformBox(l * zoom, t * zoom, w * zoom, h * zoom, m);
    const { aabox } = nbox;
    let nbax = aabox.x - offset;
    let nbay = aabox.y - offset;
    let nbaw = aabox.width + offset * 2;
    let nbah = aabox.height + offset * 2;

    // now if the shape is rotated, un-rotate it
    const cx = nbax + nbaw / 2;
    const cy = nbay + nbah / 2;

    const angle = getRotationAngle(selected);

    if (angle) {
      const rot = svgCanvas.getSvgRoot().createSVGTransform();
      rot.setRotate(-angle, cx, cy);
      const rotm = rot.matrix;
      nbox.tl = transformPoint(nbox.tl.x, nbox.tl.y, rotm);
      nbox.tr = transformPoint(nbox.tr.x, nbox.tr.y, rotm);
      nbox.bl = transformPoint(nbox.bl.x, nbox.bl.y, rotm);
      nbox.br = transformPoint(nbox.br.x, nbox.br.y, rotm);

      // calculate the axis-aligned bbox
      const { tl } = nbox;
      let minx = tl.x;
      let miny = tl.y;
      let maxx = tl.x;
      let maxy = tl.y;

      const { min, max } = Math;

      minx = min(minx, min(nbox.tr.x, min(nbox.bl.x, nbox.br.x))) - offset;
      miny = min(miny, min(nbox.tr.y, min(nbox.bl.y, nbox.br.y))) - offset;
      maxx = max(maxx, max(nbox.tr.x, max(nbox.bl.x, nbox.br.x))) + offset;
      maxy = max(maxy, max(nbox.tr.y, max(nbox.bl.y, nbox.br.y))) + offset;

      nbax = minx;
      nbay = miny;
      nbaw = maxx - minx;
      nbah = maxy - miny;
    }

    const dstr =
        "M" +
        nbax +
        "," +
        nbay +
        " L" +
        (nbax + nbaw) +
        "," +
        nbay +
        " " +
        (nbax + nbaw) +
        "," +
        (nbay + nbah) +
        " " +
        nbax +
        "," +
        (nbay + nbah) +
        "z";

    const xform = angle ? "rotate(" + [angle, cx, cy].join(",") + ")" : "";

    // TODO(codedread): Is this needed?
    //  if (selected === selectedElements[0]) {
    this.gripCoords = {
      nw: [nbax, nbay],
      ne: [nbax + nbaw, nbay],
      sw: [nbax, nbay + nbah],
      se: [nbax + nbaw, nbay + nbah],
      n: [nbax + nbaw / 2, nbay],
      w: [nbax, nbay + nbah / 2],
      e: [nbax + nbaw, nbay + nbah / 2],
      s: [nbax + nbaw / 2, nbay + nbah],
    };
    selectedBox.setAttribute("d", dstr);
    mgr.moveLineGrip.setAttribute("d", dstr);

    this.selectorGroup.setAttribute("transform", xform);

    Object.entries(this.gripCoords).forEach(([dir, coords]) => {
      selectedGrips[dir].setAttribute("cx", coords[0]);
      selectedGrips[dir].setAttribute("cy", coords[1]);
    });

    // we want to go 20 pixels in the negative transformed y direction, ignoring scale
    mgr.rotateGripConnector.setAttribute("x1", nbax + nbaw / 2);
    mgr.rotateGripConnector.setAttribute("y1", nbay);
    mgr.rotateGripConnector.setAttribute("x2", nbax + nbaw / 2);
    mgr.rotateGripConnector.setAttribute("y2", nbay - gripRadius * 5);

    mgr.rotateGrip.setAttribute("cx", nbax + nbaw / 2);
    mgr.rotateGrip.setAttribute("cy", nbay - gripRadius * 5);

    const buttonOffsetY = 8

    const isDelete=true

    //  변경버튼 x/y 값 계산 및 지정
    if (svgCanvas.getDisplayMobile()) {
      mgr.modifyBtn.setAttribute("x", nbax + nbaw-copyBtnWidth +gripRadius/2);
      mgr.modifyBtn.setAttribute("y", nbay - modifyBtnHeight - buttonOffsetY);

      mgr.modifyBtnText.setAttribute( "x", nbax + nbaw-copyBtnWidth + (modifyBtnWidth / 2) +gripRadius/2 -11);
      mgr.modifyBtnText.setAttribute("y", nbay - (modifyBtnHeight / 2) - buttonOffsetY -12);

      mgr.copyBtn.setAttribute("x", nbax + nbaw +gripRadius/2);
      mgr.copyBtn.setAttribute("y", nbay - copyBtnHeight - buttonOffsetY);

      mgr.copyBtnText.setAttribute( "x", nbax + nbaw +(copyBtnWidth / 2) +gripRadius/2  -11);
      mgr.copyBtnText.setAttribute("y", nbay - (copyBtnHeight / 2) - buttonOffsetY -12);

      if (isDelete) {
        const isShapes = selected.hasAttribute("shapes_id")

        if (isShapes) {
          //도형 수정 삭제버튼 노출
          mgr.deleteBtn.setAttribute("x", nbax + nbaw+ copyBtnWidth  +gripRadius/2+4);
          mgr.deleteBtn.setAttribute("y", nbay - deleteBtnHeight - buttonOffsetY);

          mgr.deleteBtnText.setAttribute("x", nbax + nbaw+ copyBtnWidth + (deleteBtnWidth / 2) +gripRadius/2+4 -11);
          mgr.deleteBtnText.setAttribute("y", nbay - (modifyBtnHeight / 2) - buttonOffsetY -12);
        } else {
          //아이콘 삭제버튼 노출
          mgr.deleteBtn.setAttribute("x", nbax + nbaw+ copyBtnWidth +gripRadius/2);
          mgr.deleteBtn.setAttribute("y", nbay - modifyBtnHeight - buttonOffsetY);

          mgr.deleteBtnText.setAttribute("x", nbax + nbaw+ copyBtnWidth  + (deleteBtnWidth / 2) +gripRadius/2-11);
          mgr.deleteBtnText.setAttribute("y", nbay - (modifyBtnHeight / 2) - buttonOffsetY-12);
        }

      }
    } else {
      mgr.copyBtn.setAttribute("x", nbax + nbaw +gripRadius/2);
      mgr.copyBtn.setAttribute("y", nbay - copyBtnHeight - buttonOffsetY);

      mgr.copyBtnText.setAttribute( "x", nbax + nbaw + (copyBtnWidth / 2) +gripRadius/2 -11);
      mgr.copyBtnText.setAttribute("y", nbay - (copyBtnHeight / 2) - buttonOffsetY -12);

      if (isDelete) {
        //아이콘 삭제버튼 노출
        mgr.deleteBtn.setAttribute("x", nbax + nbaw+ copyBtnWidth + gripRadius / 2);
        mgr.deleteBtn.setAttribute("y", nbay - modifyBtnHeight - buttonOffsetY);

        mgr.deleteBtnText.setAttribute("x", nbax + nbaw + copyBtnWidth+(modifyBtnWidth / 2) + gripRadius / 2-11);
        mgr.deleteBtnText.setAttribute("y", nbay - (modifyBtnHeight / 2) - buttonOffsetY-12);
      }
    }

    //  삭제버튼 x/y 값 계산 및 지정

    // }
  }

  // STATIC methods
  /**
   * Updates cursors for corner grips on rotation so arrows point the right way.
   * @param {Float} angle - Current rotation angle in degrees
   * @returns {void}
   */
  updateGripCursors(angle) {
    const dirArr = Object.keys(selectorManager_.selectorGrips);
    let steps = Math.round(angle / 45);
    if (steps < 0) {
      steps += 8;
    }
    while (steps > 0) {
      dirArr.push(dirArr.shift());
      steps--;
    }
    Object.values(selectorManager_.selectorGrips).forEach((gripElement, i) => {
      gripElement.setAttribute("style", "cursor:" + dirArr[i] + "-resize");
    });
  }
}

/**
 * Manage all selector objects (selection boxes).
 */
export class SelectorManager {
  /**
   * Sets up properties and calls `initGroup`.
   */
  constructor() {
    // this will hold the <g> element that contains all selector rects/grips
    this.selectorParentGroup = null;

    // this is a special rect that is used for multi-select
    this.rubberBandBox = null;

    // this will hold objects of type Selector (see above)
    this.selectors = [];

    // this holds a map of SVG elements to their Selector object
    this.selectorMap = {};

    // this holds a reference to the grip elements
    this.selectorGrips = {
      nw: null,
      n: null,
      ne: null,
      e: null,
      se: null,
      s: null,
      sw: null,
      w: null,
    };

    this.selectorGripsGroup = null;
    this.rotateGripConnector = null;
    this.rotateGrip = null;
    this.moveLineGrip = null;

    this.modifyEventTag = null;
    this.modifyBtn = null;
    this.modifyBtnText = null;

    this.deleteEventTag = null;
    this.deleteBtn = null;
    this.deleteBtnText = null;

    this.copyEventTag = null;
    this.copyBtn = null;
    this.copyBtnText = null;

    this.mobileOpen = (evt) => {
      const selectedList = svgCanvas.getSelectedElements()
      if (selectedList) {
        const selected = selectedList[0]
        if (selected) {
          selected.setAttribute("editor_selected","true")
        }
      }
      if (evt.changedTouches.length == 1) {
        const clientX = evt.changedTouches[0].clientX
        const clientY = evt.changedTouches[0].clientY
        if (clientX >= this.clickXMin && clientX <= this.clickXMax && clientY >= this.clickYMin && clientY <= this.clickYMax) {
          svgCanvas.getMobileBtnFunc()(true)
        }
      }
      this.clickXMin = 0
      this.clickXMax = 0
      this.clickYMin = 0
      this.clickYMax = 0


    }

    this.clickXMin = 0
    this.clickXMax = 0
    this.clickYMin = 0
    this.clickYMax = 0

    this.startFunction = (evt) => {
      //if (evt.cancelable) evt.preventDefault();
      const selectedList = svgCanvas.getSelectedElements()
      if (selectedList) {
        const selected = selectedList[0]
        if (selected) {
          selected.setAttribute("editor_selected", "false")
        }
      }

      if (evt.touches&&evt.touches.length == 1) {

        const bbox=evt.target.parentNode.getBoundingClientRect()

        this.clickXMin = bbox.x
        this.clickXMax = bbox.x + bbox.width
        this.clickYMin = bbox.y
        this.clickYMax = bbox.y + bbox.height
      } else if (evt.target) {
        const bbox=evt.target.parentNode.getBoundingClientRect()

        this.clickXMin = bbox.x
        this.clickXMax = bbox.x + bbox.width
        this.clickYMin = bbox.y
        this.clickYMax = bbox.y + bbox.height

      } else {
        this.clickXMin = 0
        this.clickXMax = 0
        this.clickYMin = 0
        this.clickYMax = 0
      }
    }

    this.deleteSVG = (evt) => {
      const selectedList = svgCanvas.getSelectedElements()
      if (selectedList) {
        const selected = selectedList[0]
        if (selected) {
          selected.setAttribute("editor_selected","true")
          let isClick=false
          if (evt.changedTouches && evt.changedTouches.length == 1) {
            const clientX = evt.changedTouches[0].clientX
            const clientY = evt.changedTouches[0].clientY
            if (clientX >= this.clickXMin && clientX <= this.clickXMax && clientY >= this.clickYMin && clientY <= this.clickYMax) {
              isClick=true
            }
          } else {
            const clientX = evt.clientX
            const clientY = evt.clientY
            if (clientX >= this.clickXMin && clientX <= this.clickXMax && clientY >= this.clickYMin && clientY <= this.clickYMax) {
              isClick=true
            }
          }
          if (isClick) {
            svgCanvas.getDeleteSVG()()
          }
        }
      }
      this.clickXMin = 0
      this.clickXMax = 0
      this.clickYMin = 0
      this.clickYMax = 0
    }

    this.copyElement = async (evt) => {
      const selectedList = svgCanvas.getSelectedElements()

      if (selectedList) {
        const selected = selectedList[0]
        if (selected) {

          let isClick = false;
          selected.setAttribute("editor_selected", "true")
          if (evt.changedTouches && evt.changedTouches.length == 1) {
            const clientX = evt.changedTouches[0].clientX
            const clientY = evt.changedTouches[0].clientY
            if (clientX >= this.clickXMin && clientX <= this.clickXMax && clientY >= this.clickYMin && clientY <= this.clickYMax) {
              isClick=true
            }
          } else {
            const clientX = evt.clientX
            const clientY = evt.clientY
            if (clientX >= this.clickXMin && clientX <= this.clickXMax && clientY >= this.clickYMin && clientY <= this.clickYMax) {
              isClick=true
            }
          }
          if (isClick) {
            svgCanvas.getCloneSVG()()
          }
        }
      }

      this.clickXMin = 0
      this.clickXMax = 0
      this.clickYMin = 0
      this.clickYMax = 0
    }



    this.initGroup();
  }

  /**
   * Resets the parent selector group element.
   * @returns {void}
   */
  initGroup() {
    const dataStorage = svgCanvas.getDataStorage();
    const displayMobile = svgCanvas.getDisplayMobile();
    gripRadius = displayMobile ? 8 : 4;
    gripStoke = displayMobile ? 2 : 2;

    // remove old selector parent group if it existed
    if (this.selectorParentGroup?.parentNode) {
      this.selectorParentGroup.remove();
    }

    // create parent selector group and add it to svgroot
    this.selectorParentGroup = svgCanvas.createSVGElement({
      element: "g",
      attr: { id: "selectorParentGroup" },
    });

    this.selectorGripsGroup = svgCanvas.createSVGElement({
      element: "g",
      attr: { display: "none" },
    });
    this.selectorParentGroup.append(this.selectorGripsGroup);
    svgCanvas.getSvgRoot().append(this.selectorParentGroup);

    this.moveLineGrip = svgCanvas.createSVGElement({
      element: "path",
      attr: {
        id: "selectorGrip_move",
        fill: "none",
        "fill-opacity": "0.001",
        stroke: "#C22",
        "stroke-width": "2",
        // need to specify this so that the rect is not selectable
        //style: "pointer-events:none",
      },
    });

    this.selectorGripsGroup.append(this.moveLineGrip);

    // add the corner grips
    Object.keys(this.selectorGrips).forEach((dir) => {
      const grip = svgCanvas.createSVGElement({
        element: "circle",
        attr: {
          id: "selectorGrip_resize_" + dir,
          fill: "#fff",
          r: gripRadius,
          style: "cursor:" + dir + "-resize",
          // This expands the mouse-able area of the grips making them
          // easier to grab with the mouse.
          // This works in Opera and WebKit, but does not work in Firefox
          // see https://bugzilla.mozilla.org/show_bug.cgi?id=500174
          stroke: "#00dcf0",
          "stroke-width": gripStoke,
          "stroke-opacity": "1",
          "pointer-events": "all",
        },
      });

      dataStorage.put(grip, "dir", dir);
      dataStorage.put(grip, "type", "resize");
      this.selectorGrips[dir] = grip;
      this.selectorGripsGroup.append(grip);
    });

    // add rotator elems
    this.rotateGripConnector = svgCanvas.createSVGElement({
      element: "line",
      attr: {
        id: "selectorGrip_rotateconnector",
        stroke: "#00dcf0",
        "stroke-width": "1",
      },
    });
    this.selectorGripsGroup.append(this.rotateGripConnector);

    this.rotateGrip = svgCanvas.createSVGElement({
      element: "circle",
      attr: {
        id: "selectorGrip_rotate",
        fill: "#20c997",
        r: gripRadius * 1.5,
        stroke: "black",
        "stroke-width": gripStoke,
        "stroke-opacity": "0.001",
        cursor: "rotate",
      },
    });

    this.selectorGripsGroup.append(this.rotateGrip);

    dataStorage.put(this.rotateGrip, "type", "rotate");


    if (svgCanvas.getDisplayMobile()) {
      this.modifyEventTag = svgCanvas.createSVGElement({
        element: "a",
        attr: {
          id: "selectorGrip_modify_a",
          display: "none",
        },
      });

      //  변경 버튼
      this.modifyBtn = svgCanvas.createSVGElement({
        element: "rect",
        attr: {
          id: "selectorGrip_modify",
          fill: "white",
          width: modifyBtnWidth,
          height: modifyBtnHeight,
          stroke: "#ddd",
          "stroke-width": '2px',
          "stroke-opacity": "1",
          cursor: 'pointer'
        },
      });

      this.modifyEventTag.append(this.modifyBtn);

      //  변경 버튼 텍스트
      this.modifyBtnText = svgCanvas.createSVGElement({
        element: "svg",
        attr: {
          id: "selectorGrip_modify_txt",
          fill: "black",
          width:"24",
          height:"24",
          'xmlns': "http://www.w3.org/2000/svg",
          cursor: 'pointer',
          stroke:"currentColor",
          "stroke-width":"2",
          "stroke-linecap":"round",
          "stroke-linejoin":"round",
          class:"lucide lucide-copy"
        },
      });

      this.modifyBtnText.append(svgCanvas.createSVGElement({
        element: "rect",
        attr: {
          width:"14",
          height:"14",
          "x":"8",
          "y":"8",
          "rx":"2",
          "ry":"2"
        },
      }))
      this.modifyBtnText.append(
          svgCanvas.createSVGElement({
            element: "path",
            attr: {
              d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
            },
          })
      )


      this.modifyEventTag.append(this.modifyBtnText);
    }

    this.deleteEventTag = svgCanvas.createSVGElement({
      element: "a",
      attr: {
        id: "selectorGrip_delete_a",
        display: "none",
      },
    });


    //  삭제 버튼
    this.deleteBtn = svgCanvas.createSVGElement({
      element: "rect",
      attr: {
        id: "selectorGrip_delete",
        fill: "#dc3545",
        width: deleteBtnWidth,
        height: deleteBtnHeight,
        stroke: "#dc3545",
        "stroke-width": '2px',
        "stroke-opacity": "1",
        cursor: 'pointer'
      },
    });

    this.deleteEventTag.append(this.deleteBtn);

    //  삭제 버튼 텍스트
    this.deleteBtnText = svgCanvas.createSVGElement({
      element: 'svg',
      attr: {
        id: 'selectorGrip_delete_txt',
        xmlns:"http://www.w3.org/2000/svg",
        width: deleteBtnWidth,
        height: deleteBtnHeight,
        fill:"none",
        stroke:"currentColor",
        'stroke-width':"2",
        'stroke-linecap':"round",
        'stroke-linejoin':"round",
        className:"lucide lucide-trash-2",
        cursor: 'pointer',
      },
    })
    this.deleteBtnText.append(
        svgCanvas.createSVGElement({
          element: 'path',
          attr: {
            d:'M3 6h18',
            stroke:"#FFFFFF"
          },
        })
    )
    this.deleteBtnText.append(
        svgCanvas.createSVGElement({
          element: 'path',
          attr: {
            d:'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
            stroke:"#FFFFFF"
          },
        })
    )
    this.deleteBtnText.append(
        svgCanvas.createSVGElement({
          element: 'path',
          attr: {
            d:'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
            stroke:"#FFFFFF"
          },
        })
    )
    this.deleteBtnText.append(
        svgCanvas.createSVGElement({
          element: 'line',
          attr: {
            x1:"10",
            x2:"10",
            y1:"11",
            y2:"17",
            stroke:"#FFFFFF"
          },
        })
    )
    this.deleteBtnText.append(
        svgCanvas.createSVGElement({
          element: 'line',
          attr: {
            x1:"14",
            x2:"14",
            y1:"11",
            y2:"17",
            stroke:"#FFFFFF"
          },
        })
    )


    this.deleteEventTag.append(this.deleteBtnText)



    this.copyEventTag = svgCanvas.createSVGElement({
      element: "a",
      attr: {
        id: "selectorGrip_copy_a",
        display: "none",
      },
    });


    //  복사 버튼
    this.copyBtn = svgCanvas.createSVGElement({
      element: "rect",
      attr: {
        id: "selectorGrip_copy",
        fill: "#F7C94A",
        width: copyBtnWidth,
        height: copyBtnHeight,
        stroke: "#F7C94A",
        "stroke-width": '2px',
        "stroke-opacity": "1",
        cursor: 'pointer'
      },
    });

    this.copyEventTag.append(this.copyBtn);

    //  복사 버튼 텍스트
    this.copyBtnText = svgCanvas.createSVGElement({
      element: "svg",
      attr: {
        id: "selectorGrip_modify_txt",
        fill: "none",
        width:"24",
        height:"24",
        'xmlns': "http://www.w3.org/2000/svg",
        cursor: 'pointer',
        stroke:"white",
        "stroke-width":"2",
        "stroke-linecap":"round",
        "stroke-linejoin":"round",
        class:"lucide lucide-copy"
      },
    });

    this.copyBtnText.append(svgCanvas.createSVGElement({
      element: "rect",
      attr: {
        width:"14",
        height:"14",
        "x":"8",
        "y":"8",
        "rx":"2",
        "ry":"2"
      },
    }))
    this.copyBtnText.append(
        svgCanvas.createSVGElement({
          element: "path",
          attr: {
            d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
          },
        })
    )

    this.copyEventTag.append(this.copyBtnText);

    this.selectorMap = {};
    this.selectors = [];
    this.rubberBandBox = null;

    if (document.getElementById("canvasBackground")) {
      return;
    }

    const [width, height] = svgCanvas.curConfig.dimensions;
    const canvasbg = svgCanvas.createSVGElement({
      element: "svg",
      attr: {
        id: "canvasBackground",
        width,
        height,
        x: 0,
        y: 0,
        overflow: isWebkit() ? "none" : "visible", // Chrome 7 has a problem with this when zooming out
        style: "pointer-events:none",
      },
    });

    const rect = svgCanvas.createSVGElement({
      element: "rect",
      attr: {
        width: "100%",
        height: "100%",
        x: 0,
        y: 0,
        "stroke-width": 1,
        stroke: "#000",
        fill: "#FFF",
        style: "pointer-events:none",
      },
    });
    canvasbg.append(rect);
    svgCanvas.getSvgRoot().insertBefore(canvasbg, svgCanvas.getSvgContent());
  }

  /**
   *
   * @param {Element} elem - DOM element to get the selector for
   * @param {module:utilities.BBoxObject} [bbox] - Optional bbox to use for reset (prevents duplicate getBBox call).
   * @returns {Selector} The selector based on the given element
   */
  requestSelector(elem, bbox) {


    if (!elem) {
      return null;
    }

    const N = this.selectors.length;
    // If we've already acquired one for this element, return it.


    if (svgCanvas.getDisplayMobile()) {
      this.modifyEventTag.addEventListener(
          "touchend",
          this.mobileOpen
      );
      this.modifyEventTag.addEventListener(
          "touchstart",
          this.startFunction, {passive: true}
      )
      this.deleteEventTag.addEventListener(
          "touchend",
          this.deleteSVG
      );
      this.deleteEventTag.addEventListener(
          "touchstart",
          this.startFunction, {passive: true}
      )
      this.copyEventTag.addEventListener(
          "touchend",
          this.copyElement
      );
      this.copyEventTag.addEventListener(
          "touchstart",
          this.startFunction, {passive: true}
      )
    } else {
      this.deleteEventTag.addEventListener(
          "mousedown",
          this.startFunction
      )
      this.deleteEventTag.addEventListener(
          "mouseup",
          this.deleteSVG
      );
      this.copyEventTag.addEventListener(
          "mousedown",
          this.startFunction, {passive: true}
      )
      this.copyEventTag.addEventListener(
          "mouseup",
          this.copyElement
      );

    }

    if (typeof this.selectorMap[elem.id] === "object") {
      this.selectorMap[elem.id].locked = true;
      this.selectorMap[elem.id].reset(elem, bbox);
      //this.selectorMap[elem.id].selectedElement = elem;
      // this.selectorMap[elem.id].selectorGroup.setAttribute("display", "inline");
      /*
      if (
        elem.tagName == "g" &&
        Array.prototype.filter.call(elem.children, (child) => {
          return child.tagName == "clipPath";
        }).length > 0
      ) {
        //clipPath(clipmask) 기능을 가진 g태그 제외하고 변경된 정보 상태를 유지한다
        this.selectorMap[elem.id].reset(elem, bbox);
      }
      */
      return this.selectorMap[elem.id];
    }
    for (let i = 0; i < N; ++i) {
      if (!this.selectors[i]?.locked) {
        this.selectors[i].locked = true;
        this.selectors[i].reset(elem, bbox);
        this.selectorMap[elem.id] = this.selectors[i];
        return this.selectors[i];
      }
    }
    // if we reached here, no available selectors were found, we create one
    this.selectors[N] = new Selector(N, elem, bbox);
    this.selectorParentGroup.append(this.selectors[N].selectorGroup);

    if (svgCanvas.getDisplayMobile()) {
      this.selectors[N].selectorGroup.append(this.modifyEventTag);
    }
    this.selectors[N].selectorGroup.append(this.deleteEventTag);
    this.selectors[N].selectorGroup.append(this.copyEventTag);

    this.selectorMap[elem.id] = this.selectors[N];
    return this.selectors[N];
  }

  /**
   * Removes the selector of the given element (hides selection box).
   *
   * @param {Element} elem - DOM element to remove the selector for
   * @returns {void}
   */
  releaseSelector(elem) {
    if (!elem) {
      return;
    }
    const N = this.selectors.length;
    const sel = this.selectorMap[elem.id];
    if (!sel?.locked) {
      // TODO(codedread): Ensure this exists in this module.
      console.warn("WARNING! selector was released but was already unlocked");
    }
    if (svgCanvas.getDisplayMobile()) {
      this.modifyEventTag.removeEventListener(
          "touchend",
          this.mobileOpen
      );
      this.modifyEventTag.removeEventListener(
          "touchstart",
          this.startFunction
      );
      this.deleteEventTag.removeEventListener(
          "touchend",
          this.deleteSVG
      );
      this.deleteEventTag.removeEventListener(
          "touchstart",
          this.startFunction
      );
      this.copyEventTag.addEventListener(
          "touchend",
          this.copyElement
      );
      this.copyEventTag.addEventListener(
          "touchstart",
          this.startFunction, {passive: true}
      )
    } else {
      this.deleteEventTag.removeEventListener(
          "mouseup",
          this.deleteSVG
      );
      this.deleteEventTag.removeEventListener(
          "mousedown",
          this.startFunction, {passive: true}
      );
      this.copyEventTag.addEventListener(
          "mousedown",
          this.startFunction, {passive: true}
      );
      this.copyEventTag.addEventListener(
          "mouseup",
          this.copyElement
      )
    }
    for (let i = 0; i < N; ++i) {
      if (this.selectors[i] && this.selectors[i] === sel) {
        delete this.selectorMap[elem.id];
        sel.locked = true;
        sel.selectedElement = null;
        sel.showGrips(false);

        // remove from DOM and store reference in JS but only if it exists in the DOM
        try {
          sel.selectorGroup.setAttribute("display", "none");
        } catch (e) {
          /* empty fn */
        }

        break;
      }
    }
  }

  /**
   * @returns {SVGRectElement} The rubberBandBox DOM element. This is the rectangle drawn by
   * the user for selecting/zooming
   */
  getRubberBandBox() {
    if (!this.rubberBandBox) {
      this.rubberBandBox = svgCanvas.createSVGElement({
        element: "rect",
        attr: {
          id: "selectorRubberBand",
          fill: "#22C",
          "fill-opacity": 0.15,
          stroke: "#22C",
          "stroke-width": 0.5,
          display: "none",
          style: "pointer-events:none",
        },
      });
      this.selectorParentGroup.append(this.rubberBandBox);
    }
    return this.rubberBandBox;
  }
}

/**
 * An object that creates SVG elements for the canvas.
 *
 * @interface module:select.SVGFactory
 */
/**
 * @function module:select.SVGFactory#createSVGElement
 * @param {module:utilities.EditorContext#addSVGElementsFromJson} jsonMap
 * @returns {SVGElement}
 */
/**
 * @function module:select.SVGFactory#svgRoot
 * @returns {SVGSVGElement}
 */
/**
 * @function module:select.SVGFactory#svgContent
 * @returns {SVGSVGElement}
 */
/**
 * @function module:select.SVGFactory#getZoom
 * @returns {Float} The current zoom level
 */

/**
 * @typedef {GenericArray} module:select.Dimensions
 * @property {Integer} length 2
 * @property {Float} 0 Width
 * @property {Float} 1 Height
 */
/**
 * @typedef {PlainObject} module:select.Config
 * @property {string} imgPath
 * @property {module:select.Dimensions} dimensions
 */

/**
 * Initializes this module.
 * @function module:select.init
 * @param {module:select.Config} config - An object containing configurable parameters (imgPath)
 * @param {module:select.SVGFactory} svgFactory - An object implementing the SVGFactory interface.
 * @returns {void}
 */
export const init = (canvas) => {
  svgCanvas = canvas;
  selectorManager_ = new SelectorManager();
};

/**
 * @function module:select.getSelectorManager
 * @returns {module:select.SelectorManager} The SelectorManager instance.
 */
export const getSelectorManager = () => selectorManager_;
