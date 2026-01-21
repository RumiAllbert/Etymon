import type { Node, Edge } from "@xyflow/react";
import type { Definition } from "@/utils/schema";
import {
  WORD_CHUNK_PADDING,
  ORIGIN_PADDING,
  VERTICAL_SPACING,
} from "./constants";

/**
 * Calculate layout for etymology graph nodes
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const newNodes: Node[] = [];

  const inputNode = nodes.find((node) => node.type === "inputNode");
  const inputWidth = inputNode?.measured?.width ?? 0;
  const inputHeight = inputNode?.measured?.height ?? 0;
  let nextY = inputHeight + VERTICAL_SPACING;

  if (inputNode) {
    newNodes.push({
      ...inputNode,
      position: { x: -inputWidth / 2, y: 0 },
    });
  }

  // Measure word chunks
  let totalWordChunkWidth = 0;
  nodes.forEach((node) => {
    if (node.type === "wordChunk") {
      totalWordChunkWidth += (node.measured?.width ?? 0) + WORD_CHUNK_PADDING;
    }
  });

  // Position word chunks
  let lastWordChunkX = 0;
  nodes.forEach((node) => {
    if (node.type === "wordChunk") {
      newNodes.push({
        ...node,
        position: {
          x: -totalWordChunkWidth / 2 + lastWordChunkX,
          y: nextY,
        },
      });
      lastWordChunkX += (node.measured?.width ?? 0) + WORD_CHUNK_PADDING;
    }
  });

  nextY +=
    VERTICAL_SPACING +
    (nodes.find((node) => node.type === "wordChunk")?.measured?.height ?? 0);

  // Position origins
  let totalOriginWidth = 0;
  nodes.forEach((node) => {
    if (node.type === "origin") {
      totalOriginWidth += (node.measured?.width ?? 0) + ORIGIN_PADDING;
    }
  });

  let lastOriginX = 0;
  nodes.forEach((node) => {
    if (node.type === "origin") {
      newNodes.push({
        ...node,
        position: {
          x: -totalOriginWidth / 2 + lastOriginX,
          y: nextY,
        },
      });
      lastOriginX += (node.measured?.width ?? 0) + ORIGIN_PADDING;
    }
  });

  nextY +=
    VERTICAL_SPACING +
    Math.max(
      ...nodes
        .filter((node) => node.type === "origin")
        .map((node) => node.measured?.height ?? 0)
    );

  // Position combinations by layer
  const combinationsByY = new Map<number, Node[]>();
  nodes.forEach((node) => {
    if (node.type === "combined") {
      const layer = node.position.y / VERTICAL_SPACING - 2;
      if (!combinationsByY.has(layer)) {
        combinationsByY.set(layer, []);
      }
      combinationsByY.get(layer)!.push(node);
    }
  });

  const sortedLayers = Array.from(combinationsByY.keys()).sort((a, b) => a - b);
  sortedLayers.forEach((layer) => {
    const layerNodes = combinationsByY.get(layer)!;
    let totalWidth = 0;
    layerNodes.forEach((node) => {
      totalWidth += (node.measured?.width ?? 0) + ORIGIN_PADDING;
    });

    let lastX = 0;
    layerNodes.forEach((node) => {
      newNodes.push({
        ...node,
        position: {
          x: -totalWidth / 2 + lastX,
          y: nextY,
        },
      });
      lastX += (node.measured?.width ?? 0) + ORIGIN_PADDING;
    });
    nextY +=
      VERTICAL_SPACING +
      Math.max(...layerNodes.map((node) => node.measured?.height ?? 0));
  });

  return { nodes: newNodes, edges };
}

/**
 * Create initial nodes and edges from a definition
 */
export function createInitialNodes(
  definition: Definition,
  handleWordSubmit: (word: string) => Promise<void>,
  initialWord?: string,
  onExploreRoot?: (root: string) => void
): { initialNodes: Node[]; initialEdges: Edge[] } {
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  initialNodes.push({
    id: "input1",
    type: "inputNode",
    position: { x: 0, y: 0 },
    data: { onSubmit: handleWordSubmit, initialWord },
  });

  // Add word parts and their origins
  definition.parts.forEach((part, index) => {
    initialNodes.push({
      id: part.id,
      type: "wordChunk",
      position: { x: 0, y: 0 },
      data: {
        text: part.text,
        isLastChunk: index === definition.parts.length - 1,
      },
    });

    const originId = `origin-${part.id}`;
    initialNodes.push({
      id: originId,
      type: "origin",
      position: { x: 0, y: 0 },
      data: {
        originalWord: part.originalWord,
        origin: part.origin,
        meaning: part.meaning,
        onExploreRoot,
      },
    });

    initialEdges.push({
      id: `edge-${part.id}-${originId}`,
      source: part.id,
      target: originId,
      type: "straight",
      style: { stroke: "#4B5563", strokeWidth: 1 },
      animated: true,
    });
  });

  // Add combinations layer by layer
  definition.combinations.forEach((layer, layerIndex) => {
    const y = (layerIndex + 2) * VERTICAL_SPACING;

    layer.forEach((combination) => {
      const sourceOrigins = combination.sourceIds
        .map((id) => {
          const part = definition.parts.find((p) => p.id === id);
          if (part) return part.origin;
          const prevCombo = definition.combinations
            .flat()
            .find((c) => c.id === id);
          return prevCombo?.origin;
        })
        .filter(Boolean);

      const mainOrigin = sourceOrigins[0] || "";

      initialNodes.push({
        id: combination.id,
        type: "combined",
        position: { x: 0, y },
        data: {
          text: combination.text,
          definition: combination.definition,
          origin: mainOrigin,
        },
      });

      combination.sourceIds.forEach((sourceId) => {
        const isPart = definition.parts.find((p) => p.id === sourceId);
        const actualSourceId = isPart ? `origin-${sourceId}` : sourceId;

        initialEdges.push({
          id: `edge-${actualSourceId}-${combination.id}`,
          source: actualSourceId,
          target: combination.id,
          type: "straight",
          style: { stroke: "#4B5563", strokeWidth: 1 },
          animated: true,
        });
      });
    });
  });

  return { initialNodes, initialEdges };
}
