import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodesInitialized,
  ConnectionMode,
  MarkerType,
  type OnConnect,
  type OnSelectionChangeFunc,
} from '@xyflow/react';

import StateNode from './components/StateNode';
import TransitionEdge from './components/TransitionEdge';
import Sidebar from './components/Sidebar';
import Inspector from './components/Inspector';
import JsonModal from './components/JsonModal';
import { initialNodes, initialEdges } from './initialData';
import { toWorkflow, fromWorkflow } from './serialize';
import { layoutGraph, type LayoutDirection } from './layout';
import type { AppNode, AppEdge, WorkflowExport } from './types';
import { HoverContext, type HoverState } from './HoverContext';

const nodeTypes = { state: StateNode };
const edgeTypes = { transition: TransitionEdge };

let idCounter = 1;
const nextId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${idCounter++}`;

/**
 * The hovered/selected state plus *every* transition leaving it and the states
 * those transitions lead to — including "send back" transitions (e.g. back to
 * private), so selecting a state shows everywhere you can go from it.
 */
function computeOutgoing(nodeId: string, edges: AppEdge[]): HoverState {
  const edgeIds = new Set<string>();
  const targetIds = new Set<string>();
  edges.forEach((e) => {
    if (e.source !== nodeId) return;
    edgeIds.add(e.id);
    targetIds.add(e.target);
  });
  return { sourceId: nodeId, edgeIds, targetIds };
}

function Editor() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>(initialEdges);
  const { screenToFlowPosition, fitView, getNodes, getEdges } = useReactFlow();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [hover, setHover] = useState<HoverState>(null);

  const onConnect: OnConnect = useCallback(
    (conn) => {
      const id = nextId('t');
      const newEdge: AppEdge = {
        ...conn,
        id,
        type: 'transition',
        data: { title: 'transition', permission: '' },
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#94a3b8' },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: ns, edges: es }) => {
    setSelectedNodeId(ns[0]?.id ?? null);
    setSelectedEdgeId(es[0]?.id ?? null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.getData('application/reactflow') !== 'state') return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = nextId('s');
      setNodes((nds) =>
        nds.concat({
          id,
          type: 'state',
          position,
          data: { label: 'New state', color: '#6366f1', permissions: {} },
        }),
      );
    },
    [screenToFlowPosition, setNodes],
  );

  const addState = useCallback(() => {
    const id = nextId('s');
    setNodes((nds) =>
      nds.concat({
        id,
        type: 'state',
        position: { x: 200 + Math.round((idCounter % 5) * 40), y: 80 + Math.round((idCounter % 5) * 40) },
        data: { label: 'New state', color: '#6366f1', permissions: {} },
      }),
    );
  }, [setNodes]);

  const autoAlign = useCallback(
    async (direction: LayoutDirection) => {
      // Read live state so we get the *measured* node sizes (not stale closures).
      const { nodes: ln, edges: le } = await layoutGraph(
        getNodes() as AppNode[],
        getEdges() as AppEdge[],
        direction,
      );
      setNodes(ln);
      setEdges(le);
      // Fit the view once the new positions have painted.
      requestAnimationFrame(() => fitView({ duration: 500, padding: 0.15 }));
    },
    [getNodes, getEdges, setNodes, setEdges, fitView],
  );

  const applyWorkflow = useCallback(
    (wf: WorkflowExport) => {
      const { nodes: n, edges: ed } = fromWorkflow(wf);
      setNodes(n);
      setEdges(ed);
      // Imported positions are placeholders — auto-align once nodes are measured.
      setTimeout(() => autoAlign('LR'), 250);
    },
    [setNodes, setEdges, autoAlign],
  );

  // On hover, light up the hovered state plus all its outgoing transitions.
  const onNodeMouseEnter = useCallback(
    (_: unknown, node: AppNode) => {
      setHover(computeOutgoing(node.id, getEdges() as AppEdge[]));
    },
    [getEdges],
  );

  const onNodeMouseLeave = useCallback(() => setHover(null), []);

  // Drop the baked route on a node's edges while it's dragged, so they follow
  // the node live (floating); a later Auto-align re-routes them cleanly.
  const onNodeDragStart = useCallback(
    (_: unknown, node: AppNode) => {
      setEdges((es) =>
        es.map((e) =>
          (e.source === node.id || e.target === node.id) && e.data?.route
            ? { ...e, data: { ...e.data, route: undefined } as AppEdge['data'] }
            : e,
        ),
      );
    },
    [setEdges],
  );

  // Tidy the layout once, as soon as React Flow has measured the nodes (so the
  // router has real node sizes). Using the measured signal — rather than a
  // timer — also survives React 18 StrictMode's double-mount in dev.
  const nodesInitialized = useNodesInitialized();
  const didInitialLayout = useRef(false);
  useEffect(() => {
    if (nodesInitialized && !didInitialLayout.current) {
      didInitialLayout.current = true;
      autoAlign('LR');
    }
  }, [nodesInitialized, autoAlign]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId],
  );

  // Keep the forward highlight + flow animation while a state stays selected;
  // a live hover takes precedence over the selection.
  const selectionHighlight = useMemo(
    () => (selectedNodeId ? computeOutgoing(selectedNodeId, edges) : null),
    [selectedNodeId, edges],
  );
  const activeHighlight = hover ?? selectionHighlight;

  const workflow = useMemo(
    () =>
      toWorkflow(nodes, edges, {
        id: 'example_workflow',
        title: 'Example Publication Workflow',
        description: 'A simple private → pending → published flow.',
      }),
    [nodes, edges],
  );

  return (
    <HoverContext.Provider value={activeHighlight}>
    <div className="flex h-full flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-bold text-slate-800">Workflow Editor</h1>
          <span className="text-xs text-slate-400">Plone · Volto · Aurora — POC</span>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={addState}
          >
            + Add state
          </button>
          {/* Auto-align: ELK layered layout, horizontal by default with a vertical toggle. */}
          <div className="flex overflow-hidden rounded-lg border border-violet-200">
            <button
              className="bg-violet-50 px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
              onClick={() => autoAlign('LR')}
              title="Tidy up the layout left-to-right"
            >
              ✨ Auto-align
            </button>
            <button
              className="border-l border-violet-200 bg-violet-50 px-2 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
              onClick={() => autoAlign('TB')}
              title="Auto-align top-to-bottom"
            >
              ↧
            </button>
          </div>
          <button
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
            onClick={() => setShowJson(true)}
          >
            JSON export / import
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="relative flex-1" onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStart={onNodeDragStart}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            deleteKeyCode={['Backspace', 'Delete']}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#cbd5e1" />
            <Controls />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => (n.data as AppNode['data'])?.color ?? '#6366f1'}
            />
          </ReactFlow>
        </div>
        <Inspector node={selectedNode} edge={selectedEdge} nodes={nodes} edges={edges} />
      </div>

      {showJson && (
        <JsonModal
          workflow={workflow}
          onClose={() => setShowJson(false)}
          onApply={applyWorkflow}
        />
      )}
    </div>
    </HoverContext.Provider>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
