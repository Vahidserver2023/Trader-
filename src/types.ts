export type TabType = 
  | 'phase14_production'
  | 'phase13_termux'
  | 'phase12_telegram'
  | 'phase11_dashboard'
  | 'phase5_risk'
  | 'phase4_strategies'
  | 'phase3_engine'
  | 'phase2_data'
  | 'phase1_core'
  | 'architecture' 
  | 'dataflow' 
  | 'folders' 
  | 'database' 
  | 'strategy_risk' 
  | 'ai_engine' 
  | 'exchange' 
  | 'termux_android' 
  | 'roadmap';

export interface DatabaseTable {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    constraints?: string;
    description: string;
  }[];
  indexes: string[];
}

export interface StrategySpec {
  id: string;
  name: string;
  type: string;
  description: string;
  bestRegimes: string[];
  indicatorsUsed: string[];
  entryCondition: string;
  exitCondition: string;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  titleFa: string;
  status: 'completed' | 'in_review' | 'pending';
  deliverables: string[];
  testRequirements: string[];
}
