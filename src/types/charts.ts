import type { ReactNode } from 'react';

export type RechartsTooltipPayload<TPayload> = {
  payload: TPayload;
};

export type RechartsTooltipProps<TPayload> = {
  active?: boolean;
  payload?: Array<RechartsTooltipPayload<TPayload>>;
};

export type RechartsLegendEntry<TPayload> = {
  payload: TPayload;
};

export type RechartsLegendFormatter<TPayload> = (
  value: string,
  entry: RechartsLegendEntry<TPayload>
) => ReactNode;

export type RechartsPieLabelProps = {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
};
