import { getLineHeight } from "@excalidraw/common";
import { API } from "@excalidraw/excalidraw/tests/helpers/api";

import {
  FONT_FAMILY,
  ROUNDNESS,
  TEXT_ALIGN,
  VERTICAL_ALIGN,
} from "@excalidraw/common";

import {
  computeContainerDimensionForBoundText,
  getContainerBoundTextPadding,
  getContainerCoords,
  getBoundTextMaxWidth,
  getBoundTextMaxHeight,
  computeBoundTextPosition,
} from "../src/textElement";
import { detectLineHeight, getLineHeightInPx } from "../src/textMeasurements";

import type { ExcalidrawTextElementWithContainer } from "../src/types";

describe("Test measureText", () => {
  describe("Test getContainerCoords", () => {
    const params = { width: 200, height: 100, x: 10, y: 20 };

    it("should compute coords correctly when ellipse", () => {
      const element = API.createElement({
        type: "ellipse",
        ...params,
      });
      expect(getContainerCoords(element)).toEqual({
        x: 44.2893218813452455,
        y: 39.64466094067262,
      });
    });

    it("should compute coords correctly when rectangle", () => {
      const element = API.createElement({
        type: "rectangle",
        ...params,
      });
      expect(getContainerCoords(element)).toEqual({
        x: 15,
        y: 25,
      });
    });

    it("should compute coords correctly when rectangle with adaptive radius", () => {
      const element = API.createElement({
        type: "rectangle",
        ...params,
        roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
      });
      // min(200, 100) = 100, which is <= 128 cutoff so radius = 100 * 0.25 = 25
      // padding = max(5, 25 / 2) = 12.5
      expect(getContainerCoords(element)).toEqual({
        x: 22.5,
        y: 32.5,
      });
    });

    it("should compute coords correctly when diamond", () => {
      const element = API.createElement({
        type: "diamond",
        ...params,
      });
      expect(getContainerCoords(element)).toEqual({
        x: 65,
        y: 50,
      });
    });

    it("should use explicit containerPadding when set", () => {
      const element = API.createElement({
        type: "rectangle",
        ...params,
        containerPadding: { x: 20, y: 10 },
      });
      expect(getContainerCoords(element)).toEqual({
        x: 30, // 10 + 20
        y: 30, // 20 + 10
      });
    });

    it("should use explicit containerPadding over adaptive radius", () => {
      const element = API.createElement({
        type: "rectangle",
        ...params,
        roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
        containerPadding: { x: 3, y: 7 },
      });
      // containerPadding takes precedence over computed adaptive-radius padding
      expect(getContainerCoords(element)).toEqual({
        x: 13, // 10 + 3
        y: 27, // 20 + 7
      });
    });
  });

  describe("Test computeContainerDimensionForBoundText", () => {
    const params = {
      width: 178,
      height: 194,
    };

    it("should compute container height correctly for rectangle", () => {
      const element = API.createElement({
        type: "rectangle",
        ...params,
      });
      expect(computeContainerDimensionForBoundText(150, element.type)).toEqual(
        160,
      );
    });

    it("should compute container height correctly for ellipse", () => {
      const element = API.createElement({
        type: "ellipse",
        ...params,
      });
      expect(computeContainerDimensionForBoundText(150, element.type)).toEqual(
        226,
      );
    });

    it("should compute container height correctly for diamond", () => {
      const element = API.createElement({
        type: "diamond",
        ...params,
      });
      expect(computeContainerDimensionForBoundText(150, element.type)).toEqual(
        320,
      );
    });

    it("should compute container dimension for rectangle with adaptive radius", () => {
      const element = API.createElement({
        type: "rectangle",
        ...params,
        roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
      });
      // Default adaptive radius = 32, half = 16, so padding = max(5, 16) * 2 = 32
      expect(
        computeContainerDimensionForBoundText(150, element.type, element),
      ).toEqual(182); // ceil(150) + 32
    });

    it("should fall back to base padding for rectangle without container arg", () => {
      expect(computeContainerDimensionForBoundText(150, "rectangle")).toEqual(
        160,
      );
    });
  });

  describe("Test getBoundTextMaxWidth", () => {
    const params = {
      width: 178,
      height: 194,
    };

    it("should return max width when container is rectangle", () => {
      const container = API.createElement({ type: "rectangle", ...params });
      expect(getBoundTextMaxWidth(container, null)).toBe(168);
    });

    it("should return max width when container is ellipse", () => {
      const container = API.createElement({ type: "ellipse", ...params });
      expect(getBoundTextMaxWidth(container, null)).toBe(116);
    });

    it("should return max width when container is diamond", () => {
      const container = API.createElement({ type: "diamond", ...params });
      expect(getBoundTextMaxWidth(container, null)).toBe(79);
    });

    it("should return max width when container is rectangle with adaptive radius", () => {
      const container = API.createElement({
        type: "rectangle",
        ...params,
        roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
      });
      // min(178, 194) = 178 > 128 cutoff, so radius = 32, half = 16
      // padding = max(5, 16) = 16, width - 16 * 2 = 178 - 32 = 146
      expect(getBoundTextMaxWidth(container, null)).toBe(146);
    });

    it("should use containerPadding when set on rectangle", () => {
      const container = API.createElement({
        type: "rectangle",
        ...params,
        containerPadding: { x: 20, y: 15 },
      });
      // width - containerPadding.x * 2 = 178 - 40 = 138
      expect(getBoundTextMaxWidth(container, null)).toBe(138);
    });
  });

  describe("Test getBoundTextMaxHeight", () => {
    const params = {
      width: 178,
      height: 194,
      id: '"container-id',
    };

    const boundTextElement = API.createElement({
      type: "text",
      id: "text-id",
      x: 560.51171875,
      y: 202.033203125,
      width: 154,
      height: 175,
      fontSize: 20,
      fontFamily: 1,
      text: "Excalidraw is a\nvirtual \nopensource \nwhiteboard for \nsketching \nhand-drawn like\ndiagrams",
      textAlign: "center",
      verticalAlign: "middle",
      containerId: params.id,
    }) as ExcalidrawTextElementWithContainer;

    it("should return max height when container is rectangle", () => {
      const container = API.createElement({ type: "rectangle", ...params });
      expect(getBoundTextMaxHeight(container, boundTextElement)).toBe(184);
    });

    it("should return max height when container is ellipse", () => {
      const container = API.createElement({ type: "ellipse", ...params });
      expect(getBoundTextMaxHeight(container, boundTextElement)).toBe(127);
    });

    it("should return max height when container is diamond", () => {
      const container = API.createElement({ type: "diamond", ...params });
      expect(getBoundTextMaxHeight(container, boundTextElement)).toBe(87);
    });

    it("should return max height when container is rectangle with adaptive radius", () => {
      const container = API.createElement({
        type: "rectangle",
        ...params,
        roundness: { type: ROUNDNESS.ADAPTIVE_RADIUS },
      });
      // min(178, 194) = 178 > 128 cutoff, so radius = 32, half = 16
      // padding = max(5, 16) = 16, height - 16 * 2 = 194 - 32 = 162
      expect(getBoundTextMaxHeight(container, boundTextElement)).toBe(162);
    });

    it("should use containerPadding when set on rectangle", () => {
      const container = API.createElement({
        type: "rectangle",
        ...params,
        containerPadding: { x: 20, y: 15 },
      });
      // height - containerPadding.y * 2 = 194 - 30 = 164
      expect(getBoundTextMaxHeight(container, boundTextElement)).toBe(164);
    });

    it("should return max height when container is arrow", () => {
      const container = API.createElement({
        type: "arrow",
        ...params,
      });
      expect(getBoundTextMaxHeight(container, boundTextElement)).toBe(194);
    });

    it("should return max height when container is arrow and height is less than threshold", () => {
      const container = API.createElement({
        type: "arrow",
        ...params,
        height: 70,
        boundElements: [{ type: "text", id: "text-id" }],
      });

      expect(getBoundTextMaxHeight(container, boundTextElement)).toBe(
        boundTextElement.height,
      );
    });
  });
});

const textElement = API.createElement({
  type: "text",
  text: "Excalidraw is a\nvirtual \nopensource \nwhiteboard for \nsketching \nhand-drawn like\ndiagrams",
  fontSize: 20,
  fontFamily: 1,
  height: 175,
});

describe("Test detectLineHeight", () => {
  it("should return correct line height", () => {
    expect(detectLineHeight(textElement)).toBe(1.25);
  });
});

describe("Test getLineHeightInPx", () => {
  it("should return correct line height", () => {
    expect(
      getLineHeightInPx(textElement.fontSize, textElement.lineHeight),
    ).toBe(25);
  });
});

describe("Test getDefaultLineHeight", () => {
  it("should return line height using default font family when not passed", () => {
    //@ts-ignore
    expect(getLineHeight()).toBe(1.25);
  });

  it("should return line height using default font family for unknown font", () => {
    const UNKNOWN_FONT = 5;
    expect(getLineHeight(UNKNOWN_FONT)).toBe(1.25);
  });

  it("should return correct line height", () => {
    expect(getLineHeight(FONT_FAMILY.Cascadia)).toBe(1.2);
  });
});

describe("Test computeBoundTextPosition", () => {
  const createMockElementsMap = () => new Map();

  // Helper function to create rectangle test case with 90-degree rotation
  const createRotatedRectangleTestCase = (
    textAlign: string,
    verticalAlign: string,
  ) => {
    const container = API.createElement({
      type: "rectangle",
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      angle: (Math.PI / 2) as any, // 90 degrees
    });

    const boundTextElement = API.createElement({
      type: "text",
      width: 80,
      height: 40,
      text: "hello darkness my old friend",
      textAlign: textAlign as any,
      verticalAlign: verticalAlign as any,
      containerId: container.id,
    }) as ExcalidrawTextElementWithContainer;

    const elementsMap = createMockElementsMap();

    return { container, boundTextElement, elementsMap };
  };

  describe("90-degree rotation with all alignment combinations", () => {
    // Test all 9 combinations of horizontal (left, center, right) and vertical (top, middle, bottom) alignment

    it("should position text with LEFT + TOP alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(TEXT_ALIGN.LEFT, VERTICAL_ALIGN.TOP);

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(185, 1);
      expect(result.y).toBeCloseTo(75, 1);
    });

    it("should position text with LEFT + MIDDLE alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(TEXT_ALIGN.LEFT, VERTICAL_ALIGN.MIDDLE);

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(160, 1);
      expect(result.y).toBeCloseTo(75, 1);
    });

    it("should position text with LEFT + BOTTOM alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(TEXT_ALIGN.LEFT, VERTICAL_ALIGN.BOTTOM);

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(135, 1);
      expect(result.y).toBeCloseTo(75, 1);
    });

    it("should position text with CENTER + TOP alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(TEXT_ALIGN.CENTER, VERTICAL_ALIGN.TOP);

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(185, 1);
      expect(result.y).toBeCloseTo(130, 1);
    });

    it("should position text with CENTER + MIDDLE alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(
          TEXT_ALIGN.CENTER,
          VERTICAL_ALIGN.MIDDLE,
        );

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(160, 1);
      expect(result.y).toBeCloseTo(130, 1);
    });

    it("should position text with CENTER + BOTTOM alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(
          TEXT_ALIGN.CENTER,
          VERTICAL_ALIGN.BOTTOM,
        );

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(135, 1);
      expect(result.y).toBeCloseTo(130, 1);
    });

    it("should position text with RIGHT + TOP alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(TEXT_ALIGN.RIGHT, VERTICAL_ALIGN.TOP);

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(185, 1);
      expect(result.y).toBeCloseTo(185, 1);
    });

    it("should position text with RIGHT + MIDDLE alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(TEXT_ALIGN.RIGHT, VERTICAL_ALIGN.MIDDLE);

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(160, 1);
      expect(result.y).toBeCloseTo(185, 1);
    });

    it("should position text with RIGHT + BOTTOM alignment at 90-degree rotation", () => {
      const { container, boundTextElement, elementsMap } =
        createRotatedRectangleTestCase(TEXT_ALIGN.RIGHT, VERTICAL_ALIGN.BOTTOM);

      const result = computeBoundTextPosition(
        container,
        boundTextElement,
        elementsMap,
      );

      expect(result.x).toBeCloseTo(135, 1);
      expect(result.y).toBeCloseTo(185, 1);
    });
  });
});
