import type { SVGAttributes } from "vue";

declare module "lucide-vue-next" {
  /**
   * Override the LucideProps interface to allow CSS string values
   * (like "1em", "1.5rem", "24px") for the size prop, in addition to numbers.
   */
  export interface LucideProps extends Partial<SVGAttributes> {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    color?: string;
  }
}
