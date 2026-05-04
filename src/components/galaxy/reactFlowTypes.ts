import type { EdgeTypes, NodeTypes } from 'reactflow';

import { EdgeComponent } from './EdgeComponent';
import { IdeaNodeComponent } from './IdeaNodeComponent';

export const REACT_FLOW_NODE_TYPES: NodeTypes = Object.freeze({
  ideaNode: IdeaNodeComponent,
});

export const REACT_FLOW_EDGE_TYPES: EdgeTypes = Object.freeze({
  evolutionEdge: EdgeComponent,
});
